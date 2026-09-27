import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  interactive?: boolean;
  selected?: boolean;
}

export function Card({
  as: Component = "div",
  children,
  className = "",
  interactive = false,
  selected = false,
  ...props
}: CardProps) {
  return (
    <Component
      className={`rounded-2xl bg-[#12223B] transition-all text-start overflow-hidden border ${
        selected
          ? "border-brand-orange-gold ring-1 ring-brand-orange-gold shadow-[0_0_24px_rgba(232,134,7,0.2)]"
          : "border-white/10 hover:border-brand-orange-amber/60 shadow-sm"
      } ${
        interactive
          ? "cursor-pointer active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-brand-orange-gold focus-visible:outline-offset-2"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
