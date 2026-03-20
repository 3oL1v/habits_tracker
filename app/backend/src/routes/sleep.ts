import { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { calculateSleepDurationMinutes, mapSleepEntry } from "../lib/sleep";
import { AppError } from "../lib/http-error";
import { getMonthRange, parseDateKey } from "../lib/date";

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const sleepEntrySchema = z.object({
  date: z.string(),
  bedtime: z.string().regex(timePattern),
  wakeTime: z.string().regex(timePattern)
});

const sleepQuerySchema = z.object({
  month: z.string().optional()
});

const sleepEntryParamsSchema = z.object({
  entryId: z.string().cuid()
});

async function getOwnedSleepEntryOrThrow(userId: string, entryId: string) {
  const entry = await prisma.sleepEntry.findFirst({
    where: {
      id: entryId,
      userId
    }
  });

  if (!entry) {
    throw new AppError(404, "Sleep entry not found");
  }

  return entry;
}

export function sleepRoutes(fastify: FastifyInstance) {
  fastify.get("/sleep", { preHandler: fastify.authenticate }, async (request) => {
    const query = sleepQuerySchema.parse(request.query);
    const range = getMonthRange(query.month);

    const [entries, recentEntries] = await Promise.all([
      prisma.sleepEntry.findMany({
        where: {
          userId: request.authUser.userId,
          date: {
            gte: range.start,
            lt: range.endExclusive
          }
        },
        orderBy: {
          date: "asc"
        }
      }),
      prisma.sleepEntry.findMany({
        where: {
          userId: request.authUser.userId
        },
        orderBy: {
          date: "desc"
        },
        take: 6
      })
    ]);

    return {
      month: range.month,
      entries: entries.map(mapSleepEntry),
      recentEntries: recentEntries.map(mapSleepEntry)
    };
  });

  fastify.post("/sleep", { preHandler: fastify.authenticate }, async (request) => {
    const body = sleepEntrySchema.parse(request.body);
    const date = parseDateKey(body.date);

    try {
      const entry = await prisma.sleepEntry.create({
        data: {
          userId: request.authUser.userId,
          date,
          bedtime: body.bedtime,
          wakeTime: body.wakeTime,
          durationMinutes: calculateSleepDurationMinutes(body.bedtime, body.wakeTime)
        }
      });

      return {
        entry: mapSleepEntry(entry)
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(409, "Sleep entry for this date already exists");
      }

      throw error;
    }
  });

  fastify.patch("/sleep/:entryId", { preHandler: fastify.authenticate }, async (request) => {
    const params = sleepEntryParamsSchema.parse(request.params);
    const body = sleepEntrySchema.parse(request.body);

    await getOwnedSleepEntryOrThrow(request.authUser.userId, params.entryId);

    try {
      const entry = await prisma.sleepEntry.update({
        where: {
          id: params.entryId
        },
        data: {
          date: parseDateKey(body.date),
          bedtime: body.bedtime,
          wakeTime: body.wakeTime,
          durationMinutes: calculateSleepDurationMinutes(body.bedtime, body.wakeTime)
        }
      });

      return {
        entry: mapSleepEntry(entry)
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(409, "Sleep entry for this date already exists");
      }

      throw error;
    }
  });

  fastify.delete("/sleep/:entryId", { preHandler: fastify.authenticate }, async (request) => {
    const params = sleepEntryParamsSchema.parse(request.params);

    await getOwnedSleepEntryOrThrow(request.authUser.userId, params.entryId);

    await prisma.sleepEntry.delete({
      where: {
        id: params.entryId
      }
    });

    return {
      success: true
    };
  });
}

