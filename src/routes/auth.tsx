import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in · BudgetBuddy" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Welcome to BudgetBuddy!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
      }
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message);
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[440px] min-h-screen bg-background px-5 pt-6 pb-10 shadow-[0_0_60px_-20px_rgba(0,0,0,0.15)]">
        <Link to="/" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="mt-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">BudgetBuddy</p>
          <h1 className="font-display text-3xl text-foreground mt-1">
            {mode === "signup" ? "Start saving smarter" : "Welcome back"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {mode === "signup" ? "Track prices and never overpay again." : "Sign in to keep tracking deals."}
          </p>
        </div>

        <button
          onClick={handleGoogle}
          disabled={busy}
          className="mt-8 w-full h-12 rounded-full border border-border bg-background flex items-center justify-center gap-3 font-medium text-sm hover:bg-secondary transition disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">or email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleEmail} className="mt-6 space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full h-12 rounded-2xl bg-secondary px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full h-12 rounded-2xl bg-secondary px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full h-12 rounded-2xl bg-secondary px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {mode === "signup" ? "Already have an account?" : "New to BudgetBuddy?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="text-primary font-semibold"
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
