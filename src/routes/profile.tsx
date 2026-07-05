import { createFileRoute } from "@tanstack/react-router";
import { Bell, Crown, HelpCircle, LogOut, Settings, Wallet, ChevronRight, Heart } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · BudgetBuddy" }] }),
  component: ProfilePage,
});

const rows = [
  { icon: Wallet, label: "Payment & cashback", value: "₹420 balance" },
  { icon: Bell, label: "Alert preferences", value: "Push, Email" },
  { icon: Heart, label: "Followed brands", value: "8 brands" },
  { icon: Settings, label: "Settings", value: "" },
  { icon: HelpCircle, label: "Help & support", value: "" },
];

function ProfilePage() {
  return (
    <AppShell title="Your profile">
      <div className="mt-3 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display text-2xl text-primary-foreground">
          A
        </div>
        <div>
          <h2 className="font-display text-xl text-foreground">Aisha Kapoor</h2>
          <p className="text-xs text-muted-foreground">aisha@example.com</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          { label: "Saved", value: "₹2.8k" },
          { label: "Tracked", value: "24" },
          { label: "Deals hit", value: "12" },
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

      <button className="mt-5 w-full flex items-center justify-center gap-2 p-3 text-sm text-destructive font-medium">
        <LogOut className="h-4 w-4" /> Log out
      </button>
    </AppShell>
  );
}
