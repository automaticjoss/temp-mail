"use client";

import { Inbox, Users, Send, Settings, LogOut, X } from "lucide-react";
import { useEffect } from "react";

export type Page = "inbox" | "users" | "settings";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ activePage, onNavigate, onLogout, mobileOpen, onMobileClose }: SidebarProps) {
  const navItems: { page: Page; label: string; icon: React.ReactNode }[] = [
    { page: "inbox", label: "Inbox", icon: <Inbox className="h-5 w-5" /> },
    { page: "users", label: "Users Management", icon: <Users className="h-5 w-5" /> },
    { page: "settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ];

  // Close mobile sidebar on escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) onMobileClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mobileOpen, onMobileClose]);

  const handleNav = (page: Page) => {
    onNavigate(page);
    onMobileClose?.();
  };

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="h-16 flex items-center justify-between px-6 bg-slate-950 font-bold text-white text-lg tracking-wider border-b border-slate-800">
        <div className="flex items-center">
          <Send className="h-5 w-5 text-indigo-500 mr-2" />
          TMailDash.
        </div>
        {mobileOpen && (
          <button onClick={onMobileClose} className="md:hidden text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map(({ page, label, icon }) => (
          <button
            key={page}
            onClick={() => handleNav(page)}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
              activePage === page
                ? "bg-indigo-600 text-white"
                : "hover:bg-slate-800 hover:text-white text-slate-300"
            }`}
          >
            {icon}
            <span className="ml-3 font-medium">{label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="ml-3 text-sm font-medium">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-col hidden md:flex shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 text-slate-300 flex flex-col z-50 animate-[slideInLeft_0.2s_ease-out]">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
