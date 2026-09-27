import React, { forwardRef, useId } from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      id,
      className = "",
      containerClassName = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className={`w-full flex flex-col gap-1.5 text-start ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-token-primary select-none flex items-center justify-between"
          >
            <span>{label}</span>
            {props.required && (
              <span className="text-xs text-token-muted font-normal ms-2">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : hint ? hintId : undefined
            }
            className={`w-full rounded-xl border border-white/15 text-sm sm:text-base text-token-primary bg-[#0A1124] focus:bg-[#0A1124] px-3.5 py-3 min-h-[46px] placeholder:text-token-muted/50 focus:outline-none focus:ring-2 disabled:bg-white/5 disabled:text-slate-500 disabled:cursor-not-allowed transition-all ${
              error
                ? "border-red-500 focus:border-red-500 ring-2 ring-red-500/20 bg-red-950/20"
                : "hover:border-white/25 focus:border-brand-orange-gold focus:ring-brand-orange-gold/30"
            } ${className}`}
            {...props}
          />
        </div>

        {hint && !error && (
          <p id={hintId} className="text-xs text-token-muted">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
