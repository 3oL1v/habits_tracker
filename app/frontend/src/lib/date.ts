import dayjs from "dayjs";

export function todayDateKey(): string {
  return dayjs().format("YYYY-MM-DD");
}

export function currentMonthKey(): string {
  return dayjs().format("YYYY-MM");
}

export function shiftMonth(month: string, delta: number): string {
  return dayjs(`${month}-01`).add(delta, "month").format("YYYY-MM");
}

export function monthTitle(month: string): string {
  return dayjs(`${month}-01`).format("MMMM YYYY");
}

export function shortDate(dateKey: string): string {
  return dayjs(dateKey).format("D MMM");
}

export function weekdayShort(dateKey: string): string {
  return dayjs(dateKey).format("dd");
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return `${hours}h ${String(restMinutes).padStart(2, "0")}m`;
}

export function buildMonthDays(month: string): string[] {
  const start = dayjs(`${month}-01`);
  return Array.from({ length: start.daysInMonth() }, (_, index) =>
    start.add(index, "day").format("YYYY-MM-DD")
  );
}

export function parseTimeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}
