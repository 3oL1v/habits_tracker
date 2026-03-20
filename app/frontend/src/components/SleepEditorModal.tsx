import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModalSheet } from "./ModalSheet";
import { SleepEntry, SleepPayload } from "../lib/api";
import { todayDateKey } from "../lib/date";

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const sleepFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  bedtime: z.string().regex(timePattern, "Use HH:mm"),
  wakeTime: z.string().regex(timePattern, "Use HH:mm")
});

type SleepFormValues = z.input<typeof sleepFormSchema>;

interface SleepEditorModalProps {
  open: boolean;
  entry?: SleepEntry | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: SleepPayload) => void;
}

const fieldClassName =
  "w-full rounded-2xl border border-[var(--app-border)] bg-[#fffdfc] px-4 py-3 text-sm text-stone-950 outline-none transition focus:border-blush-300";

export function SleepEditorModal({
  open,
  entry,
  submitting,
  onClose,
  onSubmit
}: SleepEditorModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<SleepFormValues>({
    resolver: zodResolver(sleepFormSchema),
    defaultValues: {
      date: todayDateKey(),
      bedtime: "23:00",
      wakeTime: "07:00"
    }
  });

  useEffect(() => {
    reset({
      date: entry?.date ?? todayDateKey(),
      bedtime: entry?.bedtime ?? "23:00",
      wakeTime: entry?.wakeTime ?? "07:00"
    });
  }, [entry, reset, open]);

  return (
    <ModalSheet
      open={open}
      onClose={onClose}
      title={entry ? "Edit sleep log" : "Add sleep"}
      subtitle="Log the night date, bedtime and wake time. Duration is calculated automatically."
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => {
          onSubmit(values);
        })}
      >
        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-950">Night date</label>
          <input className={fieldClassName} type="date" {...register("date")} />
          {errors.date ? <p className="mt-2 text-xs text-[#9a4754]">{errors.date.message}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-stone-950">Bedtime</label>
            <input className={fieldClassName} type="time" {...register("bedtime")} />
            {errors.bedtime ? <p className="mt-2 text-xs text-[#9a4754]">{errors.bedtime.message}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-stone-950">Wake time</label>
            <input className={fieldClassName} type="time" {...register("wakeTime")} />
            {errors.wakeTime ? <p className="mt-2 text-xs text-[#9a4754]">{errors.wakeTime.message}</p> : null}
          </div>
        </div>

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
            {submitting ? "Saving..." : entry ? "Save log" : "Add sleep"}
          </button>
        </div>
      </form>
    </ModalSheet>
  );
}
