import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Equipment from './pages/Equipment';
import EquipmentDetail from './pages/EquipmentDetail';
import Bookings from './pages/Bookings';
import Maintenance from './pages/Maintenance';
import Users from './pages/Users';
import Analytics from './pages/Analytics';
import Departments from './pages/Departments';
import Institutions from './pages/Institutions';
import Notifications from './pages/Notifications';
import Waitlist from './pages/Waitlist';

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes Wrapper */}
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
        
        {/* Waitlist page - accessible to STUDENT and RESEARCHER */}
        <Route
          path="waitlist"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'RESEARCHER']}>
              <Waitlist />
            </ProtectedRoute>
          }
        />

        {/* Maintenance page - accessible to LAB_TECHNICIAN and LAB_MANAGER */}
        <Route
          path="maintenance"
          element={
            <ProtectedRoute allowedRoles={['LAB_TECHNICIAN', 'LAB_MANAGER']}>
              <Maintenance />
            </ProtectedRoute>
          }
        />

        {/* Users page - accessible to LAB_MANAGER, DEPARTMENT_HEAD, INSTITUTION_HEAD, SYSTEM_ADMIN */}
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['LAB_MANAGER', 'DEPARTMENT_HEAD', 'INSTITUTION_HEAD', 'SYSTEM_ADMIN']}>
              <Users />
            </ProtectedRoute>
          }
        />

        {/* Analytics page - accessible to DEPARTMENT_HEAD, INSTITUTION_HEAD, SYSTEM_ADMIN */}
        <Route
          path="analytics"
          element={
            <ProtectedRoute allowedRoles={['DEPARTMENT_HEAD', 'INSTITUTION_HEAD', 'SYSTEM_ADMIN']}>
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* Departments page - accessible to INSTITUTION_HEAD, SYSTEM_ADMIN */}
        <Route
          path="departments"
          element={
            <ProtectedRoute allowedRoles={['INSTITUTION_HEAD', 'SYSTEM_ADMIN']}>
              <Departments />
            </ProtectedRoute>
          }
        />

        {/* Institutions page - accessible to SYSTEM_ADMIN */}
        <Route
          path="institutions"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
              <Institutions />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all Route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
