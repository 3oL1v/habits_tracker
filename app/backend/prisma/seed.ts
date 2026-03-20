import { PrismaClient, HabitDifficulty } from "@prisma/client";
import { config } from "../src/config";
import { parseDateKey, shiftDateKey } from "../src/lib/date";
import { calculateSleepDurationMinutes } from "../src/lib/sleep";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: {
      telegramId: config.DEV_AUTH_TELEGRAM_ID
    },
    create: {
      telegramId: config.DEV_AUTH_TELEGRAM_ID,
      firstName: config.DEV_AUTH_FIRST_NAME,
      username: config.DEV_AUTH_USERNAME
    },
    update: {
      firstName: config.DEV_AUTH_FIRST_NAME,
      username: config.DEV_AUTH_USERNAME
    }
  });

  const habitInputs = [
    {
      title: "Morning stretch",
      icon: "🧘",
      area: "Wellness",
      difficulty: HabitDifficulty.EASY,
      targetMinutes: 10
    },
    {
      title: "Deep work",
      icon: "💻",
      area: "Focus",
      difficulty: HabitDifficulty.MEDIUM,
      targetMinutes: 45
    },
    {
      title: "Evening walk",
      icon: "🌇",
      area: "Movement",
      difficulty: HabitDifficulty.EASY,
      targetMinutes: 25
    }
  ];

  for (const habitInput of habitInputs) {
    const habit = await prisma.habit.upsert({
      where: {
        id: `${user.id}-${habitInput.title.toLowerCase().replace(/\s+/g, "-")}`
      },
      create: {
        id: `${user.id}-${habitInput.title.toLowerCase().replace(/\s+/g, "-")}`,
        userId: user.id,
        ...habitInput
      },
      update: {
        ...habitInput
      }
    });

    for (let offset = 0; offset < 6; offset += 1) {
      const dateKey = shiftDateKey(new Date().toISOString().slice(0, 10), -offset);
      const completed = habitInput.title === "Deep work" ? offset < 4 : offset !== 2;

      await prisma.habitCompletion.upsert({
        where: {
          habitId_date: {
            habitId: habit.id,
            date: parseDateKey(dateKey)
          }
        },
        create: {
          habitId: habit.id,
          date: parseDateKey(dateKey),
          completed
        },
        update: {
          completed
        }
      });
    }
  }

  const sleepEntries = [
    {
      date: shiftDateKey(new Date().toISOString().slice(0, 10), -4),
      bedtime: "23:15",
      wakeTime: "07:10"
    },
    {
      date: shiftDateKey(new Date().toISOString().slice(0, 10), -3),
      bedtime: "22:50",
      wakeTime: "06:55"
    },
    {
      date: shiftDateKey(new Date().toISOString().slice(0, 10), -2),
      bedtime: "00:20",
      wakeTime: "08:00"
    },
    {
      date: shiftDateKey(new Date().toISOString().slice(0, 10), -1),
      bedtime: "23:40",
      wakeTime: "07:25"
    }
  ];

  for (const entry of sleepEntries) {
    await prisma.sleepEntry.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: parseDateKey(entry.date)
        }
      },
      create: {
        userId: user.id,
        date: parseDateKey(entry.date),
        bedtime: entry.bedtime,
        wakeTime: entry.wakeTime,
        durationMinutes: calculateSleepDurationMinutes(entry.bedtime, entry.wakeTime)
      },
      update: {
        bedtime: entry.bedtime,
        wakeTime: entry.wakeTime,
        durationMinutes: calculateSleepDurationMinutes(entry.bedtime, entry.wakeTime)
      }
    });
  }

  console.log(`Seeded demo data for telegram user ${user.telegramId}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
