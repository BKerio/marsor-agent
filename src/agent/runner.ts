import { parseCommand } from "@/agent/intent";
import { runIntents } from "@/agent/executor";
import { printRunBanner } from "@/agent/banner";
import { printInfo, printMuted, theme } from "@/agent/ui";

export async function handleBrowserPrompt(prompt: string): Promise<string> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return 'Send a command, e.g. "search for latest AI news" or "open youtube.com".';
  }

  printRunBanner(trimmed);
  printInfo("Prompt:", trimmed);

  const intents = await parseCommand(trimmed);
  printMuted(
    `Intent: ${intents.map((i) => i.action + (i.query ? `(${i.query})` : "")).join(" → ")}`
  );

  const reply = await runIntents(intents);
  console.log(`${theme.green}● Mission complete${theme.reset}`);
  return reply;
}
