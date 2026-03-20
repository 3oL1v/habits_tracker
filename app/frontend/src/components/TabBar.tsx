import { Home, MoonStar, SquareCheckBig } from "lucide-react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";

const items = [
  {
    to: "/home",
    label: "Home",
    icon: Home
  },
  {
    to: "/habits",
    label: "Habits",
    icon: SquareCheckBig
  },
  {
    to: "/sleep",
    label: "Sleep",
    icon: MoonStar
  }
];

export function TabBar() {
  return (
    <nav className="fixed bottom-[calc(0.9rem+env(safe-area-inset-bottom))] left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-[398px] -translate-x-1/2 items-center justify-between rounded-full border border-[var(--app-border)] bg-white/92 p-2 shadow-soft backdrop-blur">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition",
                isActive
                  ? "bg-blush-100 text-stone-950"
                  : "text-[var(--app-muted)] hover:bg-blush-50 hover:text-stone-950"
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
