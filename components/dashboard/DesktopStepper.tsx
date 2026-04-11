"use client";

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

/** Single-row horizontal stepper — minimal vertical space (md+ dashboard only). */
export function DesktopStepper({ steps, currentIndex }: DesktopStepperProps) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 xl:px-8">
      <div className="flex w-full items-stretch gap-0">
        {steps.map((step, i) => {
          const isDone = step.done;
          const isCurrent = i === currentIndex && !isDone;
          const isFuture = !isDone && !isCurrent;
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2",
                i > 0 && "border-l border-border/50 pl-2 sm:pl-3 ml-1 sm:ml-2",
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors duration-200",
                  isDone && "border-emerald-500 bg-emerald-500 text-white shadow-sm",
                  isCurrent && "border-primary bg-primary/5 text-primary ring-1 ring-primary/20",
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
          );
        })}
      </div>
    </div>
  );
}
