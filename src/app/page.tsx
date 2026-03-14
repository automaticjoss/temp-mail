"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Email, EmailUser } from "@/types/database";
import { Sidebar, type Page } from "@/components/sidebar";
import { EmailTable } from "@/components/email-table";
import { EmailDrawer } from "@/components/email-drawer";
import { UsersManagement } from "@/components/users-management";
import { Bell, Menu } from "lucide-react";

// Configurable domains for user creation
const AVAILABLE_DOMAINS = ["@domain.com", "@mail.test"];

export default function Dashboard() {
  const [activePage, setActivePage] = useState<Page>("inbox");
  const [emails, setEmails] = useState<Email[]>([]);
  const [users, setUsers] = useState<EmailUser[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Page titles
  const pageTitles: Record<Page, string> = {
    inbox: "Inbox Overview",
    users: "Users Management",
  };

  // Fetch emails
  const fetchEmails = useCallback(async () => {
    setLoadingEmails(true);
    const { data, error } = await supabase
      .from("emails")
      .select("id, created_at, recipient, sender, subject, body_html, body_text, raw_content, is_otp")
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

  // Realtime subscriptions
  useEffect(() => {
    fetchEmails();
    fetchUsers();

    const emailChannel = supabase
      .channel("emails-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "emails" },
        (payload) => {
          setEmails((prev) => [payload.new as Email, ...prev]);
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
  }, [fetchEmails, fetchUsers]);

  // User CRUD
  const handleCreateUser = async (email: string, type: "manual" | "random") => {
    const { error } = await supabase
      .from("email_users")
      .insert({ email, type });

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
    const { error } = await supabase
      .from("email_users")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting user:", error);
    }
  };

  // Email drawer
  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              className="text-slate-500 md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold text-slate-800">
              {pageTitles[activePage]}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="h-5 w-5 text-slate-400 hover:text-indigo-600 cursor-pointer" />
              {emails.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 text-sm">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
          {activePage === "inbox" && (
            <EmailTable
              emails={emails}
              loading={loadingEmails}
              onEmailClick={handleEmailClick}
              onRefresh={fetchEmails}
            />
          )}

          {activePage === "users" && (
            <UsersManagement
              users={users}
              domains={AVAILABLE_DOMAINS}
              onCreateUser={handleCreateUser}
              onDeleteUser={handleDeleteUser}
            />
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
    </div>
  );
}
