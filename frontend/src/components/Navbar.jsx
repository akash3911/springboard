import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
  }, []);

  const loadUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/my');
      const unread = res.data.filter((n) => !n.read).length;
      setUnreadCount(unread);
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
        <Link to="/notifications" className="relative text-gray-600 hover:text-gray-800">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>
        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-800">{user?.name}</span>
          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {formatRole(user?.role)}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </nav>
  );
}
