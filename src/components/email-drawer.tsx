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
      <SheetContent className="w-[90vw] sm:w-[480px] md:w-[540px] sm:max-w-[540px] bg-white border-slate-200 text-slate-800 overflow-y-auto p-0">
        <SheetHeader className="border-b border-slate-200 p-5">
          <SheetTitle className="text-slate-800 flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-indigo-500" />
            Message Details
          </SheetTitle>
        </SheetHeader>

        <div className="p-5 space-y-5 overflow-y-auto">
          {/* OTP Badge & Copy */}
          {email.is_otp && otp && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] text-emerald-600 uppercase tracking-wider font-semibold mb-1">
                    Detected OTP Code
                  </p>
                  <p className="text-2xl sm:text-3xl font-mono font-bold text-emerald-700 tracking-widest">
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
          <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">From</p>
                <p className="text-sm text-slate-700 break-all">{email.sender}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">To</p>
                <p className="text-sm text-slate-700 break-all">{email.recipient}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Received</p>
                <p className="text-sm text-slate-700">
                  {formatDateTime(email.created_at)}
                  <span className="text-slate-400 ml-1 text-xs">
                    ({formatDistanceToNow(email.created_at)})
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1.5">Subject</p>
            <p className="text-slate-800 font-semibold text-[15px] break-words">
              {email.subject || <span className="text-slate-400 italic font-normal">No subject</span>}
            </p>
          </div>

          {/* Body */}
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-2">Content</p>

            {email.body_html ? (
              <div className="bg-slate-50 rounded-xl p-4 overflow-auto border border-slate-100" style={{ maxHeight: 'calc(100vh - 500px)', minHeight: '120px' }}>
                <div
                  className="prose prose-sm max-w-none break-words
                    prose-p:text-slate-600 prose-p:leading-relaxed
                    prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-slate-800
                    prose-img:max-w-full prose-img:h-auto"
                  dangerouslySetInnerHTML={{ __html: email.body_html }}
                />
              </div>
            ) : email.body_text ? (
              <div className="bg-slate-50 rounded-xl p-4 overflow-auto border border-slate-100" style={{ maxHeight: 'calc(100vh - 500px)', minHeight: '120px' }}>
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed break-words">
                  {highlightOTP(email.body_text)}
                </p>
              </div>
            ) : (
              <p className="text-slate-400 italic text-sm">No content available</p>
            )}
          </div>

          {/* Status */}
          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Status</p>
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
