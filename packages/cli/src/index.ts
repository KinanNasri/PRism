#!/usr/bin/env node
import { runInit } from "./commands/init.js";
import * as ui from "./ui.js";

const args = process.argv.slice(2);
const command = args[0];

async function main(): Promise<void> {
  switch (command) {
    case "init":
      await runInit();
      break;

    case "--help":
    case "-h":
    case undefined:
      ui.banner();
      console.log("  Usage: prscope <command>");
      console.log("");
      console.log("  Commands:");
      console.log("    init    Set up PRScope in your repository");
      console.log("");
      console.log("  Options:");
      console.log("    --help  Show this help message");
      console.log("");
      console.log("  Examples:");
      console.log("    npx prscope init");
      console.log("    bunx prscope init");
      console.log("");
      break;

    default:
      ui.error(`Unknown command: ${command}`);
      console.log("  Run prscope --help for usage info.");
      process.exit(1);
  }
}

main().catch((err: unknown) => {
  if (err instanceof Error && err.message.includes("User force closed")) {
    console.log("\n  Cancelled.\n");
    process.exit(0);
  }
  ui.error(err instanceof Error ? err.message : "An unexpected error occurred");
  process.exit(1);
});
