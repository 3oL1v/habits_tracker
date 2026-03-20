import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { RefreshCcw, Sparkles } from "lucide-react";
import { HomeScreen } from "./screens/HomeScreen";
import { HabitsScreen } from "./screens/HabitsScreen";
import { SleepScreen } from "./screens/SleepScreen";
import { TabBar } from "./components/TabBar";
import { useTelegramBootstrap } from "./hooks/useTelegramBootstrap";

function StatusView(props: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[100svh] max-w-[430px] items-center px-5 py-8">
      <div className="w-full rounded-[2rem] border border-[var(--app-border)] bg-white/90 p-8 text-center shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blush-100 text-stone-950">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-[var(--app-text)]">{props.title}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">{props.description}</p>
        {props.action ? <div className="mt-5">{props.action}</div> : null}
      </div>
    </div>
  );
}

export function App() {
  const bootstrap = useTelegramBootstrap();

  if (bootstrap.status === "loading") {
    return (
      <StatusView
        title="Preparing your journal"
        description="Connecting to Telegram, restoring your session and loading today’s dashboard."
      />
    );
  }

  if (bootstrap.status === "error" || !bootstrap.user) {
    return (
      <StatusView
        title="Unable to open the app"
        description={
          bootstrap.errorMessage ??
          "Please reopen the Mini App from Telegram or enable local development auth."
        }
        action={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            onClick={() => window.location.reload()}
          >
            <RefreshCcw className="h-4 w-4" />
            Reload
          </button>
        }
      />
    );
  }

  return (
    <HashRouter>
      <div className="relative min-h-[100svh] overflow-hidden">
        <div className="pointer-events-none fixed left-1/2 top-[-7rem] h-64 w-64 -translate-x-1/2 rounded-full bg-blush-200/60 blur-3xl" />
        <div className="pointer-events-none fixed right-[-4rem] top-1/3 h-40 w-40 rounded-full bg-[#f3dfda] blur-3xl" />
        <div className="mx-auto flex min-h-[100svh] max-w-[430px] flex-col px-4 pb-[calc(5.8rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
          <div className="mb-6 flex items-center justify-between">
            <div className="rounded-full border border-[var(--app-border)] bg-white/80 px-4 py-2 shadow-sm backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--app-muted)]">
                Habit Tracker
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--app-border)] bg-white/90 text-sm font-semibold text-stone-950 shadow-sm">
              {bootstrap.user.firstName.slice(0, 1).toUpperCase()}
            </div>
          </div>

          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomeScreen user={bootstrap.user} />} />
              <Route path="/habits" element={<HabitsScreen />} />
              <Route path="/sleep" element={<SleepScreen />} />
            </Routes>
          </div>
        </div>
        <TabBar />
      </div>
    </HashRouter>
  );
}
