import { NextResponse } from "next/server";
import { registerWorkspace } from "@/lib/store";
import { SESSION_COOKIE } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = await registerWorkspace(body);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 400 },
    );
  }
}
