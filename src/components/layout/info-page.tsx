import type { ReactNode } from "react";

export function InfoPage({
  eyebrow,
  title,
  introduction,
  children,
}: {
  eyebrow: string;
  title: string;
  introduction: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--blue-600)]">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-display text-5xl font-black uppercase leading-none sm:text-6xl">
        {title}
      </h1>
      <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[var(--ink-muted)]">
        {introduction}
      </p>
      <div className="mt-10 space-y-9 [&_a]:font-bold [&_a]:text-[var(--blue-700)] [&_a]:underline [&_a]:underline-offset-4 [&_h2]:text-2xl [&_h2]:font-black [&_h3]:text-lg [&_h3]:font-black [&_li]:leading-relaxed [&_p]:leading-relaxed [&_p]:text-[var(--ink-muted)] [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </article>
  );
}
