import type { Server } from "socket.io";

type PendingRequest = {
  resolve: (text: string) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

const pending = new Map<string, PendingRequest>();
const AGENT_ROOM = "browser_agent";
const TIMEOUT_MS = 120_000;

function requestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function setupAgentBridge(io: Server): void {
  io.on("connection", (socket) => {
    socket.on("agent_register", () => {
      socket.join(AGENT_ROOM);
      console.log(`[agent-bridge] local agent connected: ${socket.id}`);
      socket.emit("agent_ready");
    });

    socket.on("agent_response", (payload: { requestId: string; text: string; error?: string }) => {
      const req = pending.get(payload.requestId);
      if (!req) return;

      clearTimeout(req.timer);
      pending.delete(payload.requestId);

      if (payload.error) {
        req.reject(new Error(payload.error));
      } else {
        req.resolve(payload.text);
      }
    });
  });
}

export function isAgentOnline(io: Server): boolean {
  const room = io.sockets.adapter.rooms.get(AGENT_ROOM);
  return (room?.size ?? 0) > 0;
}

export async function dispatchToLocalAgent(io: Server, phone: string, prompt: string): Promise<string> {
  if (!isAgentOnline(io)) {
    throw new Error(
      "Browser agent is offline. Run `npm run agent:daemon` on your PC first."
    );
  }

  const id = requestId();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error("Browser agent timed out (120s). Try a simpler command."));
    }, TIMEOUT_MS);

    pending.set(id, { resolve, reject, timer });

    io.to(AGENT_ROOM).emit("agent_command", {
      requestId: id,
      phone,
      prompt,
    });
  });
}

export async function runAgentLocally(prompt: string): Promise<string> {
  const { handleBrowserPrompt } = await import("@/agent/runner");
  return handleBrowserPrompt(prompt);
}
