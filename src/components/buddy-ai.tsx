import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { X, ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { BuddyMark } from "@/components/buddy-mark";
import { cn } from "@/lib/utils";

const GENERIC_PROMPTS = [
  "Should I buy this now?",
  "Find a better price",
  "What am I tracking?",
  "Biggest drops today",
];

const PRODUCT_PROMPTS = [
  "Should I buy now?",
  "Should I wait?",
  "Is this a good price?",
  "Compare stores",
  "Explain price history",
];

const TOOLTIP_KEY = "bb.buddy.tipSeen";
const INSIGHT_KEY = "bb.buddy.insight";

/**
 * Floating premium Buddy AI entry point + contextual bottom sheet.
 * Sits above the bottom navigation, never overlapping it.
 */
export function BuddyFab() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isProduct = pathname.startsWith("/product/");
  const [open, setOpen] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [hasInsight, setHasInsight] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(TOOLTIP_KEY);
    if (!seen) {
      const t = setTimeout(() => setShowTip(true), 900);
      const hide = setTimeout(() => {
        setShowTip(false);
        window.localStorage.setItem(TOOLTIP_KEY, "1");
      }, 5200);
      return () => {
        clearTimeout(t);
        clearTimeout(hide);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHasInsight(window.localStorage.getItem(INSIGHT_KEY) === "1");
  }, [pathname]);

  function toggle() {
    setOpen((o) => !o);
    setShowTip(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOOLTIP_KEY, "1");
      window.localStorage.removeItem(INSIGHT_KEY);
      setHasInsight(false);
    }
  }

  const prompts = isProduct ? PRODUCT_PROMPTS : GENERIC_PROMPTS;

  return (
    <>
      <div className="pointer-events-none fixed bottom-24 right-[max(1rem,calc(50%-208px))] z-[60] flex items-end gap-2">
        {showTip && (
          <div className="pointer-events-none mb-1 rounded-full bg-foreground px-3 py-1.5 text-[11px] font-medium text-background shadow-lg animate-in fade-in slide-in-from-right-1">
            Ask Buddy
          </div>
        )}
        <button
          onClick={toggle}
          aria-label="Open Buddy AI"
          className={cn(
            "pointer-events-auto relative grid h-[52px] w-[52px] place-items-center rounded-2xl",
            "bg-[oklch(0.22_0.04_260)] text-background",
            "border border-white/10 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.55)]",
            "transition-transform duration-200 active:scale-95 hover:-translate-y-0.5",
          )}
        >
          <span className="absolute inset-0 rounded-2xl bg-accent/0 hover:bg-accent/5 transition-colors" />
          <BuddyMark size={24} className="text-background" />
          {hasInsight && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
          )}
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-w-[440px] rounded-t-3xl border-0 bg-background p-0 pb-6 shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.35)]"
        >
          <div className="flex justify-center pt-2.5">
            <span className="h-1 w-10 rounded-full bg-border" />
          </div>
          <SheetHeader className="px-5 pt-3 pb-1 text-left">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[oklch(0.22_0.04_260)] text-background border border-white/10">
                <BuddyMark size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="font-display text-xl leading-tight text-foreground">
                  Buddy AI
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Your shopping copilot
                </SheetDescription>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </SheetHeader>

          <div className="px-5 pt-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
              {isProduct ? "Ask Buddy about this product" : "Suggestions"}
            </p>
            <div className="mt-3 space-y-2">
              {prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 text-left text-sm text-foreground transition hover:border-foreground/30 hover:bg-secondary"
                >
                  <span className="min-w-0 truncate">{p}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-border/70 bg-secondary/60 p-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={2}
                placeholder="Ask anything about a price, brand or store…"
                className="w-full resize-none bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <div className="flex items-center justify-between px-2 pb-1">
                <p className="text-[10px] text-muted-foreground">
                  Buddy uses your tracked items & recent views.
                </p>
                <button
                  disabled={!input.trim()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-xs font-semibold text-background disabled:opacity-40"
                >
                  Ask <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
