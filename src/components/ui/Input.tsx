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
            className={`w-full rounded-md border text-base text-token-primary bg-bg-surface px-3.5 py-3 min-h-[48px] placeholder:text-token-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight disabled:bg-bg-surface-raised disabled:text-token-muted disabled:cursor-not-allowed transition-colors ${
              error
                ? "border-feedback-error focus-visible:outline-feedback-error bg-feedback-error-subtle/30"
                : "border-border hover:border-border-strong focus-visible:border-highlight"
            } ${className}`}
            {...props}
          />
        </div>

        {hint && !error && (
          <p id={hintId} className="text-xs text-token-muted">
            {hint}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-medium text-feedback-error flex items-center gap-1"
          >
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
