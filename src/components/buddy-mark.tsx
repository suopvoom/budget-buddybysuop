import { cn } from "@/lib/utils";

/** BudgetBuddy monogram — a compact "b" wordmark inside a rounded square.
 *  Used as the Buddy AI identity (never a sparkle icon or emoji). */
export function BuddyMark({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <path
        d="M7 4v10.5a4.5 4.5 0 1 0 1.5-3.35"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="17.2" cy="6.6" r="1.35" fill="currentColor" />
    </svg>
  );
}
