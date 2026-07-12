import type { Server } from "socket.io";
import { dispatchToLocalAgent, isAgentOnline, runAgentLocally } from "@/agent/bridge";
import { sendMessage } from "@/whatsapp/client";
import { getSession, setFlow } from "@/bot/session";

const BROWSER_ON = new Set(["browser on", "browser start", "brave on", "agent on"]);
const BROWSER_OFF = new Set(["browser off", "browser stop", "brave off", "agent off", "menu", "exit"]);

function isAuthorized(phone: string): boolean {
  const allowed = process.env.AGENT_ALLOWED_PHONES;
  if (!allowed) return true;
  const list = allowed.split(",").map((p) => p.trim()).filter(Boolean);
  return list.includes(phone);
}

function extractBrowserCommand(input: string): string | null {
  const lower = input.toLowerCase().trim();
  for (const prefix of ["browser:", "brave:", "browse:"]) {
    if (lower.startsWith(prefix)) {
      return input.slice(prefix.length).trim();
    }
  }
  return null;
}

export async function handleBrowserAgentMessage(
  io: Server,
  phone: string,
  input: string,
  normalized: string
): Promise<boolean> {
  if (!isAuthorized(phone)) return false;

  const session = await getSession(phone);
  const prefixed = extractBrowserCommand(input);

  if (BROWSER_ON.has(normalized)) {
    await setFlow(phone, "browser_agent");
    const online = isAgentOnline(io);
    await sendMessage(phone, {
      type: "text",
      text:
        "🌐 *Browser Agent Active*\n\n" +
        "Send natural language commands like:\n" +
        '• "search for latest AI news"\n' +
        '• "open youtube.com"\n' +
        '• "go to github and search react"\n\n' +
        (online
          ? "✅ Local agent is connected."
          : "⚠️ Local agent offline — run `npm run agent:daemon` on your PC.\nCommands will fail until connected.") +
        "\n\nType *browser off* to exit.",
    });
    return true;
  }

  if (BROWSER_OFF.has(normalized) && session.flow === "browser_agent") {
    await setFlow(phone, "idle");
    await sendMessage(phone, {
      type: "text",
      text: "Browser agent deactivated. Type *menu* for the main menu.",
    });
    return true;
  }

  if (prefixed) {
    await processBrowserCommand(io, phone, prefixed);
    return true;
  }

  if (session.flow === "browser_agent") {
    await processBrowserCommand(io, phone, input);
    return true;
  }

  return false;
}

async function processBrowserCommand(io: Server, phone: string, prompt: string): Promise<void> {
  await sendMessage(phone, {
    type: "text",
    text: "🤖 Working on it... I'll open Brave and handle that now.",
  });

  try {
    let reply: string;

    if (isAgentOnline(io)) {
      reply = await dispatchToLocalAgent(io, phone, prompt);
    } else if (process.env.AGENT_RUN_LOCAL === "true") {
      reply = await runAgentLocally(prompt);
    } else {
      throw new Error(
        "Browser agent is offline. On your PC run:\n`npm run agent:daemon`\n\nOr set AGENT_RUN_LOCAL=true if the bot runs on the same machine as Brave."
      );
    }

    await sendMessage(phone, { type: "text", text: reply.slice(0, 4000) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await sendMessage(phone, {
      type: "text",
      text: `❌ Browser agent error:\n${message}`,
    });
  }
}
