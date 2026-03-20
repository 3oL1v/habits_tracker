import { z } from "zod";
import { loadEnv } from "./lib/env";

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  API_PREFIX: z.string().min(1).default("/api"),
  FRONTEND_ORIGIN: z.string().min(1).optional(),
  WEBAPP_URL: z.string().url().optional(),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  TELEGRAM_BOT_TOKEN: z.string().min(10),
  TELEGRAM_AUTH_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(86400),
  ALLOW_DEV_AUTH: z.enum(["true", "false"]).optional().default("false"),
  DEV_AUTH_TELEGRAM_ID: z.string().min(1).default("1000001"),
  DEV_AUTH_FIRST_NAME: z.string().min(1).default("Demo"),
  DEV_AUTH_USERNAME: z.string().min(1).default("habitdemo")
});

const rawConfig = envSchema.parse(process.env);
const inferredFrontendOrigin = rawConfig.FRONTEND_ORIGIN
  ?? (rawConfig.WEBAPP_URL ? new URL(rawConfig.WEBAPP_URL).origin : "http://localhost:5173");

export const config = {
  ...rawConfig,
  FRONTEND_ORIGIN: inferredFrontendOrigin,
  ALLOW_DEV_AUTH: rawConfig.ALLOW_DEV_AUTH === "true"
};
