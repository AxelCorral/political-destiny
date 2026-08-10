import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border text-sm font-extrabold tracking-[0.01em] transition-[transform,background-color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none",
  {
    variants: {
      variant: {
        primary:
          "border-[var(--blue-600)] bg-[var(--blue-600)] px-5 py-3 text-white shadow-[0_8px_24px_rgba(26,72,139,0.22)] hover:-translate-y-0.5 hover:bg-[var(--blue-700)] active:translate-y-0",
        secondary:
          "border-[var(--line)] bg-[var(--paper)] px-5 py-3 text-[var(--ink)] shadow-sm hover:border-[var(--blue-400)] hover:bg-white",
        ghost:
          "border-transparent bg-transparent px-3 py-2 text-[var(--ink-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]",
        danger:
          "border-[var(--red-700)] bg-[var(--red-700)] px-5 py-3 text-white hover:bg-[var(--red-800)]",
      },
      size: {
        // 36px tall by design intent (a denser control among precise-pointer
        // desktop UI), but forced to the 44px tactile target under a coarse
        // (touch) pointer so it never falls below the target on mobile.
        default: "min-h-11",
        compact:
          "min-h-9 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs [@media(pointer:coarse)]:min-h-11",
        large: "min-h-13 rounded-[var(--radius-md)] px-6 py-4 text-base",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
