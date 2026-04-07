import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

declare global {
  // eslint-disable-next-line no-var
  var __planningPokerIO: SocketIOServer | undefined;
}

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function bootstrap() {
  await app.prepare();

  const server = createServer((req, res) => {
    handle(req, res).catch((error) => {
      res.statusCode = 500;
      res.end("Unexpected server error");
      console.error(error);
    });
  });

  const io = new SocketIOServer(server, {
    path: "/socket.io",
    cors: {
      origin: true,
      credentials: true,
    },
  });
  global.__planningPokerIO = io;

  io.on("connection", (socket) => {
    socket.on("planning:join", (sessionId: string) => {
      if (typeof sessionId === "string" && sessionId.trim()) {
        socket.join(`session:${sessionId}`);
      }
    });

    socket.on("planning:leave", (sessionId: string) => {
      if (typeof sessionId === "string" && sessionId.trim()) {
        socket.leave(`session:${sessionId}`);
      }
    });
  });

  server.listen(port, hostname, () => {
    console.log(`Planning Poker running at http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
