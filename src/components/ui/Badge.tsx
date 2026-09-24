import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "highlight" | "success" | "error";
  size?: "sm" | "md";
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
  ...props
}: BadgeProps) {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };

  const variantStyles = {
    neutral: "bg-bg-surface-raised text-token-secondary border border-border",
    highlight: "bg-highlight text-highlight-fg font-medium",
    success: "bg-feedback-success-subtle text-feedback-success border border-feedback-success/20 font-medium",
    error: "bg-feedback-error-subtle text-feedback-error border border-feedback-error/20 font-medium",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full tracking-wide ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
