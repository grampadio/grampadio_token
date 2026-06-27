import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const root = path.resolve(__dirname, "..");
const stdlibPath = path.join(
  root,
  "node_modules/@tact-lang/compiler/dist/stdlib/stdlib/std/stdlib.fc"
);
const masterPath = path.join(
  root,
  "build/GramPadToken_GramPadTokenMaster.fc"
);
const outputDir = path.join(root, "verification");
const outputPath = path.join(outputDir, "GramPadTokenMaster.combined.fc");

mkdirSync(outputDir, { recursive: true });
writeFileSync(
  outputPath,
  `${readFileSync(stdlibPath, "utf8")}\n${readFileSync(masterPath, "utf8")}`
);

console.log(`Prepared verifier source: ${outputPath}`);
