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

export function DesktopStepper({ steps, currentIndex }: DesktopStepperProps) {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 xl:px-8">
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
                    "hidden md:flex flex-1 min-w-[8px] h-[2px] mt-[22px] mx-1 rounded-full self-start",
                    prevDone ? "bg-emerald-500/45" : "bg-border",
                  )}
                  aria-hidden
                />
              )}
              <div className="flex flex-col items-center text-center min-w-0 shrink-0 w-[4.5rem] sm:w-24 md:flex-1 md:max-w-none">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl border-2 transition-all duration-200",
                    isDone && "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/25",
                    isCurrent && "border-primary bg-background text-primary ring-4 ring-primary/12 scale-[1.02]",
                    isFuture && "border-border bg-muted/50 text-muted-foreground",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isDone ? <Check className="h-5 w-5" strokeWidth={2.5} /> : <Icon className="h-5 w-5" strokeWidth={2} />}
                </div>
                <p
                  className={cn(
                    "mt-3 text-[11px] sm:text-xs font-semibold leading-tight px-0.5 line-clamp-2",
                    isDone ? "text-foreground" : isCurrent ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-primary/90 hidden sm:inline">
                    Current
                  </span>
                )}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
