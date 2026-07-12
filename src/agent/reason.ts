import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { BrowserAction, BrowserIntent } from "@/agent/intent";

const VALID_ACTIONS: BrowserAction[] = [
  "open",
  "search",
  "navigate",
  "click",
  "page_info",
  "screenshot",
];

/** Single Gemini call — interprets ambiguous text into structured steps. No tool loop. */
export async function reasonIntent(prompt: string): Promise<BrowserIntent[]> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            action: {
              type: SchemaType.STRING,
              format: "enum",
              enum: VALID_ACTIONS,
            },
            query: { type: SchemaType.STRING },
            url: { type: SchemaType.STRING },
            text: { type: SchemaType.STRING },
          },
          required: ["action"],
        },
      },
    },
  });

  const result = await model.generateContent(
    `Convert this browser command into a JSON array of steps. Only return JSON.\n\n` +
      `User: "${prompt}"\n\n` +
      `Actions: open (launch Brave), search (needs query), navigate (needs url), ` +
      `click (needs text), page_info, screenshot.\n\n` +
      `Example: "open brave and search cats" → [{"action":"open"},{"action":"search","query":"cats"}]`
  );

  const parsed = JSON.parse(result.response.text()) as BrowserIntent[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("AI could not interpret that command.");
  }

  return parsed.filter((step) => VALID_ACTIONS.includes(step.action));
}
