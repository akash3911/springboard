import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { CheckCircle, CheckCheck } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/notifications/my');
      setNotifications(res.data);
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <CheckCheck size={16} />
            Mark All Read
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`bg-white border rounded-lg p-4 flex items-start justify-between ${
              n.read ? 'border-gray-200' : 'border-blue-200 bg-blue-50'
            }`}
          >
            <div>
              <p className={`text-sm ${n.read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                {n.message}
              </p>
              <div className="flex gap-3 mt-1">
                {n.type && (
                  <span className="text-xs text-gray-400">{n.type}</span>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(n.createdAt || n.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
            {!n.read && (
              <button
                onClick={() => handleMarkRead(n.id)}
                className="text-blue-600 hover:text-blue-800 ml-2 shrink-0"
                title="Mark as read"
              >
                <CheckCircle size={18} />
              </button>
            )}
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-center text-gray-500 py-8">No notifications</p>
        )}
      </div>
    </div>
  );
}
