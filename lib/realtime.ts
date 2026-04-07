import type { Server as SocketIOServer } from "socket.io";

export function getIO() {
  return global.__planningPokerIO as SocketIOServer | undefined;
}

export function emitSessionEvent(
  sessionId: string,
  event: string,
  payload: Record<string, unknown>,
) {
  const io = getIO();
  if (!io) return;
  io.to(`session:${sessionId}`).emit(event, payload);
}
