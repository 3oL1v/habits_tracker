import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, MoonStar, Pencil, Plus, Trash2 } from "lucide-react";
import { api, SleepEntry, SleepPayload } from "../lib/api";
import { currentMonthKey, formatDuration, monthTitle, shiftMonth, shortDate } from "../lib/date";
import { SleepEditorModal } from "../components/SleepEditorModal";
import { SleepChart } from "../components/SleepChart";

export function SleepScreen() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(currentMonthKey());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SleepEntry | null>(null);

  const sleepQuery = useQuery({
    queryKey: ["sleep", month],
    queryFn: () => api.getSleepMonth(month)
  });

  const refreshSleep = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["sleep"] }),
      queryClient.invalidateQueries({ queryKey: ["home"] })
    ]);
  };

  const createSleepMutation = useMutation({
    mutationFn: (payload: SleepPayload) => api.createSleep(payload),
    onSuccess: async () => {
      setIsEditorOpen(false);
      setEditingEntry(null);
      await refreshSleep();
    }
  });

  const updateSleepMutation = useMutation({
    mutationFn: ({ entryId, payload }: { entryId: string; payload: SleepPayload }) =>
      api.updateSleep(entryId, payload),
    onSuccess: async () => {
      setIsEditorOpen(false);
      setEditingEntry(null);
      await refreshSleep();
    }
  });

  const deleteSleepMutation = useMutation({
    mutationFn: (entryId: string) => api.deleteSleep(entryId),
    onSuccess: refreshSleep
  });

  const recentEntries = sleepQuery.data?.recentEntries ?? [];

  return (
    <>
      <div className="space-y-4">
        <section className="rounded-[2.25rem] border border-[var(--app-border)] bg-white/95 p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-muted)]">
                Sleep
              </p>
              <h1 className="mt-2 text-[2rem] font-semibold leading-tight text-stone-950">
                A monthly view for your nights.
              </h1>
              <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
                Log one entry per night and keep the whole month readable at a glance.
              </p>
            </div>
            <button
              type="button"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-stone-950 text-white transition hover:opacity-90"
              onClick={() => {
                setEditingEntry(null);
                setIsEditorOpen(true);
              }}
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-[1.6rem] bg-[#fff7f4] px-3 py-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--app-border)] bg-white text-[var(--app-muted)] transition hover:text-stone-950"
              onClick={() => setMonth((currentValue) => shiftMonth(currentValue, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                Current view
              </p>
              <p className="mt-1 text-base font-semibold text-stone-950">{monthTitle(month)}</p>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--app-border)] bg-white text-[var(--app-muted)] transition hover:text-stone-950"
              onClick={() => setMonth((currentValue) => shiftMonth(currentValue, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {sleepQuery.isLoading ? (
          <div className="h-[28rem] animate-pulse rounded-[2rem] bg-white/75" />
        ) : sleepQuery.data ? (
          <SleepChart month={month} entries={sleepQuery.data.entries} />
        ) : (
          <section className="rounded-[2rem] border border-dashed border-[var(--app-border)] bg-white/90 p-6 text-center shadow-soft">
            <p className="text-sm text-[var(--app-muted)]">Unable to load sleep data right now.</p>
          </section>
        )}

        <section className="rounded-[2rem] border border-[var(--app-border)] bg-white/95 p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <MoonStar className="h-4 w-4 text-[var(--app-muted)]" />
            <h2 className="text-lg font-semibold text-stone-950">Recent entries</h2>
          </div>

          {recentEntries.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--app-muted)]">
              No sleep logs yet. Add your first night to start the monthly journal.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentEntries.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-[1.6rem] border border-[var(--app-border)] bg-[#fffaf8] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">{shortDate(entry.date)}</p>
                      <p className="mt-1 text-sm text-[var(--app-muted)]">
                        {entry.bedtime} → {entry.wakeTime}
                      </p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-stone-950">
                      {formatDuration(entry.durationMinutes)}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--app-muted)] transition hover:text-stone-950"
                      onClick={() => {
                        setEditingEntry(entry);
                        setIsEditorOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[#9a4754]"
                      onClick={() => {
                        const confirmed = window.confirm(`Delete the sleep log for ${entry.date}?`);
                        if (confirmed) {
                          void deleteSleepMutation.mutate(entry.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <SleepEditorModal
        open={isEditorOpen}
        entry={editingEntry}
        submitting={createSleepMutation.isPending || updateSleepMutation.isPending}
        onClose={() => {
          setEditingEntry(null);
          setIsEditorOpen(false);
        }}
        onSubmit={(payload) => {
          if (editingEntry) {
            void updateSleepMutation.mutate({
              entryId: editingEntry.id,
              payload
            });
            return;
          }

          void createSleepMutation.mutate(payload);
        }}
      />
    </>
  );
}
