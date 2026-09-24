import type { ReactNode } from "react";
import "./globals.css";

type Props = {
  children: ReactNode;
};

// Root layout passing children to locale-specific layout
export default function RootLayout({ children }: Props) {
  return children;
}
