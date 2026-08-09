import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, Search, Bookmark, User, Bell } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BuddyFab } from "@/components/buddy-ai";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/wishlist", label: "Saved", icon: Bookmark },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function AppShell({
  children,
  title,
  eyebrow,
  showHeader = true,
}: {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  showHeader?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      setDisplayName(null);
      return;
    }
    let cancelled = false;

    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const name = (data?.display_name as string | null) ?? user.email?.split("@")[0] ?? null;
        setDisplayName(name);
      });

    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false)
      .then(({ count }) => {
        if (!cancelled && typeof count === "number") setUnread(count);
      });

    const channel = supabase
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as { title: string; body: string | null; link: string | null };
          setUnread((u) => u + 1);
          toast(n.title, {
            description: n.body ?? undefined,
            action: n.link
              ? { label: "View", onClick: () => navigate({ to: n.link as string }) }
              : undefined,
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  async function markAllRead() {
    if (!user || unread === 0) return;
    setUnread(0);
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
  }

  const [greet, setGreet] = useState<string | null>(null);
  useEffect(() => { setGreet(greeting()); }, []);

  const firstName = displayName?.split(" ")[0];
  const resolvedEyebrow = eyebrow ?? "BUDGETBUDDY";
  const resolvedTitle =
    title ??
    (greet === null
      ? "Welcome back"
      : firstName
        ? `${greet}, ${firstName}`
        : greet === "Good night"
          ? "Welcome back"
          : greet);

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[440px] min-h-screen bg-background relative pb-28">
        {showHeader && (
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-5 pt-6 pb-4 flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">
                {resolvedEyebrow}
              </p>
              <h1 className="font-display text-[26px] leading-[1.15] tracking-tight text-foreground mt-1 truncate">
                {resolvedTitle}
              </h1>
            </div>
            <button
              onClick={markAllRead}
              className="relative mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border/80 bg-card text-foreground transition hover:bg-secondary"
              aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
          </header>
        )}
        <main className="px-5">{children}</main>

        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[440px] px-4"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex items-center justify-around rounded-full border border-border/80 bg-background/95 backdrop-blur-xl px-2 py-1.5 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.25)]">
            {tabs.map((t) => {
              const active = t.to === "/" ? pathname === "/" : pathname.startsWith(t.to);
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    "group relative flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-full transition",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-label={t.label}
                >
                  <Icon
                    className="h-[20px] w-[20px]"
                    strokeWidth={active ? 2.25 : 1.75}
                    fill={active ? "currentColor" : "none"}
                    fillOpacity={active ? 0.12 : 0}
                  />
                  <span className={cn("text-[10px] font-medium tracking-wide", active ? "opacity-100" : "opacity-70")}>
                    {t.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        <BuddyFab />
      </div>
    </div>
  );
}
