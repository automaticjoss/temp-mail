"use client";

import { useState, useMemo } from "react";
import type { Email } from "@/types/database";
import { formatDistanceToNow } from "@/lib/date-utils";
import { RefreshCw, Search, Trash2, X } from "lucide-react";

interface EmailTableProps {
  emails: Email[];
  loading: boolean;
  onEmailClick: (email: Email) => void;
  onRefresh: () => void;
  onDeleteEmail: (id: string) => void;
}

export function EmailTable({ emails, loading, onEmailClick, onRefresh, onDeleteEmail }: EmailTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return emails;
    const q = search.toLowerCase();
    return emails.filter(
      (e) =>
        e.sender.toLowerCase().includes(q) ||
        e.recipient.toLowerCase().includes(q) ||
        (e.subject && e.subject.toLowerCase().includes(q))
    );
  }, [emails, search]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteEmail(id);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-slate-200 bg-slate-50/50 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Recent Messages</h3>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by sender, recipient, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {search && (
          <p className="text-xs text-slate-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""} found</p>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-indigo-500"></div>
              <span className="text-slate-400 text-sm">Loading messages...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-slate-400 text-sm">{search ? "No matching messages" : "No messages yet"}</p>
            <p className="text-slate-300 text-xs mt-1">
              {search ? "Try a different search term" : "Incoming emails will appear here in real-time"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 font-medium">From</th>
                  <th className="p-4 font-medium">Subject</th>
                  <th className="p-4 font-medium">Recipient</th>
                  <th className="p-4 font-medium text-right">Date</th>
                  <th className="p-4 font-medium text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                {filtered.map((email) => (
                  <tr
                    key={email.id}
                    onClick={() => onEmailClick(email)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <td className="p-4 font-medium truncate max-w-[200px]">
                      {email.sender}
                    </td>
                    <td className="p-4 text-slate-600 truncate max-w-[300px]">
                      {email.subject || (
                        <span className="text-slate-300 italic">No subject</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md text-xs">
                        {email.recipient}
                      </span>
                    </td>
                    <td className="p-4 text-right text-slate-400">
                      {formatDistanceToNow(email.created_at)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={(e) => handleDelete(e, email.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1 rounded hover:bg-red-50"
                        title="Delete email"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.map((email) => (
                <div
                  key={email.id}
                  onClick={() => onEmailClick(email)}
                  className="p-4 hover:bg-slate-50 cursor-pointer transition-colors active:bg-slate-100"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-800 truncate max-w-[55%]">
                      {email.sender}
                    </p>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs text-slate-400">
                        {formatDistanceToNow(email.created_at)}
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, email.id)}
                        className="text-slate-300 hover:text-red-500 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 truncate">
                    {email.subject || <span className="text-slate-300 italic">No subject</span>}
                  </p>
                  <span className="inline-block mt-1.5 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[11px]">
                    {email.recipient}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
