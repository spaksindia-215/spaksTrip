"use client";

import { forwardRef, type SelectHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  helperText?: string;
  leading?: ReactNode;
  sizeVariant?: "sm" | "md" | "lg";
};

const SIZE_STYLES = {
  sm: "h-9 text-[13px] px-3",
  md: "h-11 text-[14px] px-3.5",
  lg: "h-12 text-[15px] px-4",
};

const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, hint, error, helperText, leading, sizeVariant = "md", id, className, ...rest },
  ref,
) {
  const invalid = Boolean(error || helperText);
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label ? (
        <label htmlFor={id} className="text-[13px] font-medium text-ink-soft">
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          "flex items-center rounded-md bg-white border transition-colors cursor-pointer",
          "focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20",
          invalid ? "border-danger-500" : "border-border",
          SIZE_STYLES[sizeVariant],
        )}
      >
        {leading ? <span className="text-ink-muted">{leading}</span> : null}
        <select
          ref={ref}
          id={id}
          aria-invalid={invalid || undefined}
          className="flex-1 min-w-0 h-full bg-transparent outline-none text-ink appearance-none cursor-pointer"
          {...rest}
        />
      </div>
      {error || helperText ? (
        <p className={cn("text-[12px] font-medium",
          error ? "text-danger-600" : "text-ink-muted"
        )}>
          {error || helperText}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
});

export default Select;
