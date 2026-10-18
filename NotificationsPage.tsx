import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Sparkles,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { AppNotification, ItemReport } from '../types';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../services/notificationService';

interface NotificationsPageProps {
  notifications: AppNotification[];
  items: ItemReport[];
  onViewItem?: (item: ItemReport) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications,
  items,
  onViewItem,
}) => {
  const [filterUnread, setFilterUnread] = useState(false);

  const displayed = filterUnread
    ? notifications.filter((n) => !n.read)
    : notifications;

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead(notifications);
    } catch (e) {
      console.error('Error marking all as read:', e);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
    } catch (e) {
      console.error('Error marking as read:', e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
    } catch (e) {
      console.error('Error deleting notification:', e);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'claim_approved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'claim_created':
        return <FileCheck2 className="w-5 h-5 text-purple-600" />;
      case 'match':
        return <Sparkles className="w-5 h-5 text-blue-600" />;
      case 'claim_rejected':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Notifications ({notifications.filter((n) => !n.read).length} Unread)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time updates regarding item claims, verifications, and potential matches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterUnread(!filterUnread)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterUnread
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {filterUnread ? 'Showing Unread' : 'Filter Unread'}
          </button>

          {notifications.some((n) => !n.read) && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
          <Bell className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-base font-bold text-slate-800">
            No notifications
          </div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You're all caught up! When activity happens on your reports or claims, notifications will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayed.map((notif) => {
            const relatedItem = notif.itemId ? items.find((i) => i.id === notif.itemId) : null;
            return (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  notif.read
                    ? 'bg-white border-slate-200/80 text-slate-600'
                    : 'bg-blue-50/40 border-blue-200/80 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">{getNotifIcon(notif.type)}</div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                      <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                      {relatedItem && onViewItem && (
                        <button
                          onClick={() => onViewItem(relatedItem)}
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          View Item: {relatedItem.itemName}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkSingleRead(notif.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-teal-600 transition-colors"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
