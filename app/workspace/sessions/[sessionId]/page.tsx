import { PlanningRoom } from "@/components/planning-room";
import { requireUser } from "@/lib/auth";
import { ensureParticipant, getSession } from "@/lib/store";

export default async function SessionRoomPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const user = await requireUser();
  await ensureParticipant(sessionId, user.id);
  const session = await getSession(sessionId, user.id);

  return <PlanningRoom initialSession={session} currentUserId={user.id} />;
}
