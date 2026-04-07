import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { getSessionHistory, getUserByToken } from "@/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = await getUserByToken(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    return NextResponse.json(await getSessionHistory(id, user.id));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "History not found" },
      { status: 404 },
    );
  }
}
