"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  sizeVariant?: "sm" | "md" | "lg";
};

const SIZE_STYLES = {
  sm: "h-9 text-[13px] px-3",
  md: "h-11 text-[14px] px-3.5",
  lg: "h-12 text-[15px] px-4",
};

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, hint, error, leading, trailing, sizeVariant = "md", id, className, ...rest },
  ref,
) {
  const invalid = Boolean(error);
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label ? (
        <label htmlFor={id} className="text-[13px] font-medium text-ink-soft">
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          "flex items-center gap-2 rounded-md bg-white border transition-colors cursor-text",
          "focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20",
          invalid ? "border-danger-500" : "border-border",
          SIZE_STYLES[sizeVariant],
        )}
      >
        {leading ? <span className="text-ink-muted">{leading}</span> : null}
        <input
          ref={ref}
          id={id}
          aria-invalid={invalid || undefined}
          className="flex-1 min-w-0 h-full bg-transparent outline-none placeholder:text-ink-subtle text-ink"
          {...rest}
        />
        {trailing ? <span className="text-ink-muted">{trailing}</span> : null}
      </div>
      {error ? (
        <p className="text-[12px] font-medium text-danger-600">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
