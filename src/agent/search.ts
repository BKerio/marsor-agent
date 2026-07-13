import type { Page } from "playwright";
import { hostnameFromUrl, toBulletPoints } from "@/agent/format";

export interface SearchHit {
  title: string;
  url: string;
  snippet: string;
}

export interface PageSummary {
  title: string;
  url: string;
  summary: string;
}

export interface DeepSearchResult {
  query: string;
  engine: string;
  results: SearchHit[];
  deepDives: PageSummary[];
}

const TOP_RESULTS = Number(process.env.SEARCH_TOP_RESULTS ?? 5);
const DEEP_PAGES = Number(process.env.SEARCH_DEEP_PAGES ?? 2);

export function normalizeQuery(query: string): string {
  return query
    .trim()
    .replace(/^about\s+/i, "")
    .replace(/[?!.]+$/, "")
    .trim();
}

function resolveSearchUrl(href: string): string {
  let url = href.startsWith("//") ? `https:${href}` : href;

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("duckduckgo.com") && parsed.searchParams.has("uddg")) {
      return decodeURIComponent(parsed.searchParams.get("uddg")!);
    }
    return url;
  } catch {
    return href;
  }
}

function isBlockedPage(title: string, url: string): boolean {
  return /captcha|unusual traffic|verify you are human/i.test(`${title} ${url}`);
}

async function parseDuckDuckGoResults(page: Page): Promise<SearchHit[]> {
  const hits: SearchHit[] = [];
  const rows = page.locator(".results .result, .result");
  const count = await rows.count();

  for (let i = 0; i < Math.min(count, TOP_RESULTS); i++) {
    const row = rows.nth(i);
    try {
      const link = row.locator("a.result__a, h2 a").first();
      const title = (await link.innerText({ timeout: 3_000 })).trim();
      const href = (await link.getAttribute("href")) ?? "";
      const snippet = (await row.locator(".result__snippet").innerText({ timeout: 2_000 }).catch(() => "")).trim();

      if (title && href) {
        hits.push({ title, url: resolveSearchUrl(href), snippet });
      }
    } catch {
      continue;
    }
  }

  return hits;
}

async function parseGoogleResults(page: Page): Promise<SearchHit[]> {
  const hits: SearchHit[] = [];
  const rows = page.locator("#search .g");
  const count = await rows.count();

  for (let i = 0; i < Math.min(count, TOP_RESULTS); i++) {
    const row = rows.nth(i);
    try {
      const link = row.locator("a").first();
      const title = (await link.innerText({ timeout: 3_000 })).trim();
      const href = (await link.getAttribute("href")) ?? "";
      const snippet = (await row.locator(".VwiC3b, .IsZvec").innerText({ timeout: 2_000 }).catch(() => "")).trim();

      if (title && href.startsWith("http")) {
        hits.push({ title, url: href, snippet });
      }
    } catch {
      continue;
    }
  }

  return hits;
}

async function extractPageSummary(page: Page, hit: SearchHit): Promise<PageSummary | null> {
  try {
    await page.goto(hit.url, { waitUntil: "domcontentloaded", timeout: 25_000 });

    const title = await page.title();
    const url = page.url();

    if (isBlockedPage(title, url)) return null;

    const metaDesc = await page
      .locator('meta[name="description"], meta[property="og:description"]')
      .first()
      .getAttribute("content")
      .catch(() => null);

    let bodyText = "";
    for (const selector of ["main", "article", '[role="main"]', ".content", "#content", "body"]) {
      try {
        const text = await page.locator(selector).first().innerText({ timeout: 3_000 });
        if (text.length > 80) {
          bodyText = text;
          break;
        }
      } catch {
        continue;
      }
    }

    const cleaned = bodyText
      .replace(/\s+/g, " ")
      .replace(/\n{2,}/g, "\n")
      .trim()
      .slice(0, 2_000);

    const summary = [metaDesc?.trim(), cleaned].filter(Boolean).join("\n\n").slice(0, 2_200);

    if (!summary) return null;

    return { title, url, summary };
  } catch {
    return null;
  }
}

export async function runDeepSearch(page: Page, rawQuery: string): Promise<DeepSearchResult> {
  let query = normalizeQuery(rawQuery);

  if (process.env.GEMINI_API_KEY && process.env.SEARCH_REFINE_QUERY !== "false") {
    try {
      const { refineSearchQuery } = await import("@/agent/reason");
      const refined = await refineSearchQuery(query);
      if (refined !== query) {
        console.log(`[agent] query refined: "${query}" → "${refined}"`);
        query = refined;
      }
    } catch {
      // Keep original query if refinement fails.
    }
  }

  const engines: Array<{ name: string; url: string; parse: (page: Page) => Promise<SearchHit[]> }> = [
    {
      name: "DuckDuckGo",
      url: `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      parse: parseDuckDuckGoResults,
    },
    {
      name: "Google",
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      parse: parseGoogleResults,
    },
  ];

  let results: SearchHit[] = [];
  let engine = "none";

  for (const candidate of engines) {
    try {
      await page.goto(candidate.url, { waitUntil: "domcontentloaded", timeout: 30_000 });
      const title = await page.title();
      const url = page.url();
      if (isBlockedPage(title, url)) continue;

      results = await candidate.parse(page);
      if (results.length > 0) {
        engine = candidate.name;
        break;
      }
    } catch {
      continue;
    }
  }

  if (results.length === 0) {
    throw new Error("Search failed — no results found on any engine.");
  }

  const deepDives: PageSummary[] = [];
  for (const hit of results.slice(0, DEEP_PAGES)) {
    const dive = await extractPageSummary(page, hit);
    if (dive) deepDives.push(dive);
  }
z
  return { query, engine, results, deepDives };
}

export function formatDeepSearch(result: DeepSearchResult): string {
  const lines: string[] = [
    "📋 *MARSOR Search Report*",
    "",
    "*Overview*",
    `• Query: "${result.query}"`,
    `• Search engine: ${result.engine}`,
    `• Results found: ${result.results.length}`,
    `• Pages analyzed in depth: ${result.deepDives.length}`,
    "",
    "*Top matches*",
  ];

  for (const hit of result.results) {
    lines.push(`• *${hit.title}*`);
    lines.push(`  ◦ Site: ${hostnameFromUrl(hit.url)}`);
    lines.push(`  ◦ Link: ${hit.url}`);
    if (hit.snippet) {
      for (const point of toBulletPoints(hit.snippet, 2)) {
        lines.push(`  ◦ ${point}`);
      }
    }
  }

  if (result.deepDives.length > 0) {
    lines.push("", "*Detailed findings*");

    for (const dive of result.deepDives) {
      lines.push(`• *${dive.title}*`);
      lines.push(`  ◦ Source: ${hostnameFromUrl(dive.url)}`);
      lines.push(`  ◦ Link: ${dive.url}`);
      lines.push("  ◦ Key points:");

      const points = toBulletPoints(dive.summary, 8);
      for (const point of points) {
        lines.push(`    - ${point}`);
      }
    }
  }

  lines.push("", "*Suggested next steps*");
  if (result.results[0]) {
    lines.push(`• Open top result: ${result.results[0].url}`);
  }
  if (result.results[1]) {
    lines.push(`• Review second source: ${hostnameFromUrl(result.results[1].url)}`);
  }
  lines.push("• Refine search with a more specific query if needed");

  return lines.join("\n").trim();
}
