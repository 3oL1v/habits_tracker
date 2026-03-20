import { PrismaClient } from "@prisma/client";
import { config } from "../config";

declare global {
  var __habitTrackerPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__habitTrackerPrisma ??
  new PrismaClient({
    log: config.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (config.NODE_ENV !== "production") {
  global.__habitTrackerPrisma = prisma;
}

