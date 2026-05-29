"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "accent";
type Size = "sm" | "md" | "lg" | "xl";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  leading?: ReactNode;
  trailing?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
};

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-200",
  secondary:
    "bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 disabled:bg-surface-sunken disabled:text-ink-subtle",
  ghost:
    "bg-transparent text-ink hover:bg-surface-muted active:bg-surface-sunken",
  outline:
    "bg-white text-ink border border-border hover:bg-surface-muted active:bg-surface-sunken",
  danger:
    "bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-700",
  accent:
    "bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 disabled:bg-accent-200",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-[14px] gap-2",
  lg: "h-12 px-5 text-[15px] gap-2",
  xl: "h-14 px-7 text-[16px] gap-2.5",
};

export default function Button({
  variant = "primary",
  size = "md",
  leading,
  trailing,
  loading,
  fullWidth,
  disabled,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-semibold",
        "transition-colors duration-150 select-none",
        "disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : (
        leading
      )}
      <span className={loading ? "opacity-70" : undefined}>{children}</span>
      {!loading && trailing}
    </button>
  );
}
