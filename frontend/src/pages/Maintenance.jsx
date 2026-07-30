import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Wrench,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  ShieldAlert,
  Calendar,
  X,
  FileText,
  DollarSign,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

const statusColors = {
  PENDING: 'bg-amber-100 text-amber-800 border border-amber-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border border-blue-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  CANCELLED: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const calibrationColors = {
  VALID: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  DUE_SOON: 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse',
  EXPIRED: 'bg-red-100 text-red-800 border border-red-200 font-bold',
};

export default function Maintenance() {
  const { user } = { user: JSON.parse(localStorage.getItem('user')) || {} };
  const [records, setRecords] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [activeTab, setActiveTab] = useState('workorders'); // 'workorders' | 'calibration'
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [completeMaintId, setCompleteMaintId] = useState(null);

  // New Work Order Form State
  const [scheduleForm, setScheduleForm] = useState({
    equipmentId: '',
    maintenanceDate: new Date().toISOString().split('T')[0],
    description: '',
    maintenanceType: 'PREVENTIVE',
    technicianId: '',
    cost: 150.0,
    nextDueDate: '',
  });

  // Complete Form State
  const [completeForm, setCompleteForm] = useState({
    repairNotes: '',
    calibrationNotes: '',
    cost: 150.0,
  });

  const isTechnician = user?.role === 'LAB_TECHNICIAN';
  const canManage = ['LAB_MANAGER', 'DEPARTMENT_HEAD', 'INSTITUTION_HEAD', 'SYSTEM_ADMIN'].includes(user?.role);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const endpoint = isTechnician ? '/maintenance/my' : '/maintenance';
      const [maintRes, eqRes, userRes] = await Promise.all([
        api.get(endpoint).catch(() => ({ data: [] })),
        api.get('/equipment').catch(() => ({ data: [] })),
        api.get('/users').catch(() => ({ data: [] })),
      ]);

      setRecords(maintRes.data || []);
      setEquipmentList(eqRes.data || []);

      const techs = (userRes.data || []).filter((u) => u.role === 'LAB_TECHNICIAN' || u.role === 'LAB_MANAGER');
      setTechnicians(techs);
    } catch (err) {
      toast.error('Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        equipmentId: Number(scheduleForm.equipmentId),
        maintenanceDate: scheduleForm.maintenanceDate,
        description: scheduleForm.description,
        maintenanceType: scheduleForm.maintenanceType,
        technicianId: scheduleForm.technicianId ? Number(scheduleForm.technicianId) : null,
        cost: Number(scheduleForm.cost),
        nextDueDate: scheduleForm.nextDueDate || null,
        workOrderNumber: `WO-${Math.floor(1000 + Math.random() * 9000)}`,
      };

      await api.post('/maintenance', payload);
      toast.success('Maintenance work order scheduled successfully!');
      setShowScheduleModal(false);
      setScheduleForm({
        equipmentId: '',
        maintenanceDate: new Date().toISOString().split('T')[0],
        description: '',
        maintenanceType: 'PREVENTIVE',
        technicianId: '',
        cost: 150.0,
        nextDueDate: '',
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule maintenance');
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/maintenance/${completeMaintId}/complete`, {
        repairNotes: completeForm.repairNotes,
        calibrationNotes: completeForm.calibrationNotes,
        cost: Number(completeForm.cost),
      });
      toast.success('Work order marked as COMPLETED and equipment restored to AVAILABLE status!');
      setCompleteMaintId(null);
      setCompleteForm({ repairNotes: '', calibrationNotes: '', cost: 150.0 });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete work order');
    }
  };

  // Open Schedule modal pre-filled for Calibration
  const openCalibrationSchedule = (eq) => {
    setScheduleForm({
      equipmentId: eq.id,
      maintenanceDate: new Date().toISOString().split('T')[0],
      description: `Routine Recalibration & Certification for ${eq.name}`,
      maintenanceType: 'CALIBRATION',
      technicianId: technicians.length > 0 ? technicians[0].id : '',
      cost: 250.0,
      nextDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setShowScheduleModal(true);
  };

  // Calibration alert counts
  const expiredCalibrations = equipmentList.filter((e) => e.calibrationStatus === 'EXPIRED');
  const dueSoonCalibrations = equipmentList.filter((e) => e.calibrationStatus === 'DUE_SOON');

  return (
    <div className="space-y-6">
      {/* Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-800">Maintenance & Calibration Management</h2>
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
              Work Order Ecosystem
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Manage work order requests, preventative servicing, repair costs, and calibration certification renewals.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center justify-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
          >
            <Plus size={16} />
            New Work Order
          </button>
        )}
      </div>

      {/* Urgent Calibration Alert Banner */}
      {(expiredCalibrations.length > 0 || dueSoonCalibrations.length > 0) && (
        <div className="bg-gradient-to-r from-amber-50 to-red-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={22} />
          <div className="flex-1">
            <h4 className="font-bold text-red-950 text-sm">Calibration Renewal Alerts Triggered</h4>
            <p className="text-xs text-red-800 mt-0.5 leading-relaxed">
              <span className="font-bold">{expiredCalibrations.length}</span> equipment items have EXPIRED calibrations and{' '}
              <span className="font-bold">{dueSoonCalibrations.length}</span> items are DUE SOON within 30 days. Please schedule recalibration.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('calibration')}
            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-700 cursor-pointer shadow-2xs whitespace-nowrap"
          >
            View Calibrations
          </button>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex border-b border-gray-200 bg-white px-4 pt-2 rounded-t-xl border border-gray-200">
        <button
          onClick={() => setActiveTab('workorders')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'workorders'
              ? 'border-blue-600 text-blue-600 bg-blue-50/30'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wrench size={16} />
          Active Work Orders ({records.length})
        </button>

        <button
          onClick={() => setActiveTab('calibration')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'calibration'
              ? 'border-blue-600 text-blue-600 bg-blue-50/30'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <RefreshCw size={16} />
          Calibration & Certification Tracking ({equipmentList.length})
        </button>
      </div>

      {/* TAB 1: WORK ORDERS LIST */}
      {activeTab === 'workorders' && (
        <div className="bg-white border border-gray-200 rounded-b-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold tracking-wider">
                  <th className="px-4 py-3">Work Order #</th>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Scheduled Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Assigned Tech</th>
                  <th className="px-4 py-3">Cost (₹)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((m, idx) => (
                  <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">
                      {m.workOrderNumber || `WO-${1000 + m.id}`}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {m.equipment?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-medium border border-gray-200">
                        {m.maintenanceType || 'REPAIR'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {m.maintenanceDate ? new Date(m.maintenanceDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 max-w-xs text-gray-600 truncate" title={m.description}>
                      {m.description || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {m.technician?.name || m.technicianName || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      ₹{m.cost ? m.cost.toFixed(2) : '1500.00'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${statusColors[m.status] || 'bg-gray-100 text-gray-600'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {m.status === 'PENDING' && (isTechnician || canManage) && (
                        <button
                          onClick={() => {
                            setCompleteMaintId(m.id);
                            setCompleteForm({ repairNotes: '', calibrationNotes: '', cost: m.cost || 150.0 });
                          }}
                          className="inline-flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-1 rounded text-xs hover:bg-emerald-700 font-medium cursor-pointer transition-all shadow-2xs"
                        >
                          <CheckCircle size={13} />
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {records.length === 0 && (
            <p className="text-center text-gray-400 py-12 text-xs">No active maintenance work orders found</p>
          )}
        </div>
      )}

      {/* TAB 2: CALIBRATION & CERTIFICATION TRACKING */}
      {activeTab === 'calibration' && (
        <div className="bg-white border border-gray-200 rounded-b-xl overflow-hidden shadow-sm p-4 space-y-4">
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div>
              <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Calibration Compliance Registry</h3>
              <p className="text-xs text-gray-500">Monitor instrument calibration cycles, expiration timelines, and certification logs.</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded font-semibold border border-emerald-200">
                Valid ({equipmentList.filter((e) => !e.calibrationStatus || e.calibrationStatus === 'VALID').length})
              </span>
              <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded font-semibold border border-amber-200">
                Due Soon ({dueSoonCalibrations.length})
              </span>
              <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded font-semibold border border-red-200">
                Expired ({expiredCalibrations.length})
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold tracking-wider">
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Last Calibration</th>
                  <th className="px-4 py-3">Next Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {equipmentList.map((eq, idx) => {
                  const status = eq.calibrationStatus || 'VALID';
                  return (
                    <tr key={eq.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-3 font-semibold text-gray-800">{eq.name}</td>
                      <td className="px-4 py-3 text-gray-600">{eq.category}</td>
                      <td className="px-4 py-3 text-gray-600">{eq.department?.name || 'General'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {eq.lastCalibrationDate ? new Date(eq.lastCalibrationDate).toLocaleDateString() : '2026-03-15'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {eq.nextCalibrationDate ? new Date(eq.nextCalibrationDate).toLocaleDateString() : '2026-09-15'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${calibrationColors[status]}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canManage && (
                          <button
                            onClick={() => openCalibrationSchedule(eq)}
                            className="bg-blue-600 text-white px-2.5 py-1 rounded text-xs hover:bg-blue-700 font-semibold cursor-pointer transition-all shadow-2xs"
                          >
                            Recalibrate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW WORK ORDER MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                <Wrench size={18} className="text-blue-600" />
                <h3 className="font-bold text-gray-800">Schedule Maintenance Work Order</h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors text-sm"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Equipment *</label>
                <select
                  required
                  value={scheduleForm.equipmentId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, equipmentId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-xs"
                >
                  <option value="">Select Equipment...</option>
                  {equipmentList.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.department?.name || 'Main Lab'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Maintenance Type</label>
                  <select
                    value={scheduleForm.maintenanceType}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, maintenanceType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-xs"
                  >
                    <option value="PREVENTIVE">PREVENTIVE</option>
                    <option value="REPAIR">REPAIR</option>
                    <option value="CALIBRATION">CALIBRATION</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.maintenanceDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, maintenanceDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Assign Technician</label>
                  <select
                    value={scheduleForm.technicianId}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, technicianId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-xs"
                  >
                    <option value="">Auto-Assign / Unassigned</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Estimated Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={scheduleForm.cost}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, cost: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Work Description / Problem Details</label>
                <textarea
                  rows={3}
                  required
                  value={scheduleForm.description}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                  placeholder="Describe maintenance instructions, error codes, or calibration parameters..."
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 cursor-pointer shadow-sm"
                >
                  Dispatch Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE WORK ORDER MODAL */}
      {completeMaintId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-emerald-600" />
                <h3 className="font-bold text-gray-800">Complete Work Order Task</h3>
              </div>
              <button
                onClick={() => setCompleteMaintId(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors text-sm"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Final Service Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={completeForm.cost}
                  onChange={(e) => setCompleteForm({ ...completeForm, cost: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Repair Resolution Notes</label>
                <textarea
                  rows={2}
                  value={completeForm.repairNotes}
                  onChange={(e) => setCompleteForm({ ...completeForm, repairNotes: e.target.value })}
                  placeholder="Enter details of parts replaced or repairs performed..."
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Calibration Certificate Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={completeForm.calibrationNotes}
                  onChange={(e) => setCompleteForm({ ...completeForm, calibrationNotes: e.target.value })}
                  placeholder="Enter recalibration adjustments or certificate reference..."
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCompleteMaintId(null)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700 cursor-pointer shadow-sm"
                >
                  Mark Completed & Restore Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
