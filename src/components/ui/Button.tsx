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
      "inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]";

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 min-h-[36px]",
      md: "text-sm px-4 py-2.5 min-h-[44px]", // 44px min touch target for mobile
      lg: "text-base px-6 py-3.5 min-h-[52px]", // Prominent touch target for primary CTAs
    };

    const variantStyles = {
      primary:
        "bg-action text-action-fg hover:bg-action-hover border border-transparent shadow-sm",
      secondary:
        "bg-bg-surface-raised text-token-primary hover:bg-border border border-border",
      outline:
        "bg-transparent text-token-primary border border-border-strong hover:bg-bg-surface-raised",
      danger:
        "bg-feedback-error text-white hover:opacity-90 border border-transparent",
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
