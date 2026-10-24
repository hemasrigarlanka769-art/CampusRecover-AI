import React from 'react';
import { Bell, X, Sparkles, MessageSquare, FileCheck2, CheckCheck } from 'lucide-react';
import { Notification } from '../types/index.js';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onNavigate: (url: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Campus Alerts</h3>
            <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
              {notifications.filter((n) => !n.isRead).length} Unread
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Activity Feed</span>
          <button
            onClick={onMarkAllRead}
            className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
          >
            <CheckCheck className="w-3 h-3" />
            <span>Mark all read</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 text-xs">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Bell className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No notifications right now.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const isMatch = n.type === 'MATCH_FOUND';
              const isMessage = n.type === 'MESSAGE';

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    onMarkRead(n.id);
                    if (n.linkUrl) {
                      onNavigate(n.linkUrl);
                      onClose();
                    }
                  }}
                  className={`p-4 transition-colors cursor-pointer space-y-1.5 ${
                    n.isRead ? 'bg-white hover:bg-slate-50 opacity-75' : 'bg-indigo-50/40 hover:bg-indigo-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      {isMatch ? (
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      ) : isMessage ? (
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span>{n.title}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
