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
      className={`rounded-lg bg-bg-surface border p-5 transition-all text-start ${
        selected
          ? "border-highlight ring-2 ring-highlight bg-highlight-subtle/30 shadow-md"
          : "border-border hover:border-border-strong shadow-sm"
      } ${
        interactive
          ? "cursor-pointer active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-highlight focus-visible:outline-offset-2"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
