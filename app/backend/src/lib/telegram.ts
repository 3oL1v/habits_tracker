import crypto from "node:crypto";
import { AppError } from "./http-error";

export interface TelegramUserPayload {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export function validateTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds: number
): {
  user: TelegramUserPayload;
  authDate: Date;
  queryId?: string;
} {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    throw new AppError(401, "Telegram init data hash is missing");
  }

  const dataCheckString = Array.from(params.entries())
    .filter(([key]) => key !== "hash")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const expected = Buffer.from(calculatedHash, "hex");
  const actual = Buffer.from(hash, "hex");

  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    throw new AppError(401, "Telegram init data signature is invalid");
  }

  const authDateRaw = params.get("auth_date");
  const userRaw = params.get("user");

  if (!authDateRaw || !userRaw) {
    throw new AppError(401, "Telegram init data is incomplete");
  }

  const authDate = new Date(Number(authDateRaw) * 1000);

  if (Number.isNaN(authDate.getTime())) {
    throw new AppError(401, "Telegram auth date is invalid");
  }

  const ageSeconds = Math.floor((Date.now() - authDate.getTime()) / 1000);

  if (ageSeconds > maxAgeSeconds) {
    throw new AppError(401, "Telegram init data is expired");
  }

  const user = JSON.parse(userRaw) as TelegramUserPayload;

  return {
    user,
    authDate,
    queryId: params.get("query_id") ?? undefined
  };
}
