import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ScreenShell({
  eyebrow,
  title,
  description,
  children,
  aside,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8", className)}>
      <div className={cn("grid gap-8", aside && "lg:grid-cols-[minmax(0,1fr)_20rem]")}>
        <section className="min-w-0">
          {eyebrow ? (
            <p className="mb-3 text-xs font-black uppercase tracking-[0.17em] text-[var(--blue-600)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display text-4xl font-black uppercase leading-none tracking-[-0.025em] text-[var(--ink)] sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-[var(--ink-muted)]">
              {description}
            </p>
          ) : null}
          <div className="mt-8">{children}</div>
        </section>
        {aside ? <aside>{aside}</aside> : null}
      </div>
    </div>
  );
}
