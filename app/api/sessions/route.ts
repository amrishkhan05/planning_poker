import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { createSession, getUserByToken, listSessions } from "@/lib/store";

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = await getUserByToken(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await listSessions(user.id));
}

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const user = await getUserByToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    return NextResponse.json(
      await createSession({
        userId: user.id,
        title: body.title,
        mode: body.mode,
        scale: body.scale,
        customValues: body.customValues,
        participantIds: body.participantIds || [],
      }),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create session" },
      { status: 400 },
    );
  }
}
