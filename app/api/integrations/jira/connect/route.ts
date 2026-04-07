import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { connectJira, getUserByToken } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const user = await getUserByToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    return NextResponse.json(await connectJira(user.id, body));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Connection failed" },
      { status: 400 },
    );
  }
}
