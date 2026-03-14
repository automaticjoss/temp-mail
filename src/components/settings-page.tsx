"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Plus, X, Eye, EyeOff, Globe, Lock } from "lucide-react";

interface SettingsPageProps {
  onDomainsChange: (domains: string[]) => void;
}

export function SettingsPage({ onDomainsChange }: SettingsPageProps) {
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainMessage, setDomainMessage] = useState({ type: "", text: "" });

  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState({ type: "", text: "" });

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/settings");
      const data = await res.json();
      if (data.domains) setDomains(data.domains);
      if (data.username) setUsername(data.username);
    } catch {
      console.error("Failed to fetch settings");
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Domain management
  const handleAddDomain = async () => {
    let domain = newDomain.trim();
    if (!domain) return;
    if (!domain.startsWith("@")) domain = "@" + domain;
    if (domains.includes(domain)) {
      setDomainMessage({ type: "error", text: "Domain already exists" });
      setTimeout(() => setDomainMessage({ type: "", text: "" }), 3000);
      return;
    }

    setDomainLoading(true);
    const updated = [...domains, domain];
    try {
      const res = await fetch("/api/auth/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains: updated }),
      });
      if (res.ok) {
        setDomains(updated);
        onDomainsChange(updated);
        setNewDomain("");
        setDomainMessage({ type: "success", text: "Domain added successfully" });
      }
    } catch {
      setDomainMessage({ type: "error", text: "Failed to add domain" });
    }
    setDomainLoading(false);
    setTimeout(() => setDomainMessage({ type: "", text: "" }), 3000);
  };

  const handleRemoveDomain = async (domain: string) => {
    const updated = domains.filter((d) => d !== domain);
    try {
      const res = await fetch("/api/auth/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains: updated }),
      });
      if (res.ok) {
        setDomains(updated);
        onDomainsChange(updated);
        setDomainMessage({ type: "success", text: "Domain removed" });
        setTimeout(() => setDomainMessage({ type: "", text: "" }), 3000);
      }
    } catch {
      setDomainMessage({ type: "error", text: "Failed to remove domain" });
    }
  };

  // Account update
  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMessage({ type: "", text: "" });

    if (newPassword && newPassword !== confirmPassword) {
      setAccountMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword && !currentPassword) {
      setAccountMessage({
        type: "error",
        text: "Current password is required to set a new password",
      });
      return;
    }

    setAccountLoading(true);
    try {
      const body: Record<string, string> = {};
      if (username) body.username = username;
      if (newPassword) {
        body.newPassword = newPassword;
        body.currentPassword = currentPassword;
      }

      const res = await fetch("/api/auth/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setAccountMessage({ type: "success", text: "Account updated successfully" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setAccountMessage({ type: "error", text: data.error || "Update failed" });
      }
    } catch {
      setAccountMessage({ type: "error", text: "Connection failed" });
    }
    setAccountLoading(false);
    setTimeout(() => setAccountMessage({ type: "", text: "" }), 5000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Domain Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <Globe className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-slate-800">Domain Configuration</h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            Manage the email domains available for user creation.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="@example.com"
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder-slate-400 text-sm"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddDomain())}
            />
            <button
              onClick={handleAddDomain}
              disabled={domainLoading}
              className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {domainMessage.text && (
            <p
              className={`text-sm ${
                domainMessage.type === "error" ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {domainMessage.text}
            </p>
          )}

          <div className="space-y-2">
            {domains.map((domain) => (
              <div
                key={domain}
                className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-lg border border-slate-200"
              >
                <span className="text-sm font-medium text-slate-700">{domain}</span>
                <button
                  onClick={() => handleRemoveDomain(domain)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {domains.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No domains configured</p>
            )}
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <Lock className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-slate-800">Account Settings</h3>
        </div>
        <form onSubmit={handleAccountUpdate} className="p-6 space-y-4">
          {accountMessage.text && (
            <div
              className={`text-sm px-4 py-3 rounded-lg border ${
                accountMessage.type === "error"
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-emerald-50 text-emerald-600 border-emerald-200"
              }`}
            >
              {accountMessage.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-sm"
              autoComplete="username"
            />
          </div>

          <hr className="border-slate-200" />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPass ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-sm pr-10"
                placeholder="Required to change password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPass ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPass ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-sm pr-10"
                placeholder="Leave blank to keep current"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPass ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-sm"
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={accountLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
          >
            <Save className="h-4 w-4" />
            {accountLoading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
