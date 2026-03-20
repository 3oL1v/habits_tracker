import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const envExamplePath = path.join(rootDir, ".env.example");
const envPath = path.join(rootDir, ".env");

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log("Created .env from .env.example");
} else if (fs.existsSync(envPath)) {
  console.log(".env already exists");
} else {
  console.log(".env.example not found");
}

console.log("Next steps:");
console.log("1. Install deps: pnpm install");
console.log("2. Local bootstrap: pnpm local:setup");
console.log("3. Start the workspace: pnpm local:dev");
console.log("4. Open the frontend at http://localhost:5173");
