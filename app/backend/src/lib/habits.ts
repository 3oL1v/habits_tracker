import { HabitDifficulty, Prisma } from "@prisma/client";
import { formatDateKey, shiftDateKey } from "./date";

export type HabitWithCompletions = Prisma.HabitGetPayload<{
  include: {
    completions: true;
  };
}>;

export function toPrismaDifficulty(value: "easy" | "medium" | "hard"): HabitDifficulty {
  switch (value) {
    case "easy":
      return HabitDifficulty.EASY;
    case "medium":
      return HabitDifficulty.MEDIUM;
    case "hard":
      return HabitDifficulty.HARD;
  }
}

export function fromPrismaDifficulty(
  value: HabitDifficulty
): "easy" | "medium" | "hard" {
  switch (value) {
    case HabitDifficulty.EASY:
      return "easy";
    case HabitDifficulty.MEDIUM:
      return "medium";
    case HabitDifficulty.HARD:
      return "hard";
  }
}

export function calculateHabitStreak(
  completions: Array<{ date: Date; completed: boolean }>,
  referenceDateKey: string
): number {
  const completedDates = new Set(
    completions.filter((completion) => completion.completed).map((completion) => formatDateKey(completion.date))
  );

  const startingPoint = completedDates.has(referenceDateKey)
    ? referenceDateKey
    : shiftDateKey(referenceDateKey, -1);

  if (!completedDates.has(startingPoint)) {
    return 0;
  }

  let cursor = startingPoint;
  let streak = 0;

  while (completedDates.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  return streak;
}

export function mapHabit(habit: HabitWithCompletions, referenceDateKey: string) {
  const completedDates = new Set(
    habit.completions
      .filter((completion) => completion.completed)
      .map((completion) => formatDateKey(completion.date))
  );

  return {
    id: habit.id,
    title: habit.title,
    icon: habit.icon,
    area: habit.area,
    difficulty: fromPrismaDifficulty(habit.difficulty),
    targetMinutes: habit.targetMinutes,
    isArchived: habit.isArchived,
    createdAt: habit.createdAt.toISOString(),
    updatedAt: habit.updatedAt.toISOString(),
    completedOnDate: completedDates.has(referenceDateKey),
    streak: calculateHabitStreak(habit.completions, referenceDateKey),
    totalCompletedCount: habit.completions.filter((completion) => completion.completed).length
  };
}
