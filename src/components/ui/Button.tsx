import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    // Base styles using logical properties and tokens
    const baseStyles =
      "inline-flex items-center justify-center font-bold rounded-xl transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy-petrol disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]";

    const sizeStyles = {
      sm: "text-xs px-3.5 py-2 min-h-[38px]",
      md: "text-sm px-5 py-2.5 min-h-[44px]", // 44px min touch target for mobile
      lg: "text-base px-6 py-3.5 min-h-[50px]", // Prominent touch target for primary CTAs
    };

    const variantStyles = {
      primary:
        "bg-brand-navy-dark text-white hover:bg-brand-navy-slate shadow-sm",
      secondary:
        "bg-slate-100 text-brand-navy-dark hover:bg-slate-200",
      outline:
        "bg-white text-brand-navy-dark ring-1 ring-slate-900/10 hover:ring-slate-900/20 hover:bg-slate-50",
      danger:
        "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading && (
          <Loader2 className="animate-spin me-2 h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";
