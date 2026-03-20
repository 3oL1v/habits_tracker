import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

let envLoaded = false;

export function loadEnv(): void {
  if (envLoaded) {
    return;
  }

  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
    path.resolve(__dirname, "../../../.env")
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate, override: false });
    }
  }

  envLoaded = true;
}
