import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 5000);

    const handleNotificationUpdate = () => loadUnreadCount();
    window.addEventListener('notificationUpdate', handleNotificationUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
    };
  }, [location.pathname]);

  const loadUnreadCount = async () => {
    try {
      let res;
      try {
        res = await api.get('/notifications/my');
      } catch {
        res = await api.get('/notifications');
      }
      if (Array.isArray(res.data)) {
        const unread = res.data.filter((n) => !n.isRead && !n.read).length;
        setUnreadCount(unread);
      }
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatRole = (role) => {
    return role?.replace(/_/g, ' ') || '';
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <h1 className="text-xl font-bold text-gray-800">Lab Equipment Portal</h1>
      <div className="flex items-center gap-4">
        <Link
          to="/notifications"
          className="relative text-gray-600 hover:text-gray-800"
          title="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-semibold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
        <Link
          to="/profile"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors py-1 px-2 rounded-lg hover:bg-gray-50"
          title="View & Edit Profile"
        >
          <span className="font-medium text-gray-800 hover:text-blue-600">{user?.name}</span>
          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
            {formatRole(user?.role)}
          </span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 cursor-pointer font-medium"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </nav>
  );
}
