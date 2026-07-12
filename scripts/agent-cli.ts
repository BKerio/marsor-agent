import "dotenv/config";
import { handleBrowserPrompt } from "@/agent/runner";
import { getBrowser } from "@/agent/browser";
import { connectDb } from "@/db/connect";

const prompt = process.argv.slice(2).join(" ").trim();

if (!prompt) {
  console.log("Usage: npm run agent -- \"open brave and search for typescript tutorials\"");
  process.exit(1);
}

connectDb()
  .then(() => handleBrowserPrompt(prompt))
  .then((reply) => {
    console.log("\n--- Agent Reply ---");
    console.log(reply);
  })
  .catch((err) => {
    console.error("Agent error:", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await getBrowser().close();
    process.exit(0);
  });
