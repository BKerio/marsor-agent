import { printWelcomeScreen, printMissionHeader } from "@/agent/ui";

/** Full splash — used when daemon starts / agent comes online. */
export async function printAgentBanner(): Promise<void> {
  printWelcomeScreen({
    status: "MARSOR online · autonomous browser agent ready",
  });
}

/** Compact mission frame printed before each command run. */
export function printRunBanner(prompt: string): void {
  printMissionHeader(prompt);
}
