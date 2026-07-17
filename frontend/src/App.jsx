import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Equipment from './pages/Equipment';
import EquipmentDetail from './pages/EquipmentDetail';
import Bookings from './pages/Bookings';
import Maintenance from './pages/Maintenance';
import Users from './pages/Users';
import Departments from './pages/Departments';
import Institutions from './pages/Institutions';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Waitlist from './pages/Waitlist';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes with Main Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="equipment" element={<Equipment />} />
        <Route path="equipment/:id" element={<EquipmentDetail />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="waitlist" element={<Waitlist />} />

        {/* Role-Restricted Pages */}
        <Route
          path="maintenance"
          element={
            <ProtectedRoute allowedRoles={['LAB_TECHNICIAN', 'LAB_MANAGER']}>
              <Maintenance />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['LAB_MANAGER', 'DEPARTMENT_HEAD', 'INSTITUTION_HEAD', 'SYSTEM_ADMIN']}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="departments"
          element={
            <ProtectedRoute allowedRoles={['INSTITUTION_HEAD', 'SYSTEM_ADMIN']}>
              <Departments />
            </ProtectedRoute>
          }
        />
        <Route
          path="institutions"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
              <Institutions />
            </ProtectedRoute>
          }
        />
        <Route
          path="analytics"
          element={
            <ProtectedRoute allowedRoles={['DEPARTMENT_HEAD', 'INSTITUTION_HEAD', 'SYSTEM_ADMIN']}>
              <Analytics />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
