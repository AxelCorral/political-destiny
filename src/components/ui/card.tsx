import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] shadow-[0_16px_50px_rgba(12,30,58,0.08)]",
        className,
      )}
      {...props}
    />
  );
}
