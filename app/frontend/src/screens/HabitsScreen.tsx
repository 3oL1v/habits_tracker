import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { Plus } from "lucide-react";
import { api, Habit, HabitPayload } from "../lib/api";
import { todayDateKey } from "../lib/date";
import { HabitCard } from "../components/HabitCard";
import { HabitEditorModal } from "../components/HabitEditorModal";

type HabitFilter = "active" | "archived";

export function HabitsScreen() {
  const queryClient = useQueryClient();
  const today = todayDateKey();
  const [filter, setFilter] = useState<HabitFilter>("active");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const habitsQuery = useQuery({
    queryKey: ["habits", filter, today],
    queryFn: () => api.getHabits(today, filter)
  });

  const refreshDashboard = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["habits"] }),
      queryClient.invalidateQueries({ queryKey: ["home"] })
    ]);
  };

  const createHabitMutation = useMutation({
    mutationFn: (payload: HabitPayload) => api.createHabit(payload),
    onSuccess: async () => {
      setIsEditorOpen(false);
      setEditingHabit(null);
      await refreshDashboard();
    }
  });

  const updateHabitMutation = useMutation({
    mutationFn: ({ habitId, payload }: { habitId: string; payload: Partial<HabitPayload> }) =>
      api.updateHabit(habitId, payload),
    onSuccess: async () => {
      setIsEditorOpen(false);
      setEditingHabit(null);
      await refreshDashboard();
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (habit: Habit) => api.toggleHabit(habit.id, today, !habit.completedOnDate),
    onSuccess: refreshDashboard
  });

  const deleteMutation = useMutation({
    mutationFn: (habitId: string) => api.deleteHabit(habitId),
    onSuccess: refreshDashboard
  });

  const habits = habitsQuery.data?.habits ?? [];

  return (
    <>
      <div className="space-y-4">
        <section className="rounded-[2.25rem] border border-[var(--app-border)] bg-white/95 p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-muted)]">
                Habits
              </p>
              <h1 className="mt-2 text-[2rem] font-semibold leading-tight text-stone-950">
                One tap is enough for today.
              </h1>
              <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
                Keep the cards small, visible and frictionless. Edit details only when you need to.
              </p>
            </div>
            <button
              type="button"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-stone-950 text-white transition hover:opacity-90"
              onClick={() => {
                setEditingHabit(null);
                setIsEditorOpen(true);
              }}
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 inline-flex rounded-full bg-[#fff7f4] p-1">
            {(["active", "archived"] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={clsx(
                  "rounded-full px-4 py-2 text-sm font-semibold capitalize transition",
                  filter === value
                    ? "bg-white text-stone-950 shadow-sm"
                    : "text-[var(--app-muted)] hover:text-stone-950"
                )}
                onClick={() => setFilter(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </section>

        {habitsQuery.isLoading ? (
          <div className="space-y-3">
            <div className="h-36 animate-pulse rounded-[1.8rem] bg-white/70" />
            <div className="h-36 animate-pulse rounded-[1.8rem] bg-white/70" />
          </div>
        ) : habits.length === 0 ? (
          <section className="rounded-[2rem] border border-dashed border-[var(--app-border)] bg-white/90 p-6 text-center shadow-soft">
            <h2 className="text-lg font-semibold text-stone-950">No habits here yet</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
              Create one small repeatable action and keep it in plain sight.
            </p>
          </section>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                toggling={toggleMutation.isPending && toggleMutation.variables?.id === habit.id}
                deleting={deleteMutation.isPending && deleteMutation.variables === habit.id}
                onToggle={(selectedHabit) => void toggleMutation.mutate(selectedHabit)}
                onEdit={(selectedHabit) => {
                  setEditingHabit(selectedHabit);
                  setIsEditorOpen(true);
                }}
                onDelete={(selectedHabit) => {
                  const confirmed = window.confirm(`Delete "${selectedHabit.title}"?`);
                  if (confirmed) {
                    void deleteMutation.mutate(selectedHabit.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      <HabitEditorModal
        open={isEditorOpen}
        habit={editingHabit}
        submitting={createHabitMutation.isPending || updateHabitMutation.isPending}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingHabit(null);
        }}
        onSubmit={(payload) => {
          if (editingHabit) {
            void updateHabitMutation.mutate({
              habitId: editingHabit.id,
              payload
            });
            return;
          }

          void createHabitMutation.mutate(payload);
        }}
      />
    </>
  );
}
