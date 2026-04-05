import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, FlaskConical, FileText,
  RefreshCw, Loader2, ChevronRight, Info
} from 'lucide-react';
import { notificationService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import type { Notification } from '../../types';
import toast from 'react-hot-toast';

const TYPE_META: Record<string, {
  icon: any;
  iconBg: string;
  label: string;
}> = {
  RESULT_READY:         { icon: FlaskConical, iconBg: 'bg-green-50 text-green-600',  label: 'Lab Result' },
  PRESCRIPTION_CREATED: { icon: FileText,     iconBg: 'bg-purple-50 text-purple-600', label: 'Prescription' },
  STATUS_UPDATED:       { icon: RefreshCw,    iconBg: 'bg-blue-50 text-blue-600',    label: 'Status Update' },
  SYSTEM:               { icon: Info,         iconBg: 'bg-slate-100 text-slate-500', label: 'System' },
};

/** Parse the JSON `data` field safely */
function parseData(raw?: string): Record<string, any> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

/** Resolve the correct app URL for this notification */
function resolveUrl(type: string, data: Record<string, any>): string | null {
  if (type === 'RESULT_READY' && data.resultId)
    return `/results/${data.resultId}`;
  if (type === 'PRESCRIPTION_CREATED' && data.prescriptionId)
    return `/prescriptions/${data.prescriptionId}`;
  if (type === 'STATUS_UPDATED' && data.prescriptionId)
    return `/prescriptions/${data.prescriptionId}`;
  return null;
}

export default function NotificationsPage() {
  const { refreshUnread } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    notificationService.getAll()
      .then(({ notifications: n, unreadCount: u }) => {
        setNotifications(n);
        setUnreadCount(u);
      })
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleClick = async (notif: Notification) => {
    // Mark as read
    if (!notif.isRead) {
      await notificationService.markRead(notif.id).catch(() => {});
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
      refreshUnread();
    }

    // Navigate to the related item
    const data = parseData(notif.data);
    const url = resolveUrl(notif.type, data);
    if (url) navigate(url);
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    refreshUnread();
    toast.success('All notifications marked as read');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-sm mt-0.5">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn-secondary text-sm gap-1.5">
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No notifications yet.</p>
          <p className="text-slate-400 text-sm mt-1">You'll be notified when results are ready or prescriptions are updated.</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-50">
          {notifications.map(notif => {
            const meta = TYPE_META[notif.type] || TYPE_META.SYSTEM;
            const Icon = meta.icon;
            const data = parseData(notif.data);
            const url = resolveUrl(notif.type, data);
            const isClickable = !!url;

            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`
                  flex items-start gap-4 px-5 py-4 transition-colors
                  ${!notif.isRead ? 'bg-brand-50/50' : ''}
                  ${isClickable ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'}
                `}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.iconBg}`}>
                  <Icon size={17} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Type badge + unread dot */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {meta.label}
                    </span>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                    )}
                  </div>

                  {/* Title */}
                  <p className={`text-sm font-semibold leading-snug ${!notif.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                    {notif.title}
                  </p>

                  {/* Body — the human-readable sentence from backend */}
                  <p className="text-sm text-slate-500 mt-0.5 leading-snug">{notif.body}</p>

                  {/* Extra context pills from data */}
                  <NotifDataPills type={notif.type} data={data} />

                  {/* Timestamp */}
                  <p className="text-xs text-slate-400 mt-1.5">{timeAgo(notif.createdAt)}</p>
                </div>

                {/* Navigate arrow */}
                {isClickable && (
                  <ChevronRight size={16} className="text-slate-300 flex-shrink-0 mt-1" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Small pills showing extra context extracted from notification data */
function NotifDataPills({ type, data }: { type: string; data: Record<string, any> }) {
  const pills: string[] = [];

  if (type === 'RESULT_READY') {
    if (data.testType)  pills.push(data.testType);
    if (data.resultNo)  pills.push(data.resultNo);
  }
  if (type === 'PRESCRIPTION_CREATED') {
    if (data.testList)  pills.push(data.testList);
    if (data.prescNo)   pills.push(data.prescNo);
  }
  if (type === 'STATUS_UPDATED') {
    if (data.status)    pills.push(data.status.replace('_', ' '));
    if (data.prescNo)   pills.push(data.prescNo);
  }

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {pills.map((p, i) => (
        <span key={i} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
          {p}
        </span>
      ))}
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}
