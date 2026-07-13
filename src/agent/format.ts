export function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Split prose into clean bullet lines. */
export function toBulletPoints(text: string, max = 8): string[] {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25 && s.length <= 320);

  const unique: string[] = [];
  for (const sentence of sentences) {
    const key = sentence.toLowerCase().slice(0, 60);
    if (!unique.some((u) => u.toLowerCase().slice(0, 60) === key)) {
      unique.push(sentence);
    }
    if (unique.length >= max) break;
  }

  return unique;
}

export function bulletBlock(title: string, items: string[], sub = false): string[] {
  const marker = sub ? "  ◦" : "•";
  return [title, ...items.map((item) => `${marker} ${item}`)];
}
