"use client";

import { useEffect, useState, useCallback } from "react";
import { Mail, X } from "lucide-react";

interface Notification {
  id: string;
  sender: string;
  subject: string;
}

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <div className="animate-[slideIn_0.3s_ease-out] bg-white rounded-lg shadow-lg border border-slate-200 p-4 w-80">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <Mail className="h-4 w-4 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">New Email</p>
          <p className="text-xs text-slate-500 truncate">{notification.sender}</p>
          <p className="text-xs text-slate-600 mt-1 truncate">
            {notification.subject || "(No Subject)"}
          </p>
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="text-slate-400 hover:text-slate-600 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // First tone — D5
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc1.type = "sine";
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.3);

    // Second tone — A5
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    osc2.type = "sine";
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio context not available
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((sender: string, subject: string) => {
    const id = crypto.randomUUID();
    setNotifications((prev) => [...prev, { id, sender, subject }]);
    playNotificationSound();
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, notify, dismiss };
}

interface NotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export function NotificationContainer({ notifications, onDismiss }: NotificationContainerProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-2 pointer-events-auto">
      {notifications.map((n) => (
        <NotificationItem key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
