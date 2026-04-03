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

/** Compact horizontal stepper — low vertical footprint for desktop. */
export function DesktopStepper({ steps, currentIndex }: DesktopStepperProps) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 xl:px-8">
      <div className="flex items-start w-full">
        {steps.map((step, i) => {
          const isDone = step.done;
          const isCurrent = i === currentIndex && !isDone;
          const isFuture = !isDone && !isCurrent;
          const Icon = step.icon;
          const prevDone = i > 0 ? steps[i - 1]?.done : true;

          return (
            <Fragment key={step.key}>
              {i > 0 && (
                <div
                  className={cn(
                    "hidden sm:flex flex-1 min-w-[6px] h-0.5 mt-[18px] mx-0.5 rounded-full self-start",
                    prevDone ? "bg-emerald-500/40" : "bg-border",
                  )}
                  aria-hidden
                />
              )}
              <div className="flex flex-col items-center text-center min-w-0 shrink-0 w-[4rem] sm:w-[5.25rem] md:flex-1 md:max-w-none">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors duration-200",
                    isDone && "border-emerald-500 bg-emerald-500 text-white shadow-sm",
                    isCurrent && "border-primary bg-primary/5 text-primary ring-2 ring-primary/15",
                    isFuture && "border-border/80 bg-muted/40 text-muted-foreground",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isDone ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Icon className="h-4 w-4" strokeWidth={2} />}
                </div>
                <p
                  className={cn(
                    "mt-1.5 text-[10px] sm:text-[11px] font-semibold leading-tight px-0.5 line-clamp-2",
                    isDone ? "text-foreground" : isCurrent ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">Now</span>
                )}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
