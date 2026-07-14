import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bell, Crown, HelpCircle, LogOut, Settings, Wallet, ChevronRight, Heart, LogIn } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · BudgetBuddy" }] }),
  component: ProfilePage,
});

type Profile = { display_name: string | null; avatar_url: string | null; email: string | null };

const rows = [
  { icon: Wallet, label: "Payment & cashback", value: "₹420 balance" },
  { icon: Bell, label: "Alert preferences", value: "Push, Email" },
  { icon: Heart, label: "Followed brands", value: "8 brands" },
  { icon: Settings, label: "Settings", value: "" },
  { icon: HelpCircle, label: "Help & support", value: "" },
];

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ tracked: 0, alerts: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { count: tracked }, { count: alerts }] = await Promise.all([
        supabase.from("profiles").select("display_name, avatar_url, email").eq("id", user.id).maybeSingle(),
        supabase.from("wishlist_items").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("price_alerts").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("active", true),
      ]);
      setProfile(p);
      setStats({ tracked: tracked ?? 0, alerts: alerts ?? 0 });
    })();
  }, [user]);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth" });
  }

  if (loading) return <AppShell title="Profile"><div className="mt-6 text-sm text-muted-foreground">Loading…</div></AppShell>;

  if (!user) {
    return (
      <AppShell title="Your profile">
        <div className="mt-8 rounded-3xl p-6 bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/20 text-center">
          <div className="h-14 w-14 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl text-foreground mt-4">Sign in to BudgetBuddy</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Save your wishlist and get pinged the moment prices drop.
          </p>
          <Link
            to="/auth"
            className="mt-5 inline-flex items-center justify-center h-11 px-6 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
          >
            Sign in or create account
          </Link>
        </div>
      </AppShell>
    );
  }

  const displayName = profile?.display_name || user.email?.split("@")[0] || "there";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <AppShell title="Your profile">
      <div className="mt-3 flex items-center gap-4">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display text-2xl text-primary-foreground">
            {initial}
          </div>
        )}
        <div>
          <h2 className="font-display text-xl text-foreground">{displayName}</h2>
          <p className="text-xs text-muted-foreground">{profile?.email || user.email}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          { label: "Saved", value: "₹0" },
          { label: "Tracked", value: String(stats.tracked) },
          { label: "Alerts", value: String(stats.alerts) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-secondary p-3 text-center">
            <p className="font-display text-lg text-foreground">{s.value}</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-3xl p-4 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-primary-foreground/20 flex items-center justify-center">
          <Crown className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Go BudgetBuddy Pro</p>
          <p className="text-xs opacity-90">Unlimited alerts, AI verdicts, ad-free</p>
        </div>
        <ChevronRight className="h-4 w-4" />
      </div>

      <div className="mt-5 rounded-2xl bg-card border border-border/60 divide-y divide-border/60">
        {rows.map((r) => (
          <button key={r.label} className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition text-left">
            <r.icon className="h-4 w-4 text-foreground" />
            <span className="flex-1 text-sm text-foreground">{r.label}</span>
            {r.value && <span className="text-xs text-muted-foreground">{r.value}</span>}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <AdminAccess />

      <button
        onClick={handleLogout}
        className="mt-5 w-full flex items-center justify-center gap-2 p-3 text-sm text-destructive font-medium"
      >
        <LogOut className="h-4 w-4" /> Log out
      </button>
    </AppShell>
  );
}

function AdminAccess() {
  const [state, setState] = useState<"none" | "member" | "no-admin-exists">("none");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: mine }, { count }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", u.user.id).in("role", ["admin", "editor", "moderator", "viewer"]),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin"),
      ]);
      if (mine && mine.length > 0) setState("member");
      else if ((count ?? 0) === 0) setState("no-admin-exists");
    })();
  }, []);
  async function claim() {
    setBusy(true);
    const { data, error } = await supabase.rpc("claim_first_admin");
    if (error || !data) toast.error("Couldn't claim admin");
    else { toast.success("You are admin"); setState("member"); }
    setBusy(false);
  }
  if (state === "none") return null;
  return (
    <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      {state === "member" ? (
        <Link to="/admin" className="flex items-center justify-between text-sm font-medium">
          <span>Open admin panel</span><ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <button onClick={claim} disabled={busy} className="w-full text-sm font-medium text-primary">
          {busy ? "Claiming…" : "Claim admin (no admin exists yet)"}
        </button>
      )}
    </div>
  );
}
