import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { getDashboard, getUserByToken } from "@/lib/store";

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = await getUserByToken(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dashboard = await getDashboard(user.id);
  return NextResponse.json(
    dashboard.jiraConnection || { connected: false, projectKeys: [], storyPointsField: "customfield_10016" },
  );
}
