import { normalizeQuery } from "@/agent/search";

export type BrowserAction =
  | "open"
  | "search"
  | "navigate"
  | "click"
  | "page_info"
  | "screenshot";

export interface BrowserIntent {
  action: BrowserAction;
  query?: string;
  url?: string;
  text?: string;
}

const COMPOUND_SPLIT = /\s+(?:and|then)\s+/i;

function parseChunk(text: string): BrowserIntent | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (/^(?:open|launch|start)\s+(?:brave|the browser|browser)$/i.test(trimmed)) {
    return { action: "open" };
  }

  const searchMatch = trimmed.match(
    /^(?:search(?:\s+(?:for|about|on(?:\s+google)?\s+for))?|google)\s+(.+)/i
  );
  if (searchMatch) {
    return { action: "search", query: normalizeQuery(searchMatch[1]) };
  }

  const navMatch = trimmed.match(
    /^(?:go to|visit|navigate to|browse to|open)\s+(https?:\/\/\S+|[a-z0-9][-a-z0-9.]*\.[a-z]{2,}(?:\/\S*)?)/i
  );
  if (navMatch) {
    return { action: "navigate", url: navMatch[1].trim() };
  }

  const clickMatch = trimmed.match(/^click(?:\s+on)?\s+(.+)/i);
  if (clickMatch) {
    return { action: "click", text: clickMatch[1].trim() };
  }

  if (/^(?:page info|current page|what(?:'s| is) (?:on|this) page)$/i.test(trimmed)) {
    return { action: "page_info" };
  }

  if (/^(?:take (?:a )?)?screenshot$/i.test(trimmed)) {
    return { action: "screenshot" };
  }

  return null;
}

export function parseWithRules(prompt: string): BrowserIntent[] | null {
  const trimmed = prompt.trim();
  if (!trimmed) return null;

  const single = parseChunk(trimmed);
  if (single) return [single];

  const parts = trimmed.split(COMPOUND_SPLIT).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return null;

  const intents: BrowserIntent[] = [];
  for (const part of parts) {
    const intent = parseChunk(part);
    if (!intent) return null;
    intents.push(intent);
  }
  return intents;
}

export async function parseCommand(prompt: string): Promise<BrowserIntent[]> {
  const fromRules = parseWithRules(prompt);
  if (fromRules) {
    console.log("[agent] parsed with rules:", fromRules);
    return fromRules;
  }

  if (process.env.GEMINI_API_KEY) {
    const { reasonIntent } = await import("@/agent/reason");
    const fromAi = await reasonIntent(prompt);
    console.log("[agent] parsed with AI reasoning:", fromAi);
    return fromAi;
  }

  throw new Error(
    'Could not understand that command. Try:\n• "search for typescript tutorials"\n• "open youtube.com"\n• "open brave"\n• "screenshot"'
  );
}
