import { SleepEntry } from "../lib/api";
import { buildMonthDays, formatDuration, monthTitle, parseTimeToMinutes, shortDate, weekdayShort } from "../lib/date";

const SCALE_START_MINUTES = 18 * 60;
const SCALE_TOTAL_MINUTES = 20 * 60;
const markers = [
  { label: "18", offset: 0 },
  { label: "22", offset: 4 * 60 },
  { label: "02", offset: 8 * 60 },
  { label: "06", offset: 12 * 60 },
  { label: "10", offset: 16 * 60 },
  { label: "14", offset: 20 * 60 }
];

function buildBar(entry: SleepEntry) {
  let start = parseTimeToMinutes(entry.bedtime);
  let end = parseTimeToMinutes(entry.wakeTime);

  if (start < SCALE_START_MINUTES) {
    start += 24 * 60;
  }

  if (end < SCALE_START_MINUTES) {
    end += 24 * 60;
  }

  if (end <= start) {
    end += 24 * 60;
  }

  return {
    left: ((start - SCALE_START_MINUTES) / SCALE_TOTAL_MINUTES) * 100,
    width: ((end - start) / SCALE_TOTAL_MINUTES) * 100
  };
}

interface SleepChartProps {
  month: string;
  entries: SleepEntry[];
}

export function SleepChart({ month, entries }: SleepChartProps) {
  const dayKeys = buildMonthDays(month);
  const entryMap = new Map(entries.map((entry) => [entry.date, entry]));
  const averageDuration =
    entries.length === 0
      ? null
      : Math.round(entries.reduce((sum, entry) => sum + entry.durationMinutes, 0) / entries.length);

  return (
    <section className="rounded-[2rem] border border-[var(--app-border)] bg-white/95 p-4 shadow-soft">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-muted)]">
            Monthly sleep log
          </p>
          <h3 className="mt-2 text-lg font-semibold text-stone-950">{monthTitle(month)}</h3>
        </div>
        <div className="rounded-[1.4rem] bg-[#fff7f4] px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
            Average
          </p>
          <p className="mt-1 text-sm font-semibold text-stone-950">
            {averageDuration ? formatDuration(averageDuration) : "No data"}
          </p>
        </div>
      </div>

      <div className="mb-3 pl-[4.6rem]">
        <div className="relative h-5">
          {markers.map((marker) => (
            <span
              key={marker.label}
              className="absolute top-0 text-[10px] font-semibold tracking-[0.16em] text-[var(--app-muted)]"
              style={{ left: `calc(${(marker.offset / SCALE_TOTAL_MINUTES) * 100}% - 8px)` }}
            >
              {marker.label}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {dayKeys.map((dateKey) => {
          const entry = entryMap.get(dateKey);
          const bar = entry ? buildBar(entry) : null;

          return (
            <div key={dateKey} className="grid grid-cols-[4rem,1fr] items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-stone-950">{shortDate(dateKey)}</p>
                <p className="text-xs text-[var(--app-muted)]">{weekdayShort(dateKey)}</p>
              </div>
              <div className="relative h-10 overflow-hidden rounded-full border border-[var(--app-border)] bg-[#fff9f7]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(215,148,141,0.05)_1px,transparent_1px)] bg-[length:20%_100%]" />
                {bar ? (
                  <div
                    className="absolute top-1.5 h-7 rounded-full bg-gradient-to-r from-[#efc7c0] to-[#d7948d] shadow-sm"
                    style={{
                      left: `${bar.left}%`,
                      width: `${bar.width}%`
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center px-4 text-xs font-medium text-[var(--app-muted)]">
                    No log
                  </div>
                )}
                {entry ? (
                  <div className="absolute inset-y-0 right-4 flex items-center text-xs font-semibold text-stone-950">
                    {formatDuration(entry.durationMinutes)}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
