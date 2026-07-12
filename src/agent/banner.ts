import { Config } from "@/models/config";

const MARSOR = "\x1b[38;2;193;68;14m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

export async function printAgentBanner(): Promise<void> {
  console.log("");
  console.log(`${DIM}Mission accepted, Commander. Transforming telemetry...${RESET}`);
  
  let bannerText = "Marsor Agent Online (Banner not found in DB)";
  try {
    const config = await Config.findOne({ key: "banner" });
    if (config) {
      bannerText = config.value;
    }
  } catch (err) {
    // Silently fallback if DB is not connected or errors out
  }

  console.log(`${MARSOR}${bannerText}${RESET}`);
  console.log(`${DIM}MARSOR - autonomous browser agent online${RESET}`);
  console.log("");
}
