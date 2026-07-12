import { getBrowser } from "@/agent/browser";
import type { BrowserAction, BrowserIntent } from "@/agent/intent";

export interface StepResult {
  action: BrowserAction;
  success: boolean;
  summary: string;
}

async function executeOne(intent: BrowserIntent): Promise<StepResult> {
  const browser = getBrowser();

  switch (intent.action) {
    case "open": {
      await browser.ensureOpen();
      return { action: "open", success: true, summary: "Opened Brave browser." };
    }
    case "search": {
      if (!intent.query) throw new Error("Search requires a query.");
      const result = await browser.search(intent.query);
      const preview = result.snippet ? `\n${result.snippet.slice(0, 200)}` : "";
      return {
        action: "search",
        success: true,
        summary: `Searched for "${intent.query}" on ${result.url}\nPage: ${result.title}${preview}`,
      };
    }
    case "navigate": {
      if (!intent.url) throw new Error("Navigate requires a URL.");
      const title = await browser.navigate(intent.url);
      return {
        action: "navigate",
        success: true,
        summary: `Opened ${intent.url}\nPage: ${title}`,
      };
    }
    case "click": {
      if (!intent.text) throw new Error("Click requires text.");
      const title = await browser.clickText(intent.text);
      return {
        action: "click",
        success: true,
        summary: `Clicked "${intent.text}". Now on: ${title}`,
      };
    }
    case "page_info": {
      const info = await browser.getPageInfo();
      return {
        action: "page_info",
        success: true,
        summary: `Title: ${info.title}\nURL: ${info.url}\n\n${info.text.slice(0, 400)}`,
      };
    }
    case "screenshot": {
      const filePath = await browser.screenshot();
      return {
        action: "screenshot",
        success: true,
        summary: `Screenshot saved to ${filePath}`,
      };
    }
    default:
      throw new Error(`Unknown action: ${intent.action}`);
  }
}

export async function executeIntents(intents: BrowserIntent[]): Promise<StepResult[]> {
  const results: StepResult[] = [];

  for (const intent of intents) {
    try {
      results.push(await executeOne(intent));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[agent] step failed (${intent.action}):`, message);
      results.push({ action: intent.action, success: false, summary: message });
    }
  }

  return results;
}

function formatReply(results: StepResult[]): string {
  if (results.length === 0) return "Nothing to do.";

  return results
    .map((r) => (r.success ? `✅ ${r.summary}` : `❌ ${r.summary}`))
    .join("\n\n");
}

export async function runIntents(intents: BrowserIntent[]): Promise<string> {
  const results = await executeIntents(intents);
  return formatReply(results);
}
