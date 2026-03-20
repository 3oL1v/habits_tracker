import { Prisma } from "@prisma/client";
import { formatDateKey, parseTimeToMinutes } from "./date";

export type SleepEntryRecord = Prisma.SleepEntryGetPayload<Record<string, never>>;

export function calculateSleepDurationMinutes(bedtime: string, wakeTime: string): number {
  const bedtimeMinutes = parseTimeToMinutes(bedtime);
  let wakeMinutes = parseTimeToMinutes(wakeTime);

  if (wakeMinutes <= bedtimeMinutes) {
    wakeMinutes += 24 * 60;
  }

  return wakeMinutes - bedtimeMinutes;
}

export function mapSleepEntry(entry: SleepEntryRecord) {
  return {
    id: entry.id,
    date: formatDateKey(entry.date),
    bedtime: entry.bedtime,
    wakeTime: entry.wakeTime,
    durationMinutes: entry.durationMinutes,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString()
  };
}
