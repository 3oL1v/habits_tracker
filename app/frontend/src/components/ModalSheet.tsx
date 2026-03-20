import { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalSheetProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

export function ModalSheet({ open, title, subtitle, onClose, children }: ModalSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/30 px-3 pb-3 pt-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] rounded-[2rem] border border-[var(--app-border)] bg-white px-5 pb-6 pt-5 shadow-soft"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-muted)]">
              Planner
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--app-text)]">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-[var(--app-muted)]">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--app-border)] text-[var(--app-muted)] transition hover:bg-blush-50"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
