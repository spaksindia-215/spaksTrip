"use client";

import { forwardRef, type TextareaHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
  helperText?: string;
  leading?: ReactNode;
};

const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { label, hint, error, helperText, leading, id, className, ...rest },
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
          "flex items-start rounded-md bg-white border transition-colors",
          "focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20",
          invalid ? "border-danger-500" : "border-border",
          "p-3",
        )}
      >
        <textarea
          ref={ref}
          id={id}
          aria-invalid={invalid || undefined}
          className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-ink-subtle text-ink resize-none"
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

export default Textarea;
