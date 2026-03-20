import { Habit } from "../lib/api";
import { Flame, Pencil, Trash2 } from "lucide-react";
import clsx from "clsx";

interface HabitCardProps {
  habit: Habit;
  onToggle: (habit: Habit) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
  toggling: boolean;
  deleting: boolean;
}

const difficultyTone: Record<Habit["difficulty"], string> = {
  easy: "bg-[#eef7ef] text-[#3b6b48]",
  medium: "bg-[#fff3e6] text-[#94632d]",
  hard: "bg-[#fbe8ea] text-[#9a4754]"
};

export function HabitCard({
  habit,
  onToggle,
  onEdit,
  onDelete,
  toggling,
  deleting
}: HabitCardProps) {
  return (
    <article className="rounded-[1.8rem] border border-[var(--app-border)] bg-white/95 p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] bg-blush-50 text-2xl">
          {habit.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[var(--app-text)]">{habit.title}</h3>
              <p className="mt-1 text-sm text-[var(--app-muted)]">{habit.area}</p>
            </div>
            <button
              type="button"
              className={clsx(
                "flex h-11 w-11 items-center justify-center rounded-full border transition",
                habit.completedOnDate
                  ? "border-transparent bg-stone-950 text-white"
                  : "border-[var(--app-border)] bg-white text-[var(--app-muted)] hover:border-blush-300 hover:text-stone-950"
              )}
              onClick={() => onToggle(habit)}
              disabled={toggling}
            >
              <span className="text-lg font-semibold">{habit.completedOnDate ? "✓" : "+"}</span>
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-blush-50 px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
              {habit.targetMinutes ? `${habit.targetMinutes} min target` : "Flexible target"}
            </span>
            <span
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                difficultyTone[habit.difficulty]
              )}
            >
              {habit.difficulty}
            </span>
            {habit.isArchived ? (
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
                Archived
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff7f4] px-3 py-2 text-sm font-semibold text-stone-950">
              <Flame className="h-4 w-4 text-[#d98274]" />
              {habit.streak} day streak
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--app-border)] text-[var(--app-muted)] transition hover:bg-blush-50 hover:text-stone-950"
                onClick={() => onEdit(habit)}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--app-border)] text-[var(--app-muted)] transition hover:bg-[#fff0f0] hover:text-[#9a4754]"
                onClick={() => onDelete(habit)}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
