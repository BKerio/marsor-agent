import "dotenv/config";
import { io } from "socket.io-client";
import { handleBrowserPrompt } from "@/agent/runner";
import { printAgentBanner } from "@/agent/banner";
import { connectDb } from "@/db/connect";
import {
  printInfo,
  printMuted,
  printReplyBox,
  printError,
  printStatus,
  theme,
} from "@/agent/ui";

const serverUrl = process.env.AGENT_SERVER_URL ?? "http://localhost:3000";

connectDb().catch(console.error);

const socket = io(serverUrl, {
  reconnection: true,
  reconnectionDelay: 2000,
});

socket.on("connect", () => {
  printStatus(`Connected to ${serverUrl} (${socket.id})`);
  socket.emit("agent_register");
});

socket.on("agent_ready", async () => {
  await printAgentBanner();
  printMuted("Waiting for WhatsApp commands...");
  printMuted('Text your bot: "browser on" then "search for AI news"');
});

socket.on("agent_command", async (payload: { requestId: string; phone: string; prompt: string }) => {
  printInfo("Command from:", payload.phone);
  printMuted(payload.prompt);

  try {
    const text = await handleBrowserPrompt(payload.prompt);
    socket.emit("agent_response", { requestId: payload.requestId, text });
    printReplyBox(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    printError(message);
    socket.emit("agent_response", { requestId: payload.requestId, text: "", error: message });
  }
});

socket.on("disconnect", (reason) => {
  printMuted(`Disconnected: ${reason}. Reconnecting...`);
});

process.on("SIGINT", () => {
  console.log(`\n${theme.orange}Shutting down MARSOR daemon...${theme.reset}`);
  socket.disconnect();
  process.exit(0);
});
