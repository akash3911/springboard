import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  CheckCheck,
  Bell,
  Calendar,
  ClipboardList,
  Wrench,
  ShieldAlert,
  CreditCard,
  Filter,
} from 'lucide-react';

const typeBadgeStyles = {
  BOOKING: 'bg-blue-100 text-blue-800 border-blue-200',
  WAITLIST: 'bg-purple-100 text-purple-800 border-purple-200',
  MAINTENANCE: 'bg-amber-100 text-amber-800 border-amber-200',
  CALIBRATION: 'bg-red-100 text-red-800 border-red-200 font-bold',
  BILLING: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/notifications/my');
      setNotifications(res.data || []);
    } catch (err) {
      toast.error('Failed to load notifications');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      loadData();
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      toast.success('All notifications marked as read');
      loadData();
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead && !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'ALL') return true;
    return (n.type || '').toUpperCase() === filterType;
  });

  const getTypeIcon = (type) => {
    switch ((type || '').toUpperCase()) {
      case 'BOOKING':
        return <Calendar size={16} className="text-blue-600" />;
      case 'WAITLIST':
        return <ClipboardList size={16} className="text-purple-600" />;
      case 'MAINTENANCE':
        return <Wrench size={16} className="text-amber-600" />;
      case 'CALIBRATION':
        return <ShieldAlert size={16} className="text-red-600" />;
      case 'BILLING':
        return <CreditCard size={16} className="text-emerald-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-800">Alerts & System Notifications</h2>
            {unreadCount > 0 && (
              <span className="text-xs bg-red-100 text-red-700 font-bold px-2.5 py-0.5 rounded-full border border-red-200">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time alerts for booking status, waitlist openings, calibration reminders, and billing invoices.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-all cursor-pointer border border-blue-200"
          >
            <CheckCheck size={16} />
            Mark All Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-white p-2 rounded-xl border border-gray-200">
        <span className="text-xs font-semibold text-gray-500 px-2 flex items-center gap-1">
          <Filter size={12} /> Filter:
        </span>
        {['ALL', 'BOOKING', 'WAITLIST', 'CALIBRATION', 'MAINTENANCE', 'BILLING'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              filterType === type
                ? 'bg-gray-800 text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((n) => {
          const isRead = n.isRead || n.read;
          const type = (n.type || 'GENERAL').toUpperCase();

          return (
            <div
              key={n.id}
              className={`bg-white border rounded-xl p-4 flex items-start justify-between gap-4 transition-all shadow-2xs ${
                isRead ? 'border-gray-200 opacity-80' : 'border-blue-300 bg-blue-50/40 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 shrink-0 mt-0.5">
                  {getTypeIcon(type)}
                </div>
                <div>
                  <p className={`text-xs ${isRead ? 'text-gray-700' : 'text-gray-900 font-bold'}`}>
                    {n.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeBadgeStyles[type] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {type}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(n.createdAt || n.timestamp || Date.now()).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
              </div>

              {!isRead && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-100 transition-colors shrink-0 cursor-pointer"
                  title="Mark as read"
                >
                  <CheckCircle size={18} />
                </button>
              )}
            </div>
          );
        })}

        {filteredNotifications.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-xs">
            <Bell size={24} className="mx-auto mb-2 opacity-50" />
            No notifications matching the selected filter category
          </div>
        )}
      </div>
    </div>
  );
}
