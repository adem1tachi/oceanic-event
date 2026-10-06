"use client";

import { useRouter } from "@/i18n/navigation";
import {
  BarChart3,
  Users,
  Trophy,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type AdminTab = "stats" | "participants" | "settings";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  adminEmail?: string | null;
}

export function AdminSidebar({
  activeTab,
  onTabChange,
  adminEmail,
}: AdminSidebarProps) {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/admin/login");
    } catch {
      router.push("/admin/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems: { id: AdminTab; label: string; icon: any }[] = [
    { id: "stats", label: "Traffic & Statistics", icon: BarChart3 },
    { id: "participants", label: "Participants", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleSelectTab = (tab: AdminTab) => {
    onTabChange(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 text-slate-900 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo-oceanic.png"
            alt="OCEANIC"
            width={72}
            height={26}
            className="object-contain"
          />
          <span className="text-xs font-bold text-slate-500">| Admin Portal</span>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
          aria-label="Toggle menu"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/30 z-40 backdrop-blur-xs"
        />
      )}

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-white border-r border-slate-200 text-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Logo & Platform Name */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-oceanic.png"
                alt="OCEANIC"
                width={80}
                height={28}
                className="object-contain"
              />
              <span className="text-[11px] font-semibold text-slate-400">
                Admin Portal
              </span>
            </div>

            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-1 text-left" aria-label="Sidebar Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-slate-100 space-y-2 text-left">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Preview Visitor Page</span>
            </span>
          </a>

          <div className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 truncate dir-ltr text-left">
            {adminEmail || "admin@oceanic.dz"}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
