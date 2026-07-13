import { getBrowser } from "@/agent/browser";
import type { BrowserAction, BrowserIntent } from "@/agent/intent";
import { hostnameFromUrl, toBulletPoints } from "@/agent/format";

export interface StepResult {
  action: BrowserAction;
  success: boolean;
  summary: string;
}

const ACTION_LABELS: Record<BrowserAction, string> = {
  open: "Browser",
  search: "Search",
  navigate: "Navigation",
  click: "Click",
  page_info: "Page info",
  screenshot: "Screenshot",
};

async function executeOne(intent: BrowserIntent): Promise<StepResult> {
  const browser = getBrowser();

  switch (intent.action) {
    case "open": {
      await browser.ensureOpen();
      return { action: "open", success: true, summary: "Brave browser opened successfully." };
    }
    case "search": {
      if (!intent.query) throw new Error("Search requires a query.");
      const result = await browser.search(intent.query);
      return {
        action: "search",
        success: true,
        summary: browser.formatSearch(result),
      };
    }
    case "navigate": {
      if (!intent.url) throw new Error("Navigate requires a URL.");
      const title = await browser.navigate(intent.url);
      return {
        action: "navigate",
        success: true,
        summary: `Navigated to ${intent.url}. Page title: ${title}`,
      };
    }
    case "click": {
      if (!intent.text) throw new Error("Click requires text.");
      const title = await browser.clickText(intent.text);
      return {
        action: "click",
        success: true,
        summary: `Clicked "${intent.text}". Now viewing: ${title}`,
      };
    }
    case "page_info": {
      const info = await browser.getPageInfo();
      const points = toBulletPoints(info.text, 6);
      return {
        action: "page_info",
        success: true,
        summary: [
          `Title: ${info.title}`,
          `URL: ${info.url}`,
          ...points,
        ].join("\n"),
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

function formatStepBullets(result: StepResult): string[] {
  const label = ACTION_LABELS[result.action];

  if (!result.success) {
    return [`*${label}*`, `• Status: Failed`, `• Error: ${result.summary}`];
  }

  if (result.action === "search") {
    return [result.summary];
  }

  const lines: string[] = [`*${label}*`, `• Status: Success`];

  switch (result.action) {
    case "open":
      lines.push("• Brave browser is open and ready for commands");
      break;
    case "navigate": {
      const [navLine, titleLine] = result.summary.split(". Page title: ");
      lines.push(`• Destination: ${navLine.replace("Navigated to ", "")}`);
      if (titleLine) lines.push(`• Page title: ${titleLine}`);
      break;
    }
    case "click": {
      const match = result.summary.match(/^Clicked "(.+)"\. Now viewing: (.+)$/);
      if (match) {
        lines.push(`• Target clicked: ${match[1]}`);
        lines.push(`• Current page: ${match[2]}`);
      } else {
        lines.push(`• ${result.summary}`);
      }
      break;
    }
    case "page_info": {
      const parts = result.summary.split("\n");
      const title = parts.find((p) => p.startsWith("Title: "))?.replace("Title: ", "");
      const url = parts.find((p) => p.startsWith("URL: "))?.replace("URL: ", "");
      if (title) lines.push(`• Title: ${title}`);
      if (url) {
        lines.push(`• URL: ${url}`);
        lines.push(`• Site: ${hostnameFromUrl(url)}`);
      }
      const bodyPoints = parts.filter((p) => !p.startsWith("Title:") && !p.startsWith("URL:"));
      if (bodyPoints.length) {
        lines.push("• Page highlights:");
        for (const point of bodyPoints.slice(0, 6)) {
          lines.push(`  ◦ ${point}`);
        }
      }
      break;
    }
    case "screenshot":
      lines.push(`• File saved: ${result.summary.replace("Screenshot saved to ", "")}`);
      break;
    default:
      lines.push(`• ${result.summary}`);
  }

  return lines;
}

function formatReply(results: StepResult[]): string {
  if (results.length === 0) return "Nothing to do.";

  const hasSearchOnly =
    results.length === 1 && results[0].success && results[0].action === "search";

  if (hasSearchOnly) {
    return results[0].summary;
  }

  const lines: string[] = ["📋 *MARSOR Mission Report*", ""];

  for (const result of results) {
    lines.push(...formatStepBullets(result));
    lines.push("");
  }

  return lines.join("\n").trim();
}

export async function runIntents(intents: BrowserIntent[]): Promise<string> {
  const results = await executeIntents(intents);
  return formatReply(results);
}
