import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { mapHabit, toPrismaDifficulty } from "../lib/habits";
import { AppError } from "../lib/http-error";
import { parseDateKey, resolveReferenceDateKey } from "../lib/date";

const habitDifficultySchema = z.enum(["easy", "medium", "hard"]);

const habitMutationSchema = z.object({
  title: z.string().trim().min(1).max(60),
  icon: z.string().trim().min(1).max(16),
  area: z.string().trim().min(1).max(40),
  difficulty: habitDifficultySchema,
  targetMinutes: z.coerce.number().int().positive().max(720).nullable().optional(),
  isArchived: z.boolean().optional()
});

const updateHabitSchema = habitMutationSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

const habitQuerySchema = z.object({
  status: z.enum(["active", "archived", "all"]).optional().default("active"),
  date: z.string().optional()
});

const habitIdParamsSchema = z.object({
  habitId: z.string().cuid()
});

const toggleSchema = z.object({
  date: z.string().optional(),
  completed: z.boolean().optional()
});

async function getOwnedHabitOrThrow(userId: string, habitId: string) {
  const habit = await prisma.habit.findFirst({
    where: {
      id: habitId,
      userId
    }
  });

  if (!habit) {
    throw new AppError(404, "Habit not found");
  }

  return habit;
}

export function habitsRoutes(fastify: FastifyInstance) {
  fastify.get("/habits", { preHandler: fastify.authenticate }, async (request) => {
    const query = habitQuerySchema.parse(request.query);
    const referenceDate = resolveReferenceDateKey(query.date);

    const habits = await prisma.habit.findMany({
      where: {
        userId: request.authUser.userId,
        ...(query.status === "all"
          ? {}
          : {
              isArchived: query.status === "archived"
            })
      },
      include: {
        completions: {
          orderBy: {
            date: "desc"
          }
        }
      },
      orderBy: [{ isArchived: "asc" }, { createdAt: "desc" }]
    });

    return {
      referenceDate,
      habits: habits.map((habit) => mapHabit(habit, referenceDate))
    };
  });

  fastify.post("/habits", { preHandler: fastify.authenticate }, async (request) => {
    const body = habitMutationSchema.parse(request.body);

    const habit = await prisma.habit.create({
      data: {
        userId: request.authUser.userId,
        title: body.title,
        icon: body.icon,
        area: body.area,
        difficulty: toPrismaDifficulty(body.difficulty),
        targetMinutes: body.targetMinutes ?? null,
        isArchived: body.isArchived ?? false
      },
      include: {
        completions: true
      }
    });

    return {
      habit: mapHabit(habit, resolveReferenceDateKey())
    };
  });

  fastify.patch("/habits/:habitId", { preHandler: fastify.authenticate }, async (request) => {
    const params = habitIdParamsSchema.parse(request.params);
    const body = updateHabitSchema.parse(request.body);

    await getOwnedHabitOrThrow(request.authUser.userId, params.habitId);

    const updatedHabit = await prisma.habit.update({
      where: {
        id: params.habitId
      },
      data: {
        ...(body.title ? { title: body.title } : {}),
        ...(body.icon ? { icon: body.icon } : {}),
        ...(body.area ? { area: body.area } : {}),
        ...(body.difficulty ? { difficulty: toPrismaDifficulty(body.difficulty) } : {}),
        ...(body.targetMinutes !== undefined ? { targetMinutes: body.targetMinutes } : {}),
        ...(body.isArchived !== undefined ? { isArchived: body.isArchived } : {})
      },
      include: {
        completions: {
          orderBy: {
            date: "desc"
          }
        }
      }
    });

    return {
      habit: mapHabit(updatedHabit, resolveReferenceDateKey())
    };
  });

  fastify.post("/habits/:habitId/toggle", { preHandler: fastify.authenticate }, async (request) => {
    const params = habitIdParamsSchema.parse(request.params);
    const body = toggleSchema.parse(request.body ?? {});
    const referenceDate = resolveReferenceDateKey(body.date);
    const date = parseDateKey(referenceDate);

    await getOwnedHabitOrThrow(request.authUser.userId, params.habitId);

    const existingCompletion = await prisma.habitCompletion.findUnique({
      where: {
        habitId_date: {
          habitId: params.habitId,
          date
        }
      }
    });

    const completed = body.completed ?? !(existingCompletion?.completed ?? false);

    await prisma.habitCompletion.upsert({
      where: {
        habitId_date: {
          habitId: params.habitId,
          date
        }
      },
      create: {
        habitId: params.habitId,
        date,
        completed
      },
      update: {
        completed
      }
    });

    const habit = await prisma.habit.findUnique({
      where: {
        id: params.habitId
      },
      include: {
        completions: {
          orderBy: {
            date: "desc"
          }
        }
      }
    });

    if (!habit) {
      throw new AppError(404, "Habit not found");
    }

    return {
      habit: mapHabit(habit, referenceDate),
      date: referenceDate
    };
  });

  fastify.delete("/habits/:habitId", { preHandler: fastify.authenticate }, async (request) => {
    const params = habitIdParamsSchema.parse(request.params);

    await getOwnedHabitOrThrow(request.authUser.userId, params.habitId);

    await prisma.habit.delete({
      where: {
        id: params.habitId
      }
    });

    return {
      success: true
    };
  });
}

