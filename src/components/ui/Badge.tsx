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
    neutral: "bg-white/10 text-slate-200 font-semibold border border-white/10",
    highlight: "bg-brand-orange-gold/15 text-brand-orange-gold font-bold border border-brand-orange-gold/30",
    success: "bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30",
    error: "bg-rose-500/15 text-rose-400 font-bold border border-rose-500/30",
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
