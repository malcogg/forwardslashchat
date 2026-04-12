"use client";

import { Fragment } from "react";
import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type DesktopStepperStep = {
  key: string;
  label: string;
  done: boolean;
  icon: LucideIcon;
};

type DesktopStepperProps = {
  steps: DesktopStepperStep[];
  currentIndex: number;
};

/** Pastel emerald track matches success toast / announcement bar (bg-emerald-500/15). */
const STEP_PROGRESS =
  "bg-emerald-500/15 border-emerald-500/25 dark:bg-emerald-500/[0.12] dark:border-emerald-500/35";

/** Full-width row with vertical separators between steps (md+ dashboard). */
export function DesktopStepper({ steps, currentIndex }: DesktopStepperProps) {
  return (
    <div className="w-full px-4 sm:px-6 xl:px-8">
      <div className="flex w-full items-stretch min-h-[2.75rem]">
        {steps.map((step, i) => {
          const isDone = step.done;
          const isCurrent = i === currentIndex && !isDone;
          const isFuture = !isDone && !isCurrent;
          const Icon = step.icon;
          const inProgressTrack = i <= currentIndex;

          return (
            <Fragment key={step.key}>
              {i > 0 && (
                <div
                  className="w-px shrink-0 bg-border/70 self-stretch my-1.5"
                  aria-hidden
                />
              )}
              <div
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2 py-1.5 pl-2 sm:pl-3 pr-1 sm:pr-2 first:pl-0 sm:first:pl-1",
                  inProgressTrack && cn("rounded-md", STEP_PROGRESS),
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors duration-200",
                    isDone && "border-emerald-500 bg-emerald-500 text-white shadow-sm",
                    isCurrent && "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/30",
                    isFuture && "border-border/80 bg-muted/30 text-muted-foreground",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                  title={step.label}
                >
                  {isDone ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  ) : (
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                </div>
                <p
                  className={cn(
                    "text-[9px] sm:text-[10px] font-semibold leading-snug text-left line-clamp-2 min-w-0",
                    isDone ? "text-foreground" : isCurrent ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </p>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
