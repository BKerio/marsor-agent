import { parseCommand } from "@/agent/intent";
import { runIntents } from "@/agent/executor";
import { printAgentBanner } from "@/agent/banner";

export async function handleBrowserPrompt(prompt: string): Promise<string> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return 'Send a command, e.g. "search for latest AI news" or "open youtube.com".';
  }

  await printAgentBanner();
  console.log(`[agent] prompt: ${trimmed}`);
  const intents = await parseCommand(trimmed);
  const reply = await runIntents(intents);
  console.log(`[agent] reply: ${reply.slice(0, 120)}...`);
  return reply;
}
