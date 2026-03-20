import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

const candidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env"),
  path.resolve(__dirname, "../../.env")
];

for (const candidate of candidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate, override: false });
  }
}

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(10),
  WEBAPP_URL: z.string().url()
});

export const env = envSchema.parse(process.env);
