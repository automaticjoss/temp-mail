"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Email, EmailUser } from "@/types/database";
import { Sidebar, type Page } from "@/components/sidebar";
import { EmailTable } from "@/components/email-table";
import { EmailDrawer } from "@/components/email-drawer";
import { UsersManagement } from "@/components/users-management";
import { LoginForm } from "@/components/login-form";
import { SettingsPage } from "@/components/settings-page";
import {
  NotificationContainer,
  useNotifications,
} from "@/components/notification-toast";
import { Bell, Menu, Mail } from "lucide-react";
import { formatDistanceToNow } from "@/lib/date-utils";

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [activePage, setActivePage] = useState<Page>("inbox");
  const [emails, setEmails] = useState<Email[]>([]);
  const [users, setUsers] = useState<EmailUser[]>([]);
  const [availableDomains, setAvailableDomains] = useState<string[]>([
    "@domain.com",
    "@mail.test",
  ]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Load read IDs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tmaildash_read");
      if (saved) setReadIds(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("tmaildash_read", JSON.stringify([...next]));
      return next;
    });
  }, []);

  const { notifications, notify, dismiss } = useNotifications();

  // Page titles
  const pageTitles: Record<Page, string> = {
    inbox: "Inbox Overview",
    users: "Users Management",
    settings: "Settings",
  };

  // Check auth on mount
  useEffect(() => {
    const auth = sessionStorage.getItem("tmaildash_auth");
    setIsAuthenticated(auth === "true");
    setAuthChecked(true);
  }, []);

  // Fetch domains from API
  const fetchDomains = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/settings");
      const data = await res.json();
      if (data.domains && data.domains.length > 0) {
        setAvailableDomains(data.domains);
      }
    } catch {
      // fallback to defaults
    }
  }, []);

  // Fetch emails
  const fetchEmails = useCallback(async () => {
    setLoadingEmails(true);
    const { data, error } = await supabase
      .from("emails")
      .select(
        "id, created_at, recipient, sender, subject, body_html, body_text, raw_content, is_otp"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching emails:", error);
    }
    setEmails((data as Email[]) || []);
    setLoadingEmails(false);
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from("email_users")
      .select("id, created_at, email, type")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
    }
    setUsers((data as EmailUser[]) || []);
  }, []);

  // Realtime subscriptions (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchEmails();
    fetchUsers();
    fetchDomains();

    const emailChannel = supabase
      .channel("emails-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "emails" },
        (payload) => {
          const newEmail = payload.new as Email;
          setEmails((prev) => [newEmail, ...prev]);
          notify(newEmail.sender, newEmail.subject || "");
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "emails" },
        (payload) => {
          setEmails((prev) => prev.filter((e) => e.id !== payload.old.id));
        }
      )
      .subscribe();

    const usersChannel = supabase
      .channel("users-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "email_users" },
        (payload) => {
          setUsers((prev) => [payload.new as EmailUser, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "email_users" },
        (payload) => {
          setUsers((prev) => prev.filter((u) => u.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(emailChannel);
      supabase.removeChannel(usersChannel);
    };
  }, [isAuthenticated, fetchEmails, fetchUsers, fetchDomains, notify]);

  // User CRUD
  const handleCreateUser = async (email: string, type: "manual" | "random") => {
    const { error } = await supabase.from("email_users").insert({ email, type });

    if (error) {
      if (error.code === "23505") {
        alert("This email address already exists!");
      } else {
        console.error("Error creating user:", error);
        alert("Failed to create user: " + error.message);
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    const { error } = await supabase.from("email_users").delete().eq("id", id);

    if (error) {
      console.error("Error deleting user:", error);
    }
  };

  // Delete email
  const handleDeleteEmail = async (id: string) => {
    try {
      const res = await fetch(`/api/emails/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEmails((prev) => prev.filter((e) => e.id !== id));
      } else {
        console.error("Failed to delete email");
      }
    } catch (err) {
      console.error("Error deleting email:", err);
    }
  };

  // Email drawer
  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    setIsDrawerOpen(true);
    markAsRead(email.id);
  };

  const unreadCount = emails.filter((e) => !readIds.has(e.id)).length;

  // Logout
  const handleLogout = () => {
    sessionStorage.removeItem("tmaildash_auth");
    setIsAuthenticated(false);
  };

  // Wait for auth check
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={handleLogout}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen min-w-0">
        {/* Top header */}
        <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="text-slate-500 md:hidden p-1"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-lg md:text-xl font-semibold text-slate-800 truncate">
              {pageTitles[activePage]}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setBellOpen(!bellOpen)}
                className="relative p-1"
              >
                <Bell className="h-5 w-5 text-slate-400 hover:text-indigo-600 cursor-pointer" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Bell Dropdown */}
              {bellOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setBellOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-40 overflow-hidden">
                    <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-800">Recent Emails</h4>
                      {unreadCount > 0 && (
                        <span className="text-[11px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {emails.slice(0, 4).length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-400">No emails yet</div>
                      ) : (
                        emails.slice(0, 4).map((email) => (
                          <button
                            key={email.id}
                            onClick={() => {
                              handleEmailClick(email);
                              setBellOpen(false);
                              setActivePage("inbox");
                            }}
                            className={`w-full text-left p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                              readIds.has(email.id) ? "opacity-60" : ""
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                readIds.has(email.id) ? "bg-slate-300" : "bg-indigo-500"
                              }`} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className={`text-sm truncate ${
                                    readIds.has(email.id) ? "text-slate-500" : "text-slate-800 font-semibold"
                                  }`}>
                                    {email.sender}
                                  </p>
                                  <span className="text-[11px] text-slate-400 shrink-0">
                                    {formatDistanceToNow(email.created_at)}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                  {email.subject || "(No subject)"}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    {emails.length > 0 && (
                      <button
                        onClick={() => {
                          setActivePage("inbox");
                          setBellOpen(false);
                        }}
                        className="w-full p-2.5 text-center text-xs font-medium text-indigo-600 hover:bg-indigo-50 border-t border-slate-100 transition-colors"
                      >
                        View All Messages
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setActivePage("settings")}
              className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 text-sm hover:ring-2 hover:ring-indigo-400 transition-all cursor-pointer"
            >
              A
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 md:p-6">
          {activePage === "inbox" && (
            <EmailTable
              emails={emails}
              loading={loadingEmails}
              onEmailClick={handleEmailClick}
              onRefresh={fetchEmails}
              onDeleteEmail={handleDeleteEmail}
              readIds={readIds}
            />
          )}

          {activePage === "users" && (
            <UsersManagement
              users={users}
              domains={availableDomains}
              onCreateUser={handleCreateUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activePage === "settings" && (
            <SettingsPage onDomainsChange={setAvailableDomains} />
          )}
        </main>
      </div>

      {/* Email Detail Drawer */}
      <EmailDrawer
        email={selectedEmail}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedEmail(null);
        }}
      />

      {/* Notification Toasts */}
      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  );
}
