import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { emitSessionEvent } from "@/lib/realtime";
import { finalizeIssue, getUserByToken } from "@/lib/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; issueId: string }> },
) {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const user = await getUserByToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { id, issueId } = await params;
    const session = await finalizeIssue(id, issueId, user.id, body.finalEstimate);
    emitSessionEvent(id, "issue:finalized", { sessionId: id, issueId });
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Finalize failed" },
      { status: 400 },
    );
  }
}
