const MARSOR = "\x1b[38;2;193;68;14m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

const BANNER = `
███╗░░░███╗░█████╗░██████╗░███████╗░█████╗░██████╗░
████╗░████║██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗
██╔████╔██║███████║██████╔╝███████╗██║░░██║██████╔╝
██║╚██╔╝██║██╔══██║██╔══██╗╚════██║██║░░██║██╔══██╗
██║░╚═╝░██║██║░░██║██║░░██║███████║╚█████╔╝██║░░██║
╚═╝░░░░░╚═╝╚═╝░░╚═╝╚═╝░░╚═╝╚══════╝░╚════╝░╚═╝░░╚═╝

            _____
         .-'     \`-.
        /   .-=-.   \\
       /   /  🔴  \\   \\
       |   |MARSOR|   |
        \\   \\    /   /
         \`-. \`-' .-'
            \`---'
       _______________
      /   /     \\   \\
     |   |  o o  |   |
      \\   \\  _  /   /
       \\   \`---'   /
        \`---------'
`;

export function printAgentBanner(): void {
  console.log("");
  console.log(`${DIM}Mission accepted, Commander. Transforming telemetry...${RESET}`);
  console.log(`${MARSOR}${BANNER}${RESET}`);
  console.log(`${DIM}MARSOR - autonomous browser agent online${RESET}`);
  console.log("");
}
