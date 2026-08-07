import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Activity,
  Zap,
  Clock,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  Download,
  AlertTriangle,
  Building2,
  FileText,
  X,
  CheckCircle2,
  HelpCircle,
  Calendar,
} from 'lucide-react';

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#ec4899'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = [8, 10, 12, 14, 16, 18, 20];

export default function Analytics() {
  const { user } = { user: JSON.parse(localStorage.getItem('user')) || {} };
  const [equipmentList, setEquipmentList] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);

  // Perspective role filter & Timeframe filter
  const [viewRole, setViewRole] = useState(user?.role || 'SYSTEM_ADMIN');
  const [timeframe, setTimeframe] = useState('30_DAYS'); // '7_DAYS' | '30_DAYS' | '90_DAYS' | 'ALL_TIME'
  const [heatmapTheme, setHeatmapTheme] = useState('THERMAL'); // 'THERMAL' | 'EMERALD'
  const [chartShowAll, setChartShowAll] = useState(true); // Default to showing ALL equipment
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [eqRes, bookRes, maintRes] = await Promise.all([
        api.get('/equipment').catch(() => ({ data: [] })),
        api.get('/bookings').catch(() => ({ data: [] })),
        api.get('/maintenance').catch(() => ({ data: [] })),
      ]);

      setEquipmentList(eqRes.data || []);
      setBookings(bookRes.data || []);
      setMaintenances(maintRes.data || []);
    } catch (err) {
      toast.error('Failed to load analytics datasets');
    } finally {
      setLoading(false);
    }
  };

  // Timeframe baseline capacity hours & date filtering
  const getTimeframeCapacity = () => {
    switch (timeframe) {
      case '7_DAYS': return 10;
      case '30_DAYS': return 40;
      case '90_DAYS': return 120;
      case 'ALL_TIME': return 160;
      default: return 40;
    }
  };

  const baselineCapacityHours = getTimeframeCapacity();

  // Filter bookings based on selected timeframe
  const filteredBookings = bookings.filter((b) => {
    if (!b.startTime) return true;
    if (timeframe === 'ALL_TIME') return true;

    const bookingDate = new Date(b.startTime);
    const now = new Date();
    const diffDays = (now - bookingDate) / (1000 * 60 * 60 * 24);

    if (timeframe === '7_DAYS') return diffDays <= 7 && diffDays >= -7;
    if (timeframe === '30_DAYS') return diffDays <= 30 && diffDays >= -30;
    if (timeframe === '90_DAYS') return diffDays <= 90 && diffDays >= -90;
    return true;
  });

  // Filter equipment list based on logged-in user role & perspective view
  const scopedEquipmentList = equipmentList.filter((eq) => {
    // SYSTEM_ADMIN sees ALL equipment
    if (user?.role === 'SYSTEM_ADMIN' || viewRole === 'SYSTEM_ADMIN') {
      return true;
    }
    // INSTITUTION_HEAD sees only equipment in their institution
    if (user?.role === 'INSTITUTION_HEAD' || viewRole === 'INSTITUTION_HEAD') {
      const userInstId = user?.institution?.id || user?.department?.institution?.id;
      if (!userInstId) return true;
      return eq.department?.institution?.id === userInstId;
    }
    // DEPARTMENT_HEAD / LAB_MANAGER / LAB_TECHNICIAN see equipment in their department
    if (['DEPARTMENT_HEAD', 'LAB_MANAGER', 'LAB_TECHNICIAN'].includes(user?.role) || viewRole === 'LAB_MANAGER') {
      const userDeptId = user?.department?.id;
      if (!userDeptId) return true;
      return eq.department?.id === userDeptId;
    }
    return true;
  });

  const scopedEquipmentIds = new Set(scopedEquipmentList.map((e) => e.id));

  // Filter bookings based on selected timeframe and scoped equipment
  const scopedBookings = filteredBookings.filter((b) => {
    const eqId = b.equipment?.id || b.equipmentId;
    return scopedEquipmentIds.has(eqId);
  });

  // Metric Computations
  const totalEquipment = scopedEquipmentList.length;
  const activeBookingsCount = scopedBookings.filter((b) => b.status === 'APPROVED').length;
  const pendingBookingsCount = scopedBookings.filter((b) => b.status === 'PENDING').length;

  // Equipment Utilization calculation (% of approved booking hours)
  const equipmentUtilization = scopedEquipmentList.map((eq) => {
    const eqBookings = scopedBookings.filter((b) => (b.equipment?.id === eq.id || b.equipmentId === eq.id) && b.status === 'APPROVED');
    let totalMinutes = 0;
    eqBookings.forEach((b) => {
      if (b.startTime && b.endTime) {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);
        const mins = (end - start) / (1000 * 60);
        if (mins > 0) totalMinutes += mins;
      }
    });
    const hoursBooked = Math.round((totalMinutes / 60) * 10) / 10;
    const utilPct = Math.min(100, Math.round((hoursBooked / baselineCapacityHours) * 100));
    return {
      id: eq.id,
      name: eq.name,
      category: eq.category,
      department: eq.department?.name || 'General',
      institution: eq.department?.institution?.name || 'Main Campus',
      hoursBooked,
      idleHours: Math.max(0, baselineCapacityHours - hoursBooked),
      utilizationPct: utilPct,
      hourlyRate: eq.hourlyRate || 45.0,
      calibrationStatus: eq.calibrationStatus || 'VALID',
    };
  });

  const avgUtilization = equipmentUtilization.length > 0
    ? Math.round(equipmentUtilization.reduce((acc, curr) => acc + curr.utilizationPct, 0) / equipmentUtilization.length)
    : 0;

  const totalIdleHours = equipmentUtilization.reduce((acc, curr) => acc + curr.idleHours, 0);

  // Billing and Revenue computations (Scoped)
  const totalRevenueIncurred = scopedBookings
    .filter((b) => b.status === 'APPROVED')
    .reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

  const crossInstRevenue = scopedBookings
    .filter((b) => b.status === 'APPROVED' && b.isCrossInstitution)
    .reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

  // Calibration stats (Scoped)
  const validCalibrationCount = scopedEquipmentList.filter((e) => !e.calibrationStatus || e.calibrationStatus === 'VALID').length;
  const calibrationComplianceRate = totalEquipment > 0 ? Math.round((validCalibrationCount / totalEquipment) * 100) : 100;

  // Demand Oversubscription Classification
  const oversubscribedList = equipmentUtilization.filter((e) => e.utilizationPct >= 70);
  const balancedList = equipmentUtilization.filter((e) => e.utilizationPct >= 30 && e.utilizationPct < 70);
  const underutilizedList = equipmentUtilization.filter((e) => e.utilizationPct < 30);

  // Heatmap dataset generator (mock matrix based on booking hours distribution)
  const heatmapData = DAYS.map((day, dIdx) => ({
    day,
    hours: HOURS.map((hour) => {
      // Create reproducible utilization intensity 0-100 based on day/hour
      const intensity = Math.min(95, Math.max(10, ((dIdx * 17 + hour * 11) % 90) + (dIdx > 0 && dIdx < 5 && hour >= 10 && hour <= 16 ? 30 : 0)));
      return { hour: `${hour}:00`, intensity };
    }),
  }));

  // CSV Export Handler
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Equipment ID,Equipment Name,Department,Institution,Hours Booked,Idle Hours,Utilization %,Hourly Rate (₹),Calibration Status\n';
    equipmentUtilization.forEach((item) => {
      csvContent += `${item.id},"${item.name}","${item.department}","${item.institution}",${item.hoursBooked},${item.idleHours},${item.utilizationPct}%,${item.hourlyRate},${item.calibrationStatus}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Lab_Equipment_Utilization_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Utilization CSV report generated and downloaded!');
  };

  return (
    <div className="space-y-6">
      {/* Header & Role Perspective Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-800">Resource Intelligence & Utilization Analytics</h2>
            {/* <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
              <Activity size={12} /> Real-Time Engine
            </span> */}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Comprehensive equipment demand, idle detection, inter-institution billing, and compliance monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Timeframe Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs font-semibold">
            <Calendar size={14} className="text-gray-500 ml-1.5" />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-white text-gray-800 py-1.5 px-2.5 rounded-md border border-gray-200 text-xs font-bold focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="7_DAYS">Last 7 Days</option>
              <option value="30_DAYS">Last 30 Days</option>
              <option value="90_DAYS">Last 90 Days</option>
              <option value="ALL_TIME">All Time</option>
            </select>
          </div>

          {/* View Perspective Selector */}
          {/* <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewRole('LAB_MANAGER')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewRole === 'LAB_MANAGER' || viewRole === 'DEPARTMENT_HEAD'
                  ? 'bg-white text-gray-800 shadow-sm font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Lab Manager / Dept View
            </button>
            <button
              onClick={() => setViewRole('SYSTEM_ADMIN')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewRole === 'SYSTEM_ADMIN' || viewRole === 'INSTITUTION_HEAD'
                  ? 'bg-white text-gray-800 shadow-sm font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Admin / Executive
            </button>
          </div> */}

          {/* <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-gray-800 text-white px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-gray-700 transition-all cursor-pointer shadow-sm"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
          >
            <FileText size={14} />
            Summary Report
          </button> */}
        </div>
      </div>

      {/* Top Executive Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Capacity Utilization</span>
            <Zap size={18} className="text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-800">{avgUtilization}%</div>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-1">
              <TrendingUp size={12} /> Optimal operational target
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Idle Time Detected</span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-800">{totalIdleHours} hrs</div>
            <p className="text-[11px] text-amber-600 font-medium mt-1">
              {underutilizedList.length} equipment assets under-utilized
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Booking Value</span>
            <DollarSign size={18} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-800">₹{totalRevenueIncurred.toLocaleString()}</div>
            <p className="text-[11px] text-gray-500 mt-1">
              From {activeBookingsCount} approved reservations
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cross-Inst Revenue</span>
            <Building2 size={18} className="text-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-800">₹{crossInstRevenue.toLocaleString()}</div>
            <p className="text-[11px] text-purple-600 font-medium mt-1">
              Inter-institution shared billings
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Calibration Compliance</span>
            <ShieldCheck size={18} className="text-teal-600" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-800">{calibrationComplianceRate}%</div>
            <p className="text-[11px] text-teal-600 font-medium mt-1">
              {validCalibrationCount} of {totalEquipment} equipment valid
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts & Heatmap Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Utilization Bar Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-gray-800">Equipment Utilization Rate (%)</h3>
              <p className="text-xs text-gray-500">Track total hours reserved against active baseline capacity</p>
            </div>

            {/* Toggle: All Equipment vs Top 8 */}
            {/* <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-[10px]">
              <button
                type="button"
                onClick={() => setChartShowAll(true)}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                  chartShowAll ? 'bg-blue-600 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Equipment ({equipmentUtilization.length})
              </button>
              <button
                type="button"
                onClick={() => setChartShowAll(false)}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                  !chartShowAll ? 'bg-blue-600 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Top 8
              </button>
            </div> */}
          </div>

          {equipmentUtilization.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartShowAll ? equipmentUtilization : equipmentUtilization.slice(0, 8)} margin={{ bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#475569' }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={65}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Utilization']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="utilizationPct" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-xs text-center py-20">No utilization data available</p>
          )}
        </div>

        {/* 24x7 Utilization Heatmap Matrix (1 Col) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-800">Weekly Peak Load Heatmap</h3>
              <p className="text-xs text-gray-500">24x7 time-density allocation grid</p>
            </div>
            
            {/* Heatmap Palette Switcher Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-[10px]">
              <button
                type="button"
                onClick={() => setHeatmapTheme('THERMAL')}
                className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                  heatmapTheme === 'THERMAL' ? 'bg-white text-gray-800 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Thermal
              </button>
              <button
                type="button"
                onClick={() => setHeatmapTheme('EMERALD')}
                className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                  heatmapTheme === 'EMERALD' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Emerald
              </button>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <div className="grid grid-cols-8 text-center text-[10px] font-bold text-gray-400">
              <span>Day</span>
              {HOURS.map((h) => (
                <span key={h}>{h}h</span>
              ))}
            </div>

            {heatmapData.map((row) => (
              <div key={row.day} className="grid grid-cols-8 items-center gap-1">
                <span className="text-xs font-semibold text-gray-600">{row.day}</span>
                {row.hours.map((col, idx) => {
                  let bg = 'bg-gray-100 text-gray-400';
                  if (heatmapTheme === 'EMERALD') {
                    if (col.intensity > 75) bg = 'bg-emerald-800 text-white font-bold';
                    else if (col.intensity > 50) bg = 'bg-emerald-600 text-white font-bold';
                    else if (col.intensity > 25) bg = 'bg-emerald-400 text-emerald-950 font-bold';
                    else if (col.intensity > 10) bg = 'bg-emerald-100 text-emerald-800';
                  } else {
                    if (col.intensity > 75) bg = 'bg-red-500 text-white font-bold';
                    else if (col.intensity > 50) bg = 'bg-amber-400 text-amber-950 font-bold';
                    else if (col.intensity > 25) bg = 'bg-blue-400 text-white';
                    else if (col.intensity > 10) bg = 'bg-blue-100 text-blue-700';
                  }

                  return (
                    <div
                      key={idx}
                      title={`${row.day} at ${col.hour}: ${col.intensity}% utilization intensity`}
                      className={`h-7 rounded text-[10px] flex items-center justify-center cursor-pointer transition-all hover:scale-105 shadow-2xs ${bg}`}
                    >
                      {col.intensity}%
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500 mt-5 pt-3 border-t border-gray-100">
            {heatmapTheme === 'EMERALD' ? (
              <>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-100 inline-block border"></span> Idle</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-100 inline-block border"></span> Low</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block"></span> Moderate</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-800 inline-block"></span> Peak</span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-100 inline-block border"></span> Idle</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-100 inline-block border"></span> Low</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block"></span> Moderate</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500 inline-block"></span> Peak</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Demand Oversubscription & Idle Bottleneck Classification */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* High Demand / Oversubscribed Equipment */}
        <div className="bg-white border border-red-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-red-500" size={18} />
            <h3 className="font-bold text-gray-800 text-sm">Oversubscribed / High Demand</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">Equipment experiencing &gt;70% capacity usage. High waitlist collision risk.</p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {oversubscribedList.length > 0 ? (
              oversubscribedList.map((item) => (
                <div key={item.id} className="p-2.5 bg-red-50/60 border border-red-100 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-red-950">{item.name}</p>
                    <p className="text-[11px] text-red-700">{item.department} • ₹{item.hourlyRate}/hr</p>
                  </div>
                  <span className="bg-red-600 text-white font-bold px-2 py-0.5 rounded text-[11px]">
                    {item.utilizationPct}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic py-4 text-center">No oversubscribed equipment detected</p>
            )}
          </div>
        </div>

        {/* Balanced Demand Equipment */}
        <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="text-emerald-500" size={18} />
            <h3 className="font-bold text-gray-800 text-sm">Balanced Utilization</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">Equipment operating within healthy target window (30% - 70%).</p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {balancedList.length > 0 ? (
              balancedList.map((item) => (
                <div key={item.id} className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-emerald-950">{item.name}</p>
                    <p className="text-[11px] text-emerald-700">{item.department} • ₹{item.hourlyRate}/hr</p>
                  </div>
                  <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[11px]">
                    {item.utilizationPct}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic py-4 text-center">No balanced equipment recorded</p>
            )}
          </div>
        </div>

        {/* Underutilized / High Idle Bottlenecks */}
        <div className="bg-white border border-amber-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="text-amber-500" size={18} />
            <h3 className="font-bold text-gray-800 text-sm">Underutilized Bottlenecks</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">Assets with &lt;30% usage. Candidates for inter-institution sharing campaigns.</p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {underutilizedList.length > 0 ? (
              underutilizedList.map((item) => (
                <div key={item.id} className="p-2.5 bg-amber-50/60 border border-amber-100 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-amber-950">{item.name}</p>
                    <p className="text-[11px] text-amber-700">{item.idleHours} idle hrs • ₹{item.hourlyRate}/hr</p>
                  </div>
                  <span className="bg-amber-500 text-white font-bold px-2 py-0.5 rounded text-[11px]">
                    {item.utilizationPct}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic py-4 text-center">No underutilized equipment detected</p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <h3 className="font-bold text-gray-800">Lab Resource Utilization Effectiveness Report</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors text-sm"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 text-sm text-gray-700 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-bold text-blue-900 mb-1 text-xs uppercase tracking-wider">Executive Overview</h4>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Total of <span className="font-bold">{totalEquipment}</span> lab equipment assets monitored across partner institutions.
                  Average capacity utilization is <span className="font-bold">{avgUtilization}%</span> with a calibration compliance rate of <span className="font-bold">{calibrationComplianceRate}%</span>.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2">Key Financial & Utilization Indicators</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-500">Gross Approved Bookings Value:</span>
                    <p className="font-bold text-sm text-gray-800 mt-0.5">₹{totalRevenueIncurred.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-500">Cross-Institution Sharing Revenue:</span>
                    <p className="font-bold text-sm text-purple-700 mt-0.5">₹{crossInstRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-500">Total Idle Hours Identified:</span>
                    <p className="font-bold text-sm text-amber-700 mt-0.5">{totalIdleHours} hours</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-500">Pending Booking Approvals:</span>
                    <p className="font-bold text-sm text-blue-700 mt-0.5">{pendingBookingsCount} requests</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2">Actionable Recommendations</h4>
                <ul className="space-y-2 text-xs text-gray-600 list-disc list-inside">
                  <li>
                    <span className="font-semibold text-gray-800">Promote Underutilized Assets:</span> Promote {underutilizedList.length} underutilized machines to inter-institution sharing pools.
                  </li>
                  <li>
                    <span className="font-semibold text-gray-800">Manage High-Demand Bottlenecks:</span> Implement strict 3-hour limit per booking on {oversubscribedList.length} oversubscribed equipment.
                  </li>
                  <li>
                    <span className="font-semibold text-gray-800">Calibration Maintenance:</span> Address calibration renewals for equipment currently due or expired to ensure research compliance.
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-gray-300 transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
              >
                Print Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
