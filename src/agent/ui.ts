import path from "node:path";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

/** Orange theme inspired by Kimi Code (4th panel). */
export const theme = {
  orange: "\x1b[38;2;255;159;67m",
  label: "\x1b[38;2;232;168;72m",
  white: "\x1b[38;2;236;236;236m",
  muted: "\x1b[38;2;160;160;160m",
  green: "\x1b[38;2;122;168;140m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
} as const;

const WIDTH = 72;
const sessionId = `session_${randomUUID()}`;

function getVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as {
      version?: string;
    };
    return pkg.version ?? "1.0.0";
  } catch {
    return "1.0.0";
  }
}

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

function padVisible(text: string, width: number): string {
  const visible = stripAnsi(text).length;
  if (visible >= width) return text;
  return text + " ".repeat(width - visible);
}

function borderTop(): string {
  return `${theme.orange}╭${"─".repeat(WIDTH)}╮${theme.reset}`;
}

function borderBottom(): string {
  return `${theme.orange}╰${"─".repeat(WIDTH)}╯${theme.reset}`;
}

function borderSep(): string {
  return `${theme.orange}├${"─".repeat(WIDTH)}┤${theme.reset}`;
}

function row(content: string): string {
  return `${theme.orange}│${theme.reset}${padVisible(content, WIDTH)}${theme.orange}│${theme.reset}`;
}

function emptyRow(): string {
  return row(" ".repeat(WIDTH));
}

function metaRow(label: string, value: string): string {
  const left = `  ${theme.label}${label}${theme.reset} ${theme.white}${value}${theme.reset}`;
  return row(left);
}

function footerPair(left: string, right: string): string {
  const gap = Math.max(1, WIDTH - stripAnsi(left).length - stripAnsi(right).length);
  return row(`${left}${" ".repeat(gap)}${right}`);
}

export function printWelcomeScreen(options?: {
  status?: string;
  model?: string;
}): void {
  const model = options?.model ?? process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const cwd = process.cwd().replace(/\\/g, "/");
  const version = getVersion();
  const status =
    options?.status ??
    'Browser agent ready · tools: open, search, navigate, click, screenshot';

  const icon = `${theme.orange}▐▌${theme.reset}`;
  const welcome = `${theme.orange}${theme.bold}Welcome to MARSOR!${theme.reset}`;
  const help = `${theme.muted}Send /help for help information.${theme.reset}`;

  console.log("");
  console.log(borderTop());
  console.log(emptyRow());
  console.log(row(`  ${icon}  ${welcome}`));
  console.log(row(`      ${help}`));
  console.log(emptyRow());
  console.log(metaRow("Directory:", cwd));
  console.log(metaRow("Session:", sessionId));
  console.log(metaRow("Model:", model));
  console.log(metaRow("Version:", version));
  console.log(metaRow("Agent:", "MARSOR browser control"));
  console.log(emptyRow());
  console.log(borderSep());
  console.log(row(`  ${theme.green}${status}${theme.reset}`));
  console.log(borderSep());
  console.log(row(`  ${theme.white}> ${theme.reset}${theme.dim}█${theme.reset}`));
  console.log(borderSep());
  console.log(
    footerPair(
      `${theme.muted}MARSOR · Brave automation${theme.reset}`,
      `${theme.muted}! to run a shell command${theme.reset}`
    )
  );
  console.log(
    footerPair(
      `${theme.muted}${model}${theme.reset}`,
      `${theme.muted}context: ready${theme.reset}`
    )
  );
  console.log(borderBottom());
  console.log("");
}

export function printMissionHeader(prompt: string): void {
  const short = prompt.length > 58 ? `${prompt.slice(0, 55)}...` : prompt;

  console.log(borderTop());
  console.log(row(`  ${theme.orange}${theme.bold}Mission accepted, Commander.${theme.reset}`));
  console.log(row(`  ${theme.muted}Transforming telemetry...${theme.reset}`));
  console.log(emptyRow());
  console.log(metaRow("Prompt:", short));
  console.log(metaRow("Session:", sessionId.slice(0, 28) + "..."));
  console.log(borderSep());
  console.log(row(`  ${theme.green}Parsing intent · preparing Brave tools${theme.reset}`));
  console.log(borderBottom());
  console.log("");
}

export function printStatus(message: string): void {
  console.log(`${theme.green}● ${message}${theme.reset}`);
}

export function printInfo(label: string, value: string): void {
  console.log(`${theme.label}${label}${theme.reset} ${theme.white}${value}${theme.reset}`);
}

export function printMuted(message: string): void {
  console.log(`${theme.muted}${message}${theme.reset}`);
}

function wrapLine(text: string, maxWidth: number): string[] {
  if (text.length === 0) return [""];
  if (text.length <= maxWidth) return [text];

  const out: string[] = [];
  let remaining = text;

  while (remaining.length > maxWidth) {
    let breakAt = remaining.lastIndexOf(" ", maxWidth);
    if (breakAt < Math.floor(maxWidth * 0.5)) breakAt = maxWidth;
    out.push(remaining.slice(0, breakAt).trimEnd());
    remaining = remaining.slice(breakAt).trimStart();
  }

  if (remaining.length) out.push(remaining);
  return out;
}

export function printReplyBox(reply: string): void {
  const lines = reply.split("\n");
  const max = WIDTH - 4;

  console.log("");
  console.log(borderTop());
  console.log(row(`  ${theme.orange}${theme.bold}Agent Reply${theme.reset}`));
  console.log(borderSep());

  for (const line of lines) {
    for (const chunk of wrapLine(line, max)) {
      console.log(row(`  ${theme.white}${chunk}${theme.reset}`));
    }
  }

  console.log(borderBottom());
  console.log("");
}

export function printError(message: string): void {
  console.error(`${theme.orange}✖ ${theme.white}${message}${theme.reset}`);
}
