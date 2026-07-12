import "dotenv/config";
import { io } from "socket.io-client";
import { handleBrowserPrompt } from "@/agent/runner";
import { printAgentBanner } from "@/agent/banner";

import { connectDb } from "@/db/connect";
ii
const serverUrl = process.env.AGENT_SERVER_URL ?? "http://localhost:3000";

connectDb().catch(console.error);

const socket = io(serverUrl, {
  reconnection: true,
  reconnectionDelay: 2000,
});

socket.on("connect", () => {
  console.log(`Connected to ${serverUrl} (${socket.id})`);
  socket.emit("agent_register");
});

socket.on("agent_ready", async () => {
  await printAgentBanner();
  console.log("Registered as browser agent. Waiting for commands...");
  console.log('Text your WhatsApp bot: "browser on" then "search for AI news"');
});

socket.on("agent_command", async (payload: { requestId: string; phone: string; prompt: string }) => {
  console.log(`\n[command from ${payload.phone}] ${payload.prompt}`);

  try {
    const text = await handleBrowserPrompt(payload.prompt);
    socket.emit("agent_response", { requestId: payload.requestId, text });
    console.log(`[reply] ${text.slice(0, 120)}${text.length > 120 ? "..." : ""}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[error]", message);
    socket.emit("agent_response", { requestId: payload.requestId, text: "", error: message });
  }
});

socket.on("disconnect", (reason) => {
  console.log(`Disconnected: ${reason}. Reconnecting...`);
});

process.on("SIGINT", () => {
  console.log("\nShutting down agent daemon...");
  socket.disconnect();
  process.exit(0);
});
