import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { emitSessionEvent } from "@/lib/realtime";
import { closeSession, getUserByToken } from "@/lib/store";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const user = await getUserByToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const session = await closeSession(id, user.id);
    emitSessionEvent(id, "session:updated", { sessionId: id });
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to close session" },
      { status: 400 },
    );
  }
}
