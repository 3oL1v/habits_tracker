import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { validateTelegramInitData } from "../lib/telegram";
import { config } from "../config";
import { z } from "zod";
import { AppError } from "../lib/http-error";

const telegramAuthSchema = z.object({
  initData: z.string().min(1)
});

const devLoginSchema = z
  .object({
    telegramId: z.string().optional(),
    firstName: z.string().optional(),
    username: z.string().optional()
  })
  .default({});

function mapUser(user: {
  id: string;
  telegramId: string;
  firstName: string;
  username: string | null;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    telegramId: user.telegramId,
    firstName: user.firstName,
    username: user.username,
    photoUrl: user.photoUrl,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

export function authRoutes(fastify: FastifyInstance) {
  fastify.post("/auth/telegram", async (request) => {
    const body = telegramAuthSchema.parse(request.body);
    const { user: telegramUser } = validateTelegramInitData(
      body.initData,
      config.TELEGRAM_BOT_TOKEN,
      config.TELEGRAM_AUTH_MAX_AGE_SECONDS
    );

    const user = await prisma.user.upsert({
      where: {
        telegramId: String(telegramUser.id)
      },
      create: {
        telegramId: String(telegramUser.id),
        firstName: telegramUser.first_name,
        username: telegramUser.username,
        photoUrl: telegramUser.photo_url
      },
      update: {
        firstName: telegramUser.first_name,
        username: telegramUser.username,
        photoUrl: telegramUser.photo_url
      }
    });

    const token = fastify.jwt.sign(
      {
        userId: user.id,
        telegramId: user.telegramId
      },
      {
        expiresIn: "30d"
      }
    );

    return {
      token,
      user: mapUser(user)
    };
  });

  fastify.post("/auth/dev-login", async (request) => {
    if (!config.ALLOW_DEV_AUTH) {
      throw new AppError(404, "Development auth is disabled");
    }

    const body = devLoginSchema.parse(request.body ?? {});
    const user = await prisma.user.upsert({
      where: {
        telegramId: body.telegramId ?? config.DEV_AUTH_TELEGRAM_ID
      },
      create: {
        telegramId: body.telegramId ?? config.DEV_AUTH_TELEGRAM_ID,
        firstName: body.firstName ?? config.DEV_AUTH_FIRST_NAME,
        username: body.username ?? config.DEV_AUTH_USERNAME
      },
      update: {
        firstName: body.firstName ?? config.DEV_AUTH_FIRST_NAME,
        username: body.username ?? config.DEV_AUTH_USERNAME
      }
    });

    const token = fastify.jwt.sign(
      {
        userId: user.id,
        telegramId: user.telegramId
      },
      {
        expiresIn: "30d"
      }
    );

    return {
      token,
      user: mapUser(user)
    };
  });

  fastify.get("/auth/me", { preHandler: fastify.authenticate }, async (request) => {
    const user = await prisma.user.findUnique({
      where: {
        id: request.authUser.userId
      }
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    return {
      user: mapUser(user)
    };
  });
}

