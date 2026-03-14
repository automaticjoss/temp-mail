"use client";

import { useState } from "react";
import type { Email } from "@/types/database";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, Mail, User, Clock } from "lucide-react";
import { formatDistanceToNow, formatDateTime } from "@/lib/date-utils";

interface EmailDrawerProps {
  email: Email | null;
  isOpen: boolean;
  onClose: () => void;
}

const OTP_REGEX = /\b(\d{6})\b/g;

function extractOTP(text: string | null): string | null {
  if (!text) return null;
  const match = text.match(/\b(\d{6})\b/);
  return match ? match[1] : null;
}

function highlightOTP(text: string | null): React.ReactNode {
  if (!text) return null;
  const parts = text.split(OTP_REGEX);
  return parts.map((part, index) => {
    if (/^\d{6}$/.test(part)) {
      return (
        <Badge
          key={index}
          className="bg-emerald-100 text-emerald-700 border-emerald-300 mx-1 text-base font-mono"
        >
          {part}
        </Badge>
      );
    }
    return part;
  });
}

export function EmailDrawer({ email, isOpen, onClose }: EmailDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!email) return null;

  const otp = extractOTP(email.body_text) || extractOTP(email.body_html);

  const handleCopyOTP = async () => {
    if (!otp) return;
    try {
      await navigator.clipboard.writeText(otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy OTP:", err);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[500px] sm:w-[600px] bg-white border-slate-200 text-slate-800 overflow-y-auto">
        <SheetHeader className="border-b border-slate-200 pb-4">
          <SheetTitle className="text-slate-800 flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-500" />
            Message Details
          </SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* OTP Badge & Copy */}
          {email.is_otp && otp && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-600 uppercase tracking-wider font-medium mb-1">
                    Detected OTP Code
                  </p>
                  <p className="text-3xl font-mono font-bold text-emerald-700">
                    {otp}
                  </p>
                </div>
                <Button
                  onClick={handleCopyOTP}
                  variant="outline"
                  size="sm"
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Email Metadata */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-slate-400 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 uppercase tracking-wider">From</p>
                <p className="text-sm text-slate-700 truncate">{email.sender}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-slate-400 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 uppercase tracking-wider">To</p>
                <p className="text-sm text-slate-700 truncate">{email.recipient}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-slate-400 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Received</p>
                <p className="text-sm text-slate-700">
                  {formatDateTime(email.created_at)}
                  <span className="text-slate-400 ml-2">
                    ({formatDistanceToNow(email.created_at)})
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Subject</p>
            <p className="text-slate-800 font-medium">
              {email.subject || <span className="text-slate-400 italic">No subject</span>}
            </p>
          </div>

          {/* Body */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Content</p>

            {email.body_html ? (
              <div className="bg-slate-50 rounded-lg p-4 max-h-[400px] overflow-auto border border-slate-200">
                <div
                  className="prose prose-sm max-w-none
                    prose-p:text-slate-600 prose-p:leading-relaxed
                    prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-slate-800"
                  dangerouslySetInnerHTML={{ __html: email.body_html }}
                />
              </div>
            ) : email.body_text ? (
              <div className="bg-slate-50 rounded-lg p-4 max-h-[400px] overflow-auto border border-slate-200">
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {highlightOTP(email.body_text)}
                </p>
              </div>
            ) : (
              <p className="text-slate-400 italic text-sm">No content available</p>
            )}
          </div>

          {/* Status */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
            <p className="text-xs text-slate-400">Status</p>
            {email.is_otp ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                OTP Detected
              </Badge>
            ) : (
              <Badge variant="outline" className="border-slate-300 text-slate-500">
                Standard Message
              </Badge>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
