const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const YEAR_MONTH_PATTERN = /^\d{4}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function parseDateKey(dateKey: string): Date {
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    throw new Error("Date must be in YYYY-MM-DD format");
  }

  return new Date(`${dateKey}T00:00:00.000Z`);
}

export function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return formatDateKey(date);
}

export function resolveReferenceDateKey(dateKey?: string): string {
  if (dateKey) {
    return formatDateKey(parseDateKey(dateKey));
  }

  return formatDateKey(new Date());
}

export function normalizeYearMonth(month?: string): string {
  const current = formatDateKey(new Date()).slice(0, 7);

  if (!month) {
    return current;
  }

  if (!YEAR_MONTH_PATTERN.test(month)) {
    throw new Error("Month must be in YYYY-MM format");
  }

  return month;
}

export function getMonthRange(month?: string): {
  month: string;
  start: Date;
  endExclusive: Date;
} {
  const normalizedMonth = normalizeYearMonth(month);
  const start = parseDateKey(`${normalizedMonth}-01`);
  const endExclusive = new Date(start);
  endExclusive.setUTCMonth(endExclusive.getUTCMonth() + 1);

  return {
    month: normalizedMonth,
    start,
    endExclusive
  };
}

export function parseTimeToMinutes(value: string): number {
  if (!TIME_PATTERN.test(value)) {
    throw new Error("Time must be in HH:mm format");
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function isDateKey(value: string): boolean {
  return DATE_KEY_PATTERN.test(value);
}
