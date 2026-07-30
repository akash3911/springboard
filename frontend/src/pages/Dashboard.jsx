import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  Monitor,
  Wrench,
  Users,
  Building2,
  Landmark,
  Bell,
  Activity,
  Zap,
  ArrowRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  CreditCard,
  Plus,
  XCircle,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle,
  X,
  AlertTriangle,
} from 'lucide-react';

const statusColors = {
  PENDING: 'bg-amber-100 text-amber-800 border border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  REJECTED: 'bg-red-100 text-red-800 border border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-600 border border-gray-200',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Role-based state datasets
  const [myBookings, setMyBookings] = useState([]);
  const [myWaitlists, setMyWaitlists] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [myWorkOrders, setMyWorkOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [crossInstBookings, setCrossInstBookings] = useState([]);
  const [stats, setStats] = useState({});

  // Quick Modal States for Manager/Tech
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [completeMaintId, setCompleteMaintId] = useState(null);
  const [completeNotes, setCompleteNotes] = useState('');

  const role = user?.role || 'STUDENT';
  const isStudent = role === 'STUDENT' || role === 'RESEARCHER';
  const isTechnician = role === 'LAB_TECHNICIAN';
  const isManager = role === 'LAB_MANAGER';
  const isExecutive = role === 'DEPARTMENT_HEAD' || role === 'INSTITUTION_HEAD' || role === 'SYSTEM_ADMIN';

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Notifications safely
      try {
        let notifRes;
        try {
          notifRes = await api.get('/notifications/my');
        } catch {
          notifRes = await api.get('/notifications');
        }
        setNotifications(Array.isArray(notifRes?.data) ? notifRes.data.slice(0, 6) : []);
      } catch {
        setNotifications([]);
      }

      // 2. Fetch Equipment List
      const eqRes = await api.get('/equipment').catch(() => ({ data: [] }));
      const allEquipment = Array.isArray(eqRes.data) ? eqRes.data : [];
      setEquipmentList(allEquipment);

      // 3. Role Specific Data Fetching
      if (isStudent) {
        const [bookRes, waitRes] = await Promise.all([
          api.get('/bookings/my').catch(() => ({ data: [] })),
          api.get('/waitlist').catch(() => ({ data: [] })),
        ]);
        const userBookings = Array.isArray(bookRes.data) ? bookRes.data : [];
        setMyBookings(userBookings);

        const userWaitlists = (Array.isArray(waitRes.data) ? waitRes.data : []).filter(
          (w) => w.user?.id === user?.id || w.user?.email === user?.email
        );
        setMyWaitlists(userWaitlists);
      }

      if (isTechnician) {
        const maintRes = await api.get('/maintenance/my').catch(() => ({ data: [] }));
        setMyWorkOrders(Array.isArray(maintRes.data) ? maintRes.data : []);
      }

      if (isManager || isExecutive) {
        const [allBookRes, maintRes, waitRes, userRes, deptRes, instRes] = await Promise.all([
          api.get('/bookings').catch(() => ({ data: [] })),
          api.get('/maintenance').catch(() => ({ data: [] })),
          api.get('/waitlist').catch(() => ({ data: [] })),
          api.get('/users').catch(() => ({ data: [] })),
          api.get('/departments').catch(() => ({ data: [] })),
          api.get('/institutions').catch(() => ({ data: [] })),
        ]);

        let allBookings = Array.isArray(allBookRes.data) ? allBookRes.data : [];
        const maintenances = Array.isArray(maintRes.data) ? maintRes.data : [];
        const users = Array.isArray(userRes.data) ? userRes.data : [];
        const depts = Array.isArray(deptRes.data) ? deptRes.data : [];
        const insts = Array.isArray(instRes.data) ? instRes.data : [];

        if (isManager && user?.department?.id) {
          allBookings = allBookings.filter((b) => b.equipment?.department?.id === user.department.id);
        }

        setPendingBookings(allBookings.filter((b) => b.status === 'PENDING'));
        setCrossInstBookings(allBookings.filter((b) => b.isCrossInstitution || b.user?.institution?.id !== b.equipment?.department?.institution?.id));

        // Stats Computation
        setStats({
          totalEquipment: allEquipment.length,
          availableEquipment: allEquipment.filter((e) => e.status === 'AVAILABLE').length,
          pendingApprovals: allBookings.filter((b) => b.status === 'PENDING').length,
          approvedBookings: allBookings.filter((b) => b.status === 'APPROVED').length,
          activeMaintenance: maintenances.filter((m) => m.status === 'PENDING' || m.status === 'IN_PROGRESS').length,
          totalUsers: users.length,
          totalDepartments: depts.length,
          totalInstitutions: insts.length,
          expiredCalibrations: allEquipment.filter((e) => e.calibrationStatus === 'EXPIRED').length,
          dueSoonCalibrations: allEquipment.filter((e) => e.calibrationStatus === 'DUE_SOON').length,
          totalRevenue: allBookings.filter((b) => b.status === 'APPROVED').reduce((acc, curr) => acc + (curr.totalCost || 0), 0),
        });
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Quick Actions Handlers for Manager/Technician on Dashboard
  const handleApproveBooking = async (id) => {
    try {
      await api.put(`/bookings/${id}/approve`);
      toast.success('Booking approved directly from dashboard!');
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleRejectBooking = async (id) => {
    try {
      await api.put(`/bookings/${id}/reject`, { rejectionReason: rejectReason || 'Declined by manager' });
      toast.success('Booking rejected');
      setRejectId(null);
      setRejectReason('');
      loadDashboardData();
    } catch (err) {
      toast.error('Failed to reject');
    }
  };

  const handleCompleteWorkOrder = async (id) => {
    try {
      await api.put(`/maintenance/${id}/complete`, { repairNotes: completeNotes });
      toast.success('Work order completed and asset restored to available status!');
      setCompleteMaintId(null);
      setCompleteNotes('');
      loadDashboardData();
    } catch (err) {
      toast.error('Failed to complete work order');
    }
  };

  // Calibration alert counts
  const expiredCalibrations = equipmentList.filter((e) => e.calibrationStatus === 'EXPIRED');
  const dueSoonCalibrations = equipmentList.filter((e) => e.calibrationStatus === 'DUE_SOON');

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER - Customized Per Role */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-800 text-white p-6 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-0.5 rounded-full backdrop-blur-xs uppercase tracking-wider">
                {role.replace('_', ' ')}
              </span>
              {user?.department?.name && (
                <span className="bg-white/10 text-white/90 text-xs px-2.5 py-0.5 rounded-full border border-white/20">
                  {user.department.name}
                </span>
              )}
              {user?.institution?.name && (
                <span className="bg-white/10 text-white/90 text-xs px-2.5 py-0.5 rounded-full border border-white/20">
                  {user.institution.name}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
              Welcome back, {user?.name || 'User'} 👋
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl leading-relaxed">
              {isStudent && 'Explore research instruments, manage your equipment reservations, and track waitlist queues.'}
              {isTechnician && 'Review assigned maintenance work orders, update repair logs, and manage instrument recalibrations.'}
              {isManager && 'Manage lab equipment reservations, review manager approval queues, and monitor department capacity.'}
              {isExecutive && 'Executive overview of institutional research equipment utilization, inter-college billing, and compliance.'}
            </p>
          </div>

          {/* Quick Hero Shortcuts */}
          <div className="flex gap-2 flex-wrap">
            {isStudent && (
              <>
                <Link
                  to="/equipment"
                  className="bg-white text-blue-800 hover:bg-blue-50 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Monitor size={15} /> Book Equipment
                </Link>
                <Link
                  to="/bookings"
                  className="bg-blue-600/60 hover:bg-blue-600 border border-white/30 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CalendarDays size={15} /> My Reservations
                </Link>
              </>
            )}

            {isTechnician && (
              <>
                <Link
                  to="/maintenance"
                  className="bg-white text-blue-800 hover:bg-blue-50 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Wrench size={15} /> Work Orders
                </Link>
              </>
            )}

            {isManager && (
              <>
                <Link
                  to="/bookings"
                  className="bg-white text-blue-800 hover:bg-blue-50 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <CalendarDays size={15} /> Approval Queue ({pendingBookings.length})
                </Link>
                <Link
                  to="/analytics"
                  className="bg-blue-600/60 hover:bg-blue-600 border border-white/30 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Activity size={15} /> Lab Intelligence
                </Link>
              </>
            )}

            {isExecutive && (
              <>
                <Link
                  to="/analytics"
                  className="bg-white text-blue-800 hover:bg-blue-50 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Activity size={15} /> Executive Analytics
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. URGENT CALIBRATION ALERT BANNER (If any expired or due soon) */}
      {(expiredCalibrations.length > 0 || dueSoonCalibrations.length > 0) && (isTechnician || isManager || isExecutive) && (
        <div className="bg-gradient-to-r from-amber-50 to-red-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-red-600 shrink-0" size={22} />
            <div>
              <h4 className="font-bold text-red-950 text-sm">Calibration Compliance Alert</h4>
              <p className="text-xs text-red-800 mt-0.5">
                <span className="font-bold">{expiredCalibrations.length}</span> instruments have EXPIRED calibrations and{' '}
                <span className="font-bold">{dueSoonCalibrations.length}</span> instruments are DUE SOON within 30 days.
              </p>
            </div>
          </div>
          <Link
            to="/maintenance"
            className="bg-red-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 cursor-pointer shadow-2xs whitespace-nowrap"
          >
            Manage Calibrations
          </Link>
        </div>
      )}

      {/* 3. METRIC KPI CARDS - Role Tailored */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isStudent && (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <CalendarDays size={22} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">{myBookings.length}</p>
                <p className="text-xs text-gray-500 font-medium">My Reservations</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Monitor size={22} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">
                  {equipmentList.filter((e) => e.status === 'AVAILABLE').length}
                </p>
                <p className="text-xs text-gray-500 font-medium">Available Assets Now</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">{myWaitlists.length}</p>
                <p className="text-xs text-gray-500 font-medium">Active Waitlist Slots</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <DollarSign size={22} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">
                  ₹{myBookings
                    .filter((b) => b.status === 'APPROVED')
                    .reduce((acc, curr) => acc + (curr.totalCost || 0), 0)
                    .toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 font-medium">Total Usage Cost</p>
              </div>
            </div>
          </>
        )}

        {isTechnician && (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Wrench size={22} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">
                  {myWorkOrders.filter((m) => m.status === 'PENDING' || m.status === 'IN_PROGRESS').length}
                </p>
                <p className="text-xs text-gray-500 font-medium">Work Orders Assigned to Me</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">
                  {myWorkOrders.filter((m) => m.status === 'COMPLETED').length}
                </p>
                <p className="text-xs text-gray-500 font-medium">Completed Work Orders</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <ShieldAlert size={22} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">{expiredCalibrations.length}</p>
                <p className="text-xs text-gray-500 font-medium">Expired Instrument Calibrations</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Monitor size={22} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">{equipmentList.length}</p>
                <p className="text-xs text-gray-500 font-medium">Total Lab Instruments</p>
              </div>
            </div>
          </>
        )}

        {(isManager || isExecutive) && (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <CalendarDays size={22} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">{stats.pendingApprovals ?? 0}</p>
                <p className="text-xs text-gray-500 font-medium">Pending Manager Approvals</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Monitor size={22} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">{stats.totalEquipment ?? 0}</p>
                <p className="text-xs text-gray-500 font-medium">Equipment Assets Managed</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Building2 size={22} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">{crossInstBookings.length}</p>
                <p className="text-xs text-gray-500 font-medium">Inter-Institution Bookings</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign size={22} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">₹{(stats.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500 font-medium">Gross Booking Value</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 4. MAIN WORKSPACE CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Role Specific Core Action Tables */}
        <div className="lg:col-span-2 space-y-6">
          {/* FOR STUDENT / RESEARCHER: My Reservations Table */}
          {isStudent && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-base">My Recent Equipment Reservations</h3>
                  <p className="text-xs text-gray-500">Track reservation status, dates, and locations</p>
                </div>
                <Link to="/bookings" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  View All <ArrowRight size={13} />
                </Link>
              </div>

              {myBookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
                        <th className="px-3 py-2">Equipment</th>
                        <th className="px-3 py-2">Start Time</th>
                        <th className="px-3 py-2">End Time</th>
                        <th className="px-3 py-2">Cost (₹)</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {myBookings.slice(0, 5).map((b) => (
                        <tr key={b.id}>
                          <td className="px-3 py-2.5 font-bold text-gray-800">{b.equipment?.name || 'Equipment'}</td>
                          <td className="px-3 py-2.5 text-gray-600">
                            {b.startTime ? new Date(b.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                          </td>
                          <td className="px-3 py-2.5 text-gray-600">
                            {b.endTime ? new Date(b.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                          </td>
                          <td className="px-3 py-2.5 text-xs">
                            {b.status === 'APPROVED' && (
                              <span className="font-semibold text-gray-800">₹{(b.totalCost || 450.0).toFixed(2)}</span>
                            )}
                            {b.status === 'PENDING' && (
                              <span className="font-semibold text-amber-700" title="Estimated cost (Pending approval)">
                                ₹{(b.totalCost || 450.0).toFixed(2)}*
                              </span>
                            )}
                            {(b.status === 'CANCELLED' || b.status === 'REJECTED') && (
                              <span className="line-through text-gray-400 font-normal">
                                ₹{(b.totalCost || 450.0).toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[b.status] || 'bg-gray-100 text-gray-600'}`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  You have no active equipment reservations yet.{' '}
                  <Link to="/equipment" className="text-blue-600 font-bold hover:underline">
                    Book an instrument now
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* FOR TECHNICIAN: My Assigned Work Orders with Instant Completion */}
          {isTechnician && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-base">My Assigned Work Orders</h3>
                  <p className="text-xs text-gray-500">Perform repairs, maintenance servicing, and calibrations</p>
                </div>
                <Link to="/maintenance" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  View All Work Orders <ArrowRight size={13} />
                </Link>
              </div>

              {myWorkOrders.filter((m) => m.status === 'PENDING').length > 0 ? (
                <div className="space-y-3">
                  {myWorkOrders
                    .filter((m) => m.status === 'PENDING')
                    .map((m) => (
                      <div key={m.id} className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-900">{m.workOrderNumber || `WO-${m.id}`}</span>
                            <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">
                              {m.maintenanceType || 'REPAIR'}
                            </span>
                          </div>
                          <p className="font-bold text-gray-800 mt-1">{m.equipment?.name}</p>
                          <p className="text-[11px] text-gray-500">{m.description || 'Routine service'}</p>
                        </div>
                        <button
                          onClick={() => setCompleteMaintId(m.id)}
                          className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-2xs shrink-0 flex items-center gap-1"
                        >
                          <CheckCircle size={13} /> Complete
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">No pending work orders assigned to you</div>
              )}
            </div>
          )}

          {/* FOR MANAGER / EXECUTIVE: Pending Approval Requests Queue */}
          {(isManager || isExecutive) && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-base">Pending Manager Approval Queue</h3>
                  <p className="text-xs text-gray-500">Review and approve reservation requests directly from dashboard</p>
                </div>
                <Link to="/bookings" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  Full Queue <ArrowRight size={13} />
                </Link>
              </div>

              {pendingBookings.length > 0 ? (
                <div className="space-y-3">
                  {pendingBookings.slice(0, 4).map((b) => (
                    <div key={b.id} className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between gap-4 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{b.equipment?.name}</span>
                          {b.isCrossInstitution && (
                            <span className="bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                              Cross-Inst
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          Requested by: <span className="font-semibold text-gray-800">{b.user?.name}</span> ({b.user?.email})
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Window: {new Date(b.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleApproveBooking(b.id)}
                          className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-2xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectId(b.id)}
                          className="bg-red-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 cursor-pointer shadow-2xs"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">No pending reservation requests awaiting approval</div>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Col: Role-tailored Notifications & Action Shortcuts */}
        <div className="space-y-6">


          {/* Alert Feed Widget */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-blue-600" />
                <h3 className="font-bold text-gray-800 text-sm">Personal Alert Feed</h3>
              </div>
              <Link to="/notifications" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                View All
              </Link>
            </div>

            {notifications.length > 0 ? (
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-lg border text-xs transition-all ${
                      n.isRead || n.read ? 'bg-gray-50 border-gray-100 opacity-75' : 'bg-blue-50/40 border-blue-200 font-medium'
                    }`}
                  >
                    <p className="text-gray-800 text-xs leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(n.createdAt || n.timestamp || Date.now()).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-8">No recent alerts</p>
            )}
          </div>
        </div>
      </div>

      {/* REJECT REASON MODAL */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50 font-bold text-gray-800 text-sm">Reject Reservation</div>
            <div className="p-6 space-y-4 text-xs">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setRejectId(null)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRejectBooking(rejectId)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-red-700 cursor-pointer shadow-sm"
                >
                  Reject Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE WORK ORDER MODAL */}
      {completeMaintId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50 font-bold text-gray-800 text-sm">Complete Work Order</div>
            <div className="p-6 space-y-4 text-xs">
              <textarea
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                placeholder="Enter repair resolution notes..."
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setCompleteMaintId(null)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCompleteWorkOrder(completeMaintId)}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700 cursor-pointer shadow-sm"
                >
                  Complete Work Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
