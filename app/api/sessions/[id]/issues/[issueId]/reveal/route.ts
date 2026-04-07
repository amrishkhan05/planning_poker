import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { emitSessionEvent } from "@/lib/realtime";
import { getUserByToken, revealVotes } from "@/lib/store";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string; issueId: string }> },
) {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const user = await getUserByToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id, issueId } = await params;
    const session = await revealVotes(id, issueId, user.id);
    emitSessionEvent(id, "votes:revealed", { sessionId: id, issueId });
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reveal failed" },
      { status: 400 },
    );
  }
}
