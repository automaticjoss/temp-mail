"use client";

import { Inbox, Users, Send } from "lucide-react";

export type Page = "inbox" | "users";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex-col hidden md:flex">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 bg-slate-950 font-bold text-white text-lg tracking-wider border-b border-slate-800">
        <Send className="h-5 w-5 text-indigo-500 mr-2" />
        TMailDash.
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <button
          onClick={() => onNavigate("inbox")}
          className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
            activePage === "inbox"
              ? "bg-indigo-600 text-white"
              : "hover:bg-slate-800 hover:text-white text-slate-300"
          }`}
        >
          <Inbox className="h-5 w-5" />
          <span className="ml-3 font-medium">Inbox</span>
        </button>
        <button
          onClick={() => onNavigate("users")}
          className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
            activePage === "users"
              ? "bg-indigo-600 text-white"
              : "hover:bg-slate-800 hover:text-white text-slate-300"
          }`}
        >
          <Users className="h-5 w-5" />
          <span className="ml-3 font-medium">Users Management</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 text-sm text-slate-500 text-center">
        v1.0.0 Admin
      </div>
    </aside>
  );
}
