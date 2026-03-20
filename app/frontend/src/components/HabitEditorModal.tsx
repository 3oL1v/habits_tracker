import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Habit, HabitPayload } from "../lib/api";
import { ModalSheet } from "./ModalSheet";

const suggestedIcons = ["🧘", "📚", "💧", "🏃", "🌿", "✨", "💻", "🛌", "🧠", "🍵"];

const habitFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(60, "Keep it under 60 chars"),
  icon: z.string().trim().min(1, "Choose an icon").max(16, "Icon is too long"),
  area: z.string().trim().min(1, "Area is required").max(40, "Keep it under 40 chars"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  targetMinutes: z
    .string()
    .optional()
    .refine((value) => !value || (Number.isInteger(Number(value)) && Number(value) > 0 && Number(value) <= 720), {
      message: "Target must be between 1 and 720 minutes"
    }),
  isArchived: z.boolean().default(false)
});

type HabitFormValues = z.input<typeof habitFormSchema>;

interface HabitEditorModalProps {
  open: boolean;
  habit?: Habit | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: HabitPayload) => void;
}

const fieldClassName =
  "w-full rounded-2xl border border-[var(--app-border)] bg-[#fffdfc] px-4 py-3 text-sm text-stone-950 outline-none transition placeholder:text-[#b6aba7] focus:border-blush-300";

export function HabitEditorModal({
  open,
  habit,
  submitting,
  onClose,
  onSubmit
}: HabitEditorModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      title: "",
      icon: "✨",
      area: "",
      difficulty: "easy",
      targetMinutes: "",
      isArchived: false
    }
  });

  useEffect(() => {
    reset({
      title: habit?.title ?? "",
      icon: habit?.icon ?? "✨",
      area: habit?.area ?? "",
      difficulty: habit?.difficulty ?? "easy",
      targetMinutes: habit?.targetMinutes ? String(habit.targetMinutes) : "",
      isArchived: habit?.isArchived ?? false
    });
  }, [habit, reset, open]);

  const currentIcon = watch("icon");

  return (
    <ModalSheet
      open={open}
      onClose={onClose}
      title={habit ? "Edit habit" : "Create habit"}
      subtitle="Keep it small, tappable and easy to complete every day."
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => {
          onSubmit({
            title: values.title.trim(),
            icon: values.icon.trim(),
            area: values.area.trim(),
            difficulty: values.difficulty,
            targetMinutes: values.targetMinutes ? Number(values.targetMinutes) : null,
            isArchived: values.isArchived
          });
        })}
      >
        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-950">Title</label>
          <input className={fieldClassName} placeholder="Evening reading" {...register("title")} />
          {errors.title ? <p className="mt-2 text-xs text-[#9a4754]">{errors.title.message}</p> : null}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-semibold text-stone-950">Icon</label>
            <span className="text-sm text-[var(--app-muted)]">{currentIcon}</span>
          </div>
          <input className={fieldClassName} placeholder="✨" {...register("icon")} />
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedIcons.map((icon) => (
              <button
                key={icon}
                type="button"
                className="rounded-2xl border border-[var(--app-border)] bg-blush-50 px-3 py-2 text-lg transition hover:border-blush-300"
                onClick={() => setValue("icon", icon, { shouldDirty: true, shouldValidate: true })}
              >
                {icon}
              </button>
            ))}
          </div>
          {errors.icon ? <p className="mt-2 text-xs text-[#9a4754]">{errors.icon.message}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-950">Category / area</label>
          <input className={fieldClassName} placeholder="Wellness" {...register("area")} />
          {errors.area ? <p className="mt-2 text-xs text-[#9a4754]">{errors.area.message}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-stone-950">Difficulty</label>
            <select className={fieldClassName} {...register("difficulty")}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-stone-950">Target minutes</label>
            <input className={fieldClassName} inputMode="numeric" placeholder="20" {...register("targetMinutes")} />
            {errors.targetMinutes ? (
              <p className="mt-2 text-xs text-[#9a4754]">{errors.targetMinutes.message}</p>
            ) : null}
          </div>
        </div>

        <label className="flex items-center justify-between rounded-[1.5rem] border border-[var(--app-border)] bg-[#fff9f7] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-stone-950">Archive habit</p>
            <p className="mt-1 text-xs text-[var(--app-muted)]">Hide it from the active quick-tap list.</p>
          </div>
          <input className="h-4 w-4 accent-stone-950" type="checkbox" {...register("isArchived")} />
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            className="flex-1 rounded-full border border-[var(--app-border)] px-4 py-3 text-sm font-semibold text-[var(--app-muted)] transition hover:bg-blush-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-full bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Saving..." : habit ? "Save habit" : "Create habit"}
          </button>
        </div>
      </form>
    </ModalSheet>
  );
}
