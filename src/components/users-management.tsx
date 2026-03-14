"use client";

import { useState } from "react";
import { Pencil, Shuffle, Trash2, Copy, Check } from "lucide-react";
import type { EmailUser } from "@/types/database";
import { formatDistanceToNow } from "@/lib/date-utils";

interface UsersManagementProps {
  users: EmailUser[];
  domains: string[];
  onCreateUser: (email: string, type: "manual" | "random") => void;
  onDeleteUser: (id: string) => void;
}

function generateRandomUsername(length: number): string {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function UsersManagement({
  users,
  domains,
  onCreateUser,
  onDeleteUser,
}: UsersManagementProps) {
  const [manualUsername, setManualUsername] = useState("");
  const [selectedDomain, setSelectedDomain] = useState(domains[0] || "@domain.com");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyEmail = async (e: React.MouseEvent, email: string, id: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(email);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  };

  const handleManualCreate = () => {
    const username = manualUsername.trim().replace(/\s+/g, "").toLowerCase();
    if (!username) {
      alert("Username cannot be empty!");
      return;
    }
    // Basic validation: alphanumeric, dots, underscores only
    if (!/^[a-z0-9._]+$/.test(username)) {
      alert("Username can only contain letters, numbers, dots, and underscores.");
      return;
    }
    onCreateUser(username + selectedDomain, "manual");
    setManualUsername("");
  };

  const handleRandomCreate = () => {
    const randomEmail =
      generateRandomUsername(8) + Math.floor(Math.random() * 100) + (domains[0] || "@domain.com");
    onCreateUser(randomEmail, "random");
  };

  return (
    <div className="space-y-6">
      {/* Create New Email User */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
          Create New Email User
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manual Creation */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Manual Creation
            </h4>
            <div className="flex space-x-2">
              <input
                type="text"
                value={manualUsername}
                onChange={(e) => setManualUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualCreate()}
                placeholder="username"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              />
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none"
              >
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleManualCreate}
              className="mt-3 w-full bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Add Custom User
            </button>
          </div>

          {/* Random Generation */}
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex flex-col justify-center">
            <h4 className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-1.5">
              <Shuffle className="h-3.5 w-3.5" />
              Random Generation
            </h4>
            <p className="text-xs text-indigo-600 mb-4">
              Instantly generate a random alphanumeric email address.
            </p>
            <button
              onClick={handleRandomCreate}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm"
            >
              Generate Random User
            </button>
          </div>
        </div>
      </div>

      {/* Active Users List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">Active Users List</h3>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
            {users.length} Users
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 font-medium">Email Address</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Created At</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    No users created yet. Add one above.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 font-medium text-indigo-600">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{user.email}</span>
                        <button
                          onClick={(e) => handleCopyEmail(e, user.email, user.id)}
                          className="shrink-0 text-slate-400 hover:text-indigo-600 transition-colors p-0.5 rounded hover:bg-indigo-50"
                          title="Copy email"
                        >
                          {copiedId === user.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      {user.type === "random" ? (
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs">
                          Random
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">
                          Manual
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400">
                      {formatDistanceToNow(user.created_at)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
