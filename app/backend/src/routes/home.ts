import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { resolveReferenceDateKey, parseDateKey } from "../lib/date";
import { mapHabit } from "../lib/habits";
import { mapSleepEntry } from "../lib/sleep";
import { AppError } from "../lib/http-error";

const homeQuerySchema = z.object({
  date: z.string().optional()
});

export function homeRoutes(fastify: FastifyInstance) {
  fastify.get("/home/summary", { preHandler: fastify.authenticate }, async (request) => {
    const query = homeQuerySchema.parse(request.query);
    const referenceDate = resolveReferenceDateKey(query.date);
    const referenceDateValue = parseDateKey(referenceDate);

    const user = await prisma.user.findUnique({
      where: {
        id: request.authUser.userId
      }
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    const [activeHabitsCount, completedHabitsTodayCount, activeHabits, lastSleepEntry] = await Promise.all([
      prisma.habit.count({
        where: {
          userId: request.authUser.userId,
          isArchived: false
        }
      }),
      prisma.habitCompletion.count({
        where: {
          completed: true,
          date: referenceDateValue,
          habit: {
            userId: request.authUser.userId,
            isArchived: false
          }
        }
      }),
      prisma.habit.findMany({
        where: {
          userId: request.authUser.userId,
          isArchived: false
        },
        include: {
          completions: {
            orderBy: {
              date: "desc"
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.sleepEntry.findFirst({
        where: {
          userId: request.authUser.userId
        },
        orderBy: {
          date: "desc"
        }
      })
    ]);

    const habitCards = activeHabits.map((habit) => mapHabit(habit, referenceDate));
    const topHabit = habitCards.sort((left, right) => right.streak - left.streak)[0] ?? null;

    return {
      greetingName: user.firstName,
      today: referenceDate,
      metrics: {
        activeHabitsCount,
        completedHabitsTodayCount,
        completionRate: activeHabitsCount === 0 ? 0 : completedHabitsTodayCount / activeHabitsCount
      },
      topHabit: topHabit
        ? {
            id: topHabit.id,
            title: topHabit.title,
            icon: topHabit.icon,
            streak: topHabit.streak
          }
        : null,
      lastSleep: lastSleepEntry ? mapSleepEntry(lastSleepEntry) : null
    };
  });
}

