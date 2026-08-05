import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[1.25rem] border border-[var(--line)] bg-[var(--paper)] shadow-[0_16px_50px_rgba(12,30,58,0.08)]",
        className,
      )}
      {...props}
    />
  );
}
