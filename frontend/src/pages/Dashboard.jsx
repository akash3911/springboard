import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  CalendarDays,
  Monitor,
  Wrench,
  Users,
  Building2,
  Landmark,
  Bell,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load notifications
      try {
        const notifRes = await api.get('/notifications/my');
        setNotifications(notifRes.data.slice(0, 5));
      } catch {
        // ignore
      }

      // Load role-specific stats
      const role = user?.role;
      const s = {};

      if (role === 'STUDENT' || role === 'RESEARCHER') {
        try {
          const bookingsRes = await api.get('/bookings/my');
          s.myBookings = bookingsRes.data.length;
        } catch {
          s.myBookings = 0;
        }
        try {
          const equipRes = await api.get('/equipment');
          s.availableEquipment = equipRes.data.filter(
            (e) => e.status === 'AVAILABLE'
          ).length;
        } catch {
          s.availableEquipment = 0;
        }
      }

      if (role === 'LAB_TECHNICIAN') {
        try {
          const maintRes = await api.get('/maintenance/my');
          s.pendingMaintenance = maintRes.data.filter(
            (m) => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS'
          ).length;
        } catch {
          s.pendingMaintenance = 0;
        }
      }

      if (role === 'LAB_MANAGER') {
        try {
          const bookingsRes = await api.get('/bookings');
          s.pendingBookings = bookingsRes.data.filter(
            (b) => b.status === 'PENDING'
          ).length;
        } catch {
          s.pendingBookings = 0;
        }
        try {
          const equipRes = await api.get('/equipment');
          s.totalEquipment = equipRes.data.length;
        } catch {
          s.totalEquipment = 0;
        }
        try {
          const maintRes = await api.get('/maintenance');
          s.maintenanceCount = maintRes.data.filter(
            (m) => m.status !== 'COMPLETED'
          ).length;
        } catch {
          s.maintenanceCount = 0;
        }
      }

      if (
        role === 'DEPARTMENT_HEAD' ||
        role === 'INSTITUTION_HEAD' ||
        role === 'SYSTEM_ADMIN'
      ) {
        try {
          const equipRes = await api.get('/equipment');
          s.totalEquipment = equipRes.data.length;
        } catch {
          s.totalEquipment = 0;
        }
        try {
          const usersRes = await api.get('/users');
          s.totalUsers = usersRes.data.length;
        } catch {
          s.totalUsers = 0;
        }
      }

      if (role === 'INSTITUTION_HEAD' || role === 'SYSTEM_ADMIN') {
        try {
          const deptRes = await api.get('/departments');
          s.totalDepartments = deptRes.data.length;
        } catch {
          s.totalDepartments = 0;
        }
      }

      if (role === 'SYSTEM_ADMIN') {
        try {
          const instRes = await api.get('/institutions');
          s.totalInstitutions = instRes.data.length;
        } catch {
          s.totalInstitutions = 0;
        }
      }

      setStats(s);
    } catch {
      // ignore
    }
  };

  const statCards = [];
  const role = user?.role;

  if (role === 'STUDENT' || role === 'RESEARCHER') {
    statCards.push(
      { label: 'My Bookings', value: stats.myBookings ?? 0, icon: CalendarDays, color: 'text-blue-600' },
      { label: 'Available Equipment', value: stats.availableEquipment ?? 0, icon: Monitor, color: 'text-green-600' }
    );
  }

  if (role === 'LAB_TECHNICIAN') {
    statCards.push({
      label: 'Pending Maintenance',
      value: stats.pendingMaintenance ?? 0,
      icon: Wrench,
      color: 'text-yellow-600',
    });
  }

  if (role === 'LAB_MANAGER') {
    statCards.push(
      { label: 'Pending Bookings', value: stats.pendingBookings ?? 0, icon: CalendarDays, color: 'text-yellow-600' },
      { label: 'Total Equipment', value: stats.totalEquipment ?? 0, icon: Monitor, color: 'text-blue-600' },
      { label: 'Active Maintenance', value: stats.maintenanceCount ?? 0, icon: Wrench, color: 'text-orange-600' }
    );
  }

  if (role === 'DEPARTMENT_HEAD') {
    statCards.push(
      { label: 'Equipment', value: stats.totalEquipment ?? 0, icon: Monitor, color: 'text-blue-600' },
      { label: 'Users', value: stats.totalUsers ?? 0, icon: Users, color: 'text-green-600' }
    );
  }

  if (role === 'INSTITUTION_HEAD') {
    statCards.push(
      { label: 'Departments', value: stats.totalDepartments ?? 0, icon: Building2, color: 'text-purple-600' },
      { label: 'Equipment', value: stats.totalEquipment ?? 0, icon: Monitor, color: 'text-blue-600' }
    );
  }

  if (role === 'SYSTEM_ADMIN') {
    statCards.push(
      { label: 'Institutions', value: stats.totalInstitutions ?? 0, icon: Landmark, color: 'text-red-600' },
      { label: 'Departments', value: stats.totalDepartments ?? 0, icon: Building2, color: 'text-purple-600' },
      { label: 'Users', value: stats.totalUsers ?? 0, icon: Users, color: 'text-green-600' },
      { label: 'Equipment', value: stats.totalEquipment ?? 0, icon: Monitor, color: 'text-blue-600' }
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Welcome, {user?.name}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <card.icon size={24} className={card.color} />
              <div>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Bell size={18} />
          Recent Notifications
        </h3>
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-500">No recent notifications</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`text-sm p-2 rounded ${
                  n.read ? 'text-gray-500' : 'text-gray-800 bg-blue-50'
                }`}
              >
                <p>{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.createdAt || n.timestamp).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
