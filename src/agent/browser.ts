import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import path from "node:path";

const DEFAULT_BRAVE_PATHS = [
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  "C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
];

function resolveBravePath(): string | undefined {
  if (process.env.BRAVE_EXECUTABLE_PATH) {
    return process.env.BRAVE_EXECUTABLE_PATH;
  }
  return DEFAULT_BRAVE_PATHS[0];
}

export class BraveBrowser {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  async ensureOpen(): Promise<Page> {
    if (this.page && !this.page.isClosed()) {
      return this.page;
    }

    const executablePath = resolveBravePath();
    const headless = process.env.BROWSER_HEADLESS === "true";

    this.browser = await chromium.launch({
      executablePath,
      headless,
      args: ["--start-maximized"],
    });

    this.context = await this.browser.newContext({
      viewport: headless ? { width: 1280, height: 720 } : null,
    });

    this.page = await this.context.newPage();
    return this.page;
  }

  async navigate(url: string): Promise<string> {
    const page = await this.ensureOpen();
    const target = url.startsWith("http") ? url : `https://${url}`;
    await page.goto(target, { waitUntil: "domcontentloaded", timeout: 30_000 });
    return page.title();
  }

  async search(query: string): Promise<{ title: string; url: string; snippet: string }> {
    const page = await this.ensureOpen();

    const engines = [
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    ];

    for (const searchUrl of engines) {
      try {
        await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
        const title = await page.title();
        const url = page.url();

        if (/captcha|unusual traffic|verify/i.test(title + url)) continue;

        let snippet = "";
        try {
          const result = page.locator(".result, #search .g, .nrn-react-div").first();
          snippet = (await result.innerText({ timeout: 5_000 })).slice(0, 500);
        } catch {
          snippet = (await page.locator("body").innerText()).slice(0, 300);
        }

        return { title, url, snippet };
      } catch {
        continue;
      }
    }

    throw new Error("Search failed on all engines.");
  }

  async getPageInfo(): Promise<{ title: string; url: string; text: string }> {
    const page = await this.ensureOpen();
    const title = await page.title();
    const url = page.url();
    const text = (await page.locator("body").innerText()).slice(0, 800);
    return { title, url, text };
  }

  async clickText(text: string): Promise<string> {
    const page = await this.ensureOpen();
    await page.getByText(text, { exact: false }).first().click({ timeout: 10_000 });
    await page.waitForLoadState("domcontentloaded");
    return await page.title();
  }

  async typeIntoFocused(text: string, submit = false): Promise<void> {
    const page = await this.ensureOpen();
    await page.keyboard.type(text);
    if (submit) {
      await page.keyboard.press("Enter");
      await page.waitForLoadState("domcontentloaded");
    }
  }

  async screenshot(): Promise<string> {
    const page = await this.ensureOpen();
    const dir = path.join(process.cwd(), "screenshots");
    await import("node:fs/promises").then((fs) => fs.mkdir(dir, { recursive: true }));
    const filePath = path.join(dir, `shot-${Date.now()}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    return filePath;
  }

  async close(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
    this.page = null;
    this.context = null;
    this.browser = null;
  }
}

let sharedBrowser: BraveBrowser | null = null;

export function getBrowser(): BraveBrowser {
  if (!sharedBrowser) {
    sharedBrowser = new BraveBrowser();
  }
  return sharedBrowser;
}
