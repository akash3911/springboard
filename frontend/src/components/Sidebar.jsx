import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Monitor,
  CalendarDays,
  Bell,
  Wrench,
  Users,
  Building2,
  Landmark,
  BarChart3,
  ClipboardList,
  Award,
  User,
} from 'lucide-react';

const allLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: 'ALL' },
  { to: '/profile', label: 'My Profile', icon: User, roles: 'ALL' },
  { to: '/equipment', label: 'Equipment', icon: Monitor, roles: 'ALL' },
  {
    to: '/bookings',
    label: 'Bookings',
    icon: CalendarDays,
    roles: ['STUDENT', 'RESEARCHER', 'LAB_MANAGER', 'SYSTEM_ADMIN'],
  },
  {
    to: '/waitlist',
    label: 'Waitlist',
    icon: ClipboardList,
    roles: ['STUDENT', 'RESEARCHER'],
  },
  {
    to: '/maintenance',
    label: 'Maintenance',
    icon: Wrench,
    roles: ['LAB_TECHNICIAN', 'LAB_MANAGER', 'SYSTEM_ADMIN'],
  },
  {
    to: '/calibrations',
    label: 'Calibrations & Certs',
    icon: Award,
    roles: ['LAB_TECHNICIAN', 'LAB_MANAGER', 'DEPARTMENT_HEAD', 'INSTITUTION_HEAD', 'SYSTEM_ADMIN'],
  },
  {
    to: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    roles: ['LAB_MANAGER', 'DEPARTMENT_HEAD', 'INSTITUTION_HEAD', 'SYSTEM_ADMIN'],
  },
  {
    to: '/users',
    label: 'Users',
    icon: Users,
    roles: ['INSTITUTION_HEAD', 'SYSTEM_ADMIN'],
  },
  {
    to: '/departments',
    label: 'Departments',
    icon: Building2,
    roles: ['INSTITUTION_HEAD', 'SYSTEM_ADMIN'],
  },
  {
    to: '/institutions',
    label: 'Institutions',
    icon: Landmark,
    roles: ['SYSTEM_ADMIN'],
  },
  { to: '/notifications', label: 'Notifications', icon: Bell, roles: 'ALL' },
];

export default function Sidebar() {
  const { user } = useAuth();

  const visibleLinks = allLinks.filter((link) => {
    if (link.roles === 'ALL') return true;
    return link.roles.includes(user?.role);
  });

  return (
    <aside className="w-56 bg-white border-r border-gray-200 min-h-screen p-4">
      <nav className="flex flex-col gap-1">
        {visibleLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded text-sm ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            <link.icon size={18} />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
