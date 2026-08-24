import React from 'react';
import { Bell, X, Sparkles } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export default function NotificationToast() {
  const { toastNotification, dismissToast } = useNotifications();

  if (!toastNotification) return null;

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="glass-panel bg-gray-900/95 border border-orange-500/40 rounded-2xl p-4 shadow-2xl shadow-orange-950/40 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white">{toastNotification.title}</h4>
            <button
              onClick={dismissToast}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-gray-300 mt-1 leading-normal">{toastNotification.message}</p>
        </div>
      </div>
    </div>
  );
}
