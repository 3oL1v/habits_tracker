import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, MoonStar, Sparkles, SquareCheckBig } from "lucide-react";
import { api, ApiUser } from "../lib/api";
import { formatDuration, todayDateKey } from "../lib/date";

interface HomeScreenProps {
  user: ApiUser;
}

export function HomeScreen({ user }: HomeScreenProps) {
  const navigate = useNavigate();
  const today = todayDateKey();
  const summaryQuery = useQuery({
    queryKey: ["home", today],
    queryFn: () => api.getHomeSummary(today)
  });

  return (
    <div className="space-y-4">
      <section className="rounded-[2.25rem] border border-[var(--app-border)] bg-white/95 p-5 shadow-soft">
        <div className="inline-flex items-center gap-2 rounded-full bg-blush-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-muted)]">
          <Sparkles className="h-4 w-4" />
          Today
        </div>
        <h1 className="mt-4 text-[2rem] font-semibold leading-tight text-stone-950">
          Hi, {user.firstName}. Your habits and sleep in one calm view.
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
          Track the essentials only: what you completed today and how last night looked.
        </p>

        {summaryQuery.isLoading ? (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="h-24 animate-pulse rounded-[1.6rem] bg-blush-50" />
            <div className="h-24 animate-pulse rounded-[1.6rem] bg-blush-50" />
          </div>
        ) : summaryQuery.data ? (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-[1.6rem] bg-[#fff7f4] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                Habits done
              </p>
              <p className="mt-3 text-3xl font-semibold text-stone-950">
                {summaryQuery.data.metrics.completedHabitsTodayCount}
              </p>
              <p className="mt-2 text-sm text-[var(--app-muted)]">
                of {summaryQuery.data.metrics.activeHabitsCount} active habits today
              </p>
            </div>
            <div className="rounded-[1.6rem] bg-[#fdf7f7] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                Completion
              </p>
              <p className="mt-3 text-3xl font-semibold text-stone-950">
                {Math.round(summaryQuery.data.metrics.completionRate * 100)}%
              </p>
              <p className="mt-2 text-sm text-[var(--app-muted)]">
                {summaryQuery.data.topHabit
                  ? `${summaryQuery.data.topHabit.icon} ${summaryQuery.data.topHabit.title} is leading`
                  : "Add a habit to build your routine"}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[1.6rem] border border-dashed border-[var(--app-border)] bg-[#fffdfc] p-4 text-sm text-[var(--app-muted)]">
            Unable to load your summary right now.
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-white/95 p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
              Last night
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">Sleep snapshot</h2>
          </div>
          <MoonStar className="h-5 w-5 text-[var(--app-muted)]" />
        </div>

        {summaryQuery.data?.lastSleep ? (
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-[1.5rem] bg-[#fff8f5] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--app-muted)]">
                Bedtime
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-950">
                {summaryQuery.data.lastSleep.bedtime}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-[#fff8f5] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--app-muted)]">
                Wake
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-950">
                {summaryQuery.data.lastSleep.wakeTime}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-[#fff8f5] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--app-muted)]">
                Total
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-950">
                {formatDuration(summaryQuery.data.lastSleep.durationMinutes)}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-[1.6rem] border border-dashed border-[var(--app-border)] bg-[#fffdfc] p-4 text-sm text-[var(--app-muted)]">
            Add your first sleep log to unlock the monthly chart.
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          className="flex items-center justify-between rounded-[1.8rem] border border-[var(--app-border)] bg-white/95 p-4 text-left shadow-soft transition hover:-translate-y-0.5"
          onClick={() => navigate("/habits")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.3rem] bg-blush-50">
              <SquareCheckBig className="h-5 w-5 text-stone-950" />
            </div>
            <div>
              <p className="text-base font-semibold text-stone-950">Open habits</p>
              <p className="mt-1 text-sm text-[var(--app-muted)]">Quick tap cards for daily wins</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-[var(--app-muted)]" />
        </button>

        <button
          type="button"
          className="flex items-center justify-between rounded-[1.8rem] border border-[var(--app-border)] bg-white/95 p-4 text-left shadow-soft transition hover:-translate-y-0.5"
          onClick={() => navigate("/sleep")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.3rem] bg-[#fff5f7]">
              <MoonStar className="h-5 w-5 text-stone-950" />
            </div>
            <div>
              <p className="text-base font-semibold text-stone-950">Open sleep</p>
              <p className="mt-1 text-sm text-[var(--app-muted)]">See the month at a glance</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-[var(--app-muted)]" />
        </button>
      </div>
    </div>
  );
}
