"use client";

import type { Email } from "@/types/database";
import { formatDistanceToNow } from "@/lib/date-utils";
import { RefreshCw } from "lucide-react";

interface EmailTableProps {
  emails: Email[];
  loading: boolean;
  onEmailClick: (email: Email) => void;
  onRefresh: () => void;
}

export function EmailTable({ emails, loading, onEmailClick, onRefresh }: EmailTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
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

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-indigo-500"></div>
              <span className="text-slate-400 text-sm">Loading messages...</span>
            </div>
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-slate-400 text-sm">No messages yet</p>
            <p className="text-slate-300 text-xs mt-1">Incoming emails will appear here in real-time</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 font-medium">From</th>
                <th className="p-4 font-medium">Subject</th>
                <th className="p-4 font-medium">Recipient</th>
                <th className="p-4 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {emails.map((email) => (
                <tr
                  key={email.id}
                  onClick={() => onEmailClick(email)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
