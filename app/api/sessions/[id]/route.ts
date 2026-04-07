import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { emitSessionEvent } from "@/lib/realtime";
import { getSession, getUserByToken, updateSession } from "@/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = await getUserByToken(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    return NextResponse.json(await getSession(id, user.id));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Session not found" },
      { status: 404 },
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const user = await getUserByToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const session = await updateSession(id, user.id, body);
    emitSessionEvent(id, "session:updated", { sessionId: id });
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 400 },
    );
  }
}
