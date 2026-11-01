import "dotenv/config";
import { handleBrowserPrompt } from "@/agent/runner";
import { getBrowser } from "@/agent/browser";
import { connectDb } from "@/db/connect";
import {
  printWelcomeScreen,
  printReplyBox,
  printError,
  printMuted,
} from "@/agent/ui";

const prompt = process.argv.slice(2).join(" ").trim();

if (!prompt) {
  printWelcomeScreen();
  printMuted('Usage: npm run agent -- "open brave and search for typescript tutorials"');
  process.exit(1);
}

connectDb()
  .then(() => {
    printWelcomeScreen({
      status: "Running local CLI mission · Brave + Gemini reasoning",
    });
    return handleBrowserPrompt(prompt);
  })
  .then((reply) => {
    printReplyBox(reply);
  })
  .catch((err) => {
    printError(err instanceof Error ? err.message : String(err));
    process.exit(1);
  })
  .finally(async () => {
    await getBrowser().close();
    process.exit(0);
  });
