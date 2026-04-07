import { PlanningRoom } from "@/components/planning-room";
import { requireUser } from "@/lib/auth";
import { getSession } from "@/lib/store";

export default async function SessionRoomPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const user = await requireUser();
  const session = await getSession(sessionId, user.id);

  return <PlanningRoom initialSession={session} currentUserId={user.id} />;
}
