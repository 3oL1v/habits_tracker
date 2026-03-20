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
console.log("1. Start Postgres: pnpm db:up");
console.log("2. Install deps: pnpm install");
console.log("3. Generate Prisma client: pnpm prisma:generate");
console.log("4. Run migrations: pnpm prisma:migrate");
console.log("5. Seed demo data: pnpm seed");
