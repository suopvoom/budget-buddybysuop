import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Heart, User, Bell } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/wishlist", label: "Wishlist", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children, title, showHeader = true }: { children: ReactNode; title?: string; showHeader?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[440px] min-h-screen bg-background relative pb-24 shadow-[0_0_60px_-20px_rgba(0,0,0,0.15)]">
        {showHeader && (
          <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl px-5 pt-5 pb-3 flex items-center justify-between border-b border-border/40">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">BudgetBuddy</p>
              <h1 className="font-display text-2xl leading-tight text-foreground">{title ?? "Smart shopping"}</h1>
            </div>
            <button className="relative h-11 w-11 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/70 transition">
              <Bell className="h-5 w-5 text-foreground" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-primary" />
            </button>
          </header>
        )}
        <main className="px-5 pt-4">{children}</main>

        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[408px]">
          <div className="bg-foreground text-background rounded-full px-2 py-2 flex items-center justify-between shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)]">
            {tabs.map((t) => {
              const active = t.to === "/" ? pathname === "/" : pathname.startsWith(t.to);
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-full transition-all text-xs font-medium",
                    active ? "bg-primary text-primary-foreground" : "text-background/60 hover:text-background",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                  {active && <span>{t.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
