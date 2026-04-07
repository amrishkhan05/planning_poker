import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { emitSessionEvent } from "@/lib/realtime";
import { getUserByToken, importJiraIssues } from "@/lib/store";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const user = await getUserByToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { id } = await params;
    const session = await importJiraIssues(id, user.id, body);
    emitSessionEvent(id, "session:updated", { sessionId: id });
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 400 },
    );
  }
}
