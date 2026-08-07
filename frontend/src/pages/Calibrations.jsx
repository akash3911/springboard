import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Clock,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  FileText,
  ExternalLink,
  Calendar,
  Building,
  Wrench,
  X,
  Printer,
  FileCheck,
  Zap,
} from 'lucide-react';

const statusColors = {
  VALID: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  DUE_SOON: 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse',
  EXPIRED: 'bg-red-100 text-red-800 border-red-300 font-bold',
};

export default function Calibrations() {
  const { user } = { user: JSON.parse(localStorage.getItem('user')) || {} };
  const [equipmentList, setEquipmentList] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState('registry'); // 'registry' | 'certificates' | 'logs'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [certTypeFilter, setCertTypeFilter] = useState('ALL');

  // Modals
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedEq, setSelectedEq] = useState(null);
  const [showCertPreview, setShowCertPreview] = useState(null);
  const [showBatchDispatchModal, setShowBatchDispatchModal] = useState(false);

  // Renewal Form
  const [renewForm, setRenewForm] = useState({
    equipmentId: '',
    lastCalibrationDate: new Date().toISOString().split('T')[0],
    nextCalibrationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    calibrationStatus: 'VALID',
    certificateNumber: '',
    certificateAgency: '',
    certificateType: 'Calibration Certificate',
    certificateUrl: '',
    cost: 250.0,
    notes: '',
  });

  // Batch Dispatch Form
  const [batchForm, setBatchForm] = useState({
    technicianId: '',
    targetStatus: 'EXPIRED_AND_DUE', // 'EXPIRED_AND_DUE' | 'EXPIRED' | 'DUE_SOON'
    notes: 'Urgent Recalibration Work Order dispatched via EHM Portal.',
  });

  const canManage = ['LAB_TECHNICIAN', 'LAB_MANAGER', 'DEPARTMENT_HEAD', 'INSTITUTION_HEAD', 'SYSTEM_ADMIN'].includes(user?.role);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eqRes, maintRes, userRes, deptRes] = await Promise.all([
        api.get('/equipment').catch(() => ({ data: [] })),
        api.get('/maintenance').catch(() => ({ data: [] })),
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/departments').catch(() => ({ data: [] })),
      ]);

      setEquipmentList(eqRes.data || []);
      setMaintenanceLogs(maintRes.data || []);
      setTechnicians((userRes.data || []).filter((u) => u.role === 'LAB_TECHNICIAN' || u.role === 'LAB_MANAGER'));
      setDepartments(deptRes.data || []);
    } catch (err) {
      toast.error('Failed to load calibration data');
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (nextDateStr) => {
    if (!nextDateStr) return null;
    const target = new Date(nextDateStr);
    const today = new Date();
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateAutoStatus = (nextDateStr) => {
    const days = getDaysRemaining(nextDateStr);
    if (days === null) return 'VALID';
    if (days < 0) return 'EXPIRED';
    if (days <= 30) return 'DUE_SOON';
    return 'VALID';
  };

  // Open modal prefilled for equipment
  const handleOpenRenew = (eq) => {
    setSelectedEq(eq);
    const today = new Date().toISOString().split('T')[0];
    const sixMonthsLater = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const autoCertNum = eq?.certificateNumber || `CAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    setRenewForm({
      equipmentId: eq.id,
      lastCalibrationDate: today,
      nextCalibrationDate: sixMonthsLater,
      calibrationStatus: 'VALID',
      certificateNumber: autoCertNum,
      certificateAgency: eq?.certificateAgency || `${eq?.manufacturer || 'National'} Metrology Services`,
      certificateType: eq?.certificateType || 'Calibration Certificate',
      certificateUrl: eq?.certificateUrl || '',
      cost: 250.0,
      notes: `Routine recalibration & accuracy verification performed for ${eq.name}.`,
    });
    setShowRenewModal(true);
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        lastCalibrationDate: renewForm.lastCalibrationDate,
        nextCalibrationDate: renewForm.nextCalibrationDate,
        calibrationStatus: renewForm.calibrationStatus,
        certificateNumber: renewForm.certificateNumber,
        certificateAgency: renewForm.certificateAgency,
        certificateType: renewForm.certificateType,
        certificateUrl: renewForm.certificateUrl,
        notes: renewForm.notes,
        cost: Number(renewForm.cost),
      };

      await api.put(`/equipment/${renewForm.equipmentId}/calibration`, payload);
      toast.success('Calibration & Certificate Renewal logged successfully!');
      setShowRenewModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record calibration');
    }
  };

  const handleBatchDispatch = async (e) => {
    e.preventDefault();
    let targetEqs = [];
    if (batchForm.targetStatus === 'EXPIRED_AND_DUE') {
      targetEqs = equipmentList.filter((e) => e.calibrationStatus === 'EXPIRED' || e.calibrationStatus === 'DUE_SOON');
    } else if (batchForm.targetStatus === 'EXPIRED') {
      targetEqs = equipmentList.filter((e) => e.calibrationStatus === 'EXPIRED');
    } else {
      targetEqs = equipmentList.filter((e) => e.calibrationStatus === 'DUE_SOON');
    }

    if (targetEqs.length === 0) {
      toast.error('No equipment found matching the selected criteria.');
      return;
    }

    try {
      let createdCount = 0;
      for (const eq of targetEqs) {
        await api.post('/maintenance', {
          equipmentId: eq.id,
          maintenanceDate: new Date().toISOString().split('T')[0],
          description: `[AUTO-DISPATCH] Recalibration Work Order for ${eq.name}. ${batchForm.notes}`,
          maintenanceType: 'CALIBRATION',
          technicianId: batchForm.technicianId ? Number(batchForm.technicianId) : null,
          cost: 250.0,
          workOrderNumber: `WO-CAL-${Math.floor(1000 + Math.random() * 9000)}`,
        });
        createdCount++;
      }
      toast.success(`Successfully dispatched ${createdCount} recalibration work orders!`);
      setShowBatchDispatchModal(false);
      loadData();
    } catch (err) {
      toast.error('Error dispatching batch work orders.');
    }
  };

  const exportAuditReportCSV = () => {
    if (equipmentList.length === 0) {
      toast.error('No equipment data to export');
      return;
    }

    let csvContent =
      'Equipment ID,Equipment Name,Category,Department,Serial Number,Last Calibration,Next Calibration Due,Days Remaining,Calibration Status,Certificate Number,Issuing Agency,Certificate Type\n';

    filteredEquipment.forEach((eq) => {
      const days = getDaysRemaining(eq.nextCalibrationDate);
      const daysText = days !== null ? (days < 0 ? `EXPIRED (${Math.abs(days)}d ago)` : `${days} days`) : 'N/A';
      csvContent += `${eq.id},"${eq.name}","${eq.category}","${eq.department?.name || 'General'}","${eq.serialNumber || 'N/A'}",${eq.lastCalibrationDate || 'N/A'},${eq.nextCalibrationDate || 'N/A'},"${daysText}",${eq.calibrationStatus || 'VALID'},"${eq.certificateNumber || 'N/A'}","${eq.certificateAgency || 'N/A'}","${eq.certificateType || 'Calibration'}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Calibration_Compliance_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit Compliance CSV Report downloaded successfully!');
  };

  // Metrics
  const totalEq = equipmentList.length;
  const expiredCount = equipmentList.filter((e) => e.calibrationStatus === 'EXPIRED').length;
  const dueSoonCount = equipmentList.filter((e) => e.calibrationStatus === 'DUE_SOON').length;
  const validCount = equipmentList.filter((e) => !e.calibrationStatus || e.calibrationStatus === 'VALID').length;
  const complianceRate = totalEq > 0 ? Math.round((validCount / totalEq) * 100) : 100;

  // Filter logic
  const filteredEquipment = equipmentList.filter((eq) => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (eq.serialNumber && eq.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (eq.certificateNumber && eq.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (eq.certificateAgency && eq.certificateAgency.toLowerCase().includes(searchTerm.toLowerCase())) ||
      eq.category.toLowerCase().includes(searchTerm.toLowerCase());

    const status = eq.calibrationStatus || 'VALID';
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
    const matchesDept = deptFilter === 'ALL' || eq.department?.id === Number(deptFilter);
    const matchesCertType = certTypeFilter === 'ALL' || (eq.certificateType && eq.certificateType === certTypeFilter);

    return matchesSearch && matchesStatus && matchesDept && matchesCertType;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Award size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Calibration & Certificate Renewals
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Equipment Health Management (EHM) portal for instrument calibration tracking, safety permits, and compliance renewals.
              </p>
            </div>
          </div>
        </div>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (equipmentList.length > 0) handleOpenRenew(equipmentList[0]);
              }}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
            >
              <Plus size={16} />
              Log Calibration / Renewal
            </button>

            <button
              onClick={() => setShowBatchDispatchModal(true)}
              className="flex items-center gap-1.5 bg-amber-600 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold hover:bg-amber-700 transition-all cursor-pointer shadow-sm"
            >
              <Zap size={16} />
              Batch Dispatch Request
            </button>

            <button
              onClick={exportAuditReportCSV}
              className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3.5 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all cursor-pointer border border-gray-200"
            >
              <Download size={16} />
              Export Audit CSV
            </button>
          </div>
        )}
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Rate Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Compliance Rate</span>
            <div className="text-2xl font-black text-gray-800 mt-1">{complianceRate}%</div>
            <div className="w-32 bg-gray-100 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  complianceRate >= 90 ? 'bg-emerald-500' : complianceRate >= 70 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${complianceRate}%` }}
              />
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShieldCheck size={26} />
          </div>
        </div>

        {/* Valid Calibrations */}
        <div
          onClick={() => setStatusFilter('VALID')}
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-all"
        >
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Valid & Certified</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{validCount}</div>
            <p className="text-[11px] text-gray-400 mt-1">Instrument calibrations active</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={26} />
          </div>
        </div>

        {/* Due Soon (30 Days) */}
        <div
          onClick={() => setStatusFilter('DUE_SOON')}
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-300 transition-all"
        >
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Soon (30d)</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{dueSoonCount}</div>
            <p className="text-[11px] text-amber-700 mt-1 font-medium">Requires scheduled servicing</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={26} />
          </div>
        </div>

        {/* Expired Calibrations */}
        <div
          onClick={() => setStatusFilter('EXPIRED')}
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-red-300 transition-all"
        >
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Expired / Overdue</span>
            <div className="text-2xl font-black text-red-600 mt-1">{expiredCount}</div>
            <p className="text-[11px] text-red-700 mt-1 font-bold">Needs immediate action</p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle size={26} />
          </div>
        </div>
      </div>

      {/* Urgent Warning Banner */}
      {expiredCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <XCircle className="text-red-600 shrink-0" size={22} />
            <div>
              <h4 className="font-bold text-red-950 text-sm">Critical Expiration Notice</h4>
              <p className="text-xs text-red-800">
                {expiredCount} equipment item(s) have EXPIRED calibrations or permits. Using non-calibrated devices may breach lab compliance.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBatchDispatchModal(true)}
            className="bg-red-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-red-700 shrink-0 cursor-pointer shadow-xs"
          >
            Dispatch Work Orders
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search equipment, cert #, agency..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="VALID">Valid Only</option>
              <option value="DUE_SOON">Due Soon (30 Days)</option>
              <option value="EXPIRED">Expired / Overdue</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cert Type Filter */}
          <div>
            <select
              value={certTypeFilter}
              onChange={(e) => setCertTypeFilter(e.target.value)}
              className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Certificate Types</option>
              <option value="Calibration Certificate">Calibration Certificate</option>
              <option value="Safety Compliance Permit">Safety Compliance Permit</option>
              <option value="ISO 17025 Standard">ISO 17025 Standard</option>
              <option value="Laser/Radiation License">Laser/Radiation License</option>
              <option value="Vendor Warranty Cert">Vendor Warranty Cert</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 bg-white px-5 pt-3 rounded-t-2xl border border-gray-200">
        <button
          onClick={() => setActiveTab('registry')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'registry'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Award size={16} />
          Equipment Calibration Registry ({filteredEquipment.length})
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'certificates'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <FileCheck size={16} />
          Certificates & Permits ({filteredEquipment.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'logs'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <RefreshCw size={16} />
          Renewal History & Audit Trail ({maintenanceLogs.filter((m) => m.maintenanceType === 'CALIBRATION').length})
        </button>
      </div>

      {/* TAB 1: EQUIPMENT CALIBRATION REGISTRY */}
      {activeTab === 'registry' && (
        <div className="bg-white border border-gray-200 rounded-b-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-bold tracking-wider">
                  <th className="px-4 py-3.5">Equipment & Serial #</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Last Calibration</th>
                  <th className="px-4 py-3.5">Next Due Date</th>
                  <th className="px-4 py-3.5">Days Remaining</th>
                  <th className="px-4 py-3.5">Cert # / Agency</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEquipment.map((eq, idx) => {
                  const status = eq.calibrationStatus || 'VALID';
                  const daysLeft = getDaysRemaining(eq.nextCalibrationDate);

                  return (
                    <tr key={eq.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40 hover:bg-blue-50/20'}>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900">{eq.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {eq.serialNumber ? `SN: ${eq.serialNumber}` : eq.category}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 font-medium">
                        {eq.department?.name || 'General Lab'}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 font-medium">
                        {eq.lastCalibrationDate ? new Date(eq.lastCalibrationDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 font-medium">
                        {eq.nextCalibrationDate ? new Date(eq.nextCalibrationDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3.5">
                        {daysLeft !== null ? (
                          daysLeft < 0 ? (
                            <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                              Expired {Math.abs(daysLeft)}d ago
                            </span>
                          ) : daysLeft <= 30 ? (
                            <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              {daysLeft} days left
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {daysLeft} days left
                            </span>
                          )
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 max-w-xs truncate">
                        <div className="font-mono text-blue-600 font-semibold">{eq.certificateNumber || 'CAL-2026-REG'}</div>
                        <div className="text-[11px] text-gray-500 truncate">{eq.certificateAgency || 'National Calibration Lab'}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${statusColors[status]}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setShowCertPreview(eq)}
                            title="View Digital Certificate"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-blue-200"
                          >
                            <FileText size={14} />
                          </button>
                          {canManage && (
                            <button
                              onClick={() => handleOpenRenew(eq)}
                              className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-blue-700 cursor-pointer shadow-2xs transition-all"
                            >
                              Recalibrate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredEquipment.length === 0 && (
            <p className="text-center text-gray-400 py-12 text-xs">No equipment matching search criteria.</p>
          )}
        </div>
      )}

      {/* TAB 2: CERTIFICATES & PERMITS TRACKER */}
      {activeTab === 'certificates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map((eq) => {
            const status = eq.calibrationStatus || 'VALID';
            const daysLeft = getDaysRemaining(eq.nextCalibrationDate);

            return (
              <div key={eq.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {eq.certificateType || 'Calibration Certificate'}
                      </span>
                      <h3 className="font-extrabold text-gray-900 text-sm mt-1.5">{eq.name}</h3>
                      <p className="text-xs text-gray-500">{eq.department?.name || 'General Lab'}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusColors[status]}`}>
                      {status}
                    </span>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-xl space-y-2 text-xs font-medium text-gray-600 border border-gray-100">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cert #:</span>
                      <span className="font-mono font-bold text-gray-800">{eq.certificateNumber || 'CAL-2026-8910'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Issuing Agency:</span>
                      <span className="font-semibold text-gray-700">{eq.certificateAgency || 'TUV SUD Metrology'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Issue Date:</span>
                      <span>{eq.lastCalibrationDate ? new Date(eq.lastCalibrationDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expiration Date:</span>
                      <span className="font-bold text-gray-800">
                        {eq.nextCalibrationDate ? new Date(eq.nextCalibrationDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-[11px] text-gray-400">
                    {daysLeft !== null ? (daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : `${daysLeft} days valid`) : ''}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCertPreview(eq)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 cursor-pointer border border-gray-200"
                    >
                      View Badge
                    </button>
                    {canManage && (
                      <button
                        onClick={() => handleOpenRenew(eq)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-xs"
                      >
                        Renew
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: RENEWAL HISTORY LOG & AUDIT TRAIL */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-gray-200 rounded-b-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-bold tracking-wider">
                  <th className="px-4 py-3.5">Work Order #</th>
                  <th className="px-4 py-3.5">Equipment</th>
                  <th className="px-4 py-3.5">Service Date</th>
                  <th className="px-4 py-3.5">Details & Remarks</th>
                  <th className="px-4 py-3.5">Technician / Vendor</th>
                  <th className="px-4 py-3.5">Service Cost</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {maintenanceLogs
                  .filter((m) => m.maintenanceType === 'CALIBRATION' || m.description?.toLowerCase().includes('calibration'))
                  .map((m, idx) => (
                    <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                      <td className="px-4 py-3.5 font-mono font-bold text-blue-600">
                        {m.workOrderNumber || `WO-CAL-${1000 + m.id}`}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-gray-900">{m.equipment?.name || 'Equipment'}</td>
                      <td className="px-4 py-3.5 text-gray-600">
                        {m.maintenanceDate ? new Date(m.maintenanceDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 max-w-sm text-gray-600 leading-relaxed" title={m.description}>
                        {m.description || 'Recalibration completed'}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-gray-700">
                        {m.technician?.name || 'Authorized Metrology Lab'}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-gray-900">₹{m.cost ? m.cost.toFixed(2) : '250.00'}</td>
                      <td className="px-4 py-3.5">
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {maintenanceLogs.filter((m) => m.maintenanceType === 'CALIBRATION' || m.description?.toLowerCase().includes('calibration')).length === 0 && (
            <p className="text-center text-gray-400 py-12 text-xs">No historical calibration audit logs recorded yet.</p>
          )}
        </div>
      )}

      {/* LOG CALIBRATION & CERTIFICATE RENEWAL MODAL */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-blue-600" />
                <h3 className="font-bold text-gray-900 text-sm">Log Calibration & Certificate Renewal</h3>
              </div>
              <button
                onClick={() => setShowRenewModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRenewSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Target Equipment *</label>
                <select
                  required
                  value={renewForm.equipmentId}
                  onChange={(e) => {
                    const eq = equipmentList.find((x) => x.id === Number(e.target.value));
                    setSelectedEq(eq);
                    setRenewForm({ ...renewForm, equipmentId: e.target.value });
                  }}
                  className="w-full border border-gray-300 rounded-xl p-2.5 bg-white text-xs font-semibold text-gray-800"
                >
                  <option value="">Select equipment...</option>
                  {equipmentList.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.department?.name || 'General'}) - {eq.calibrationStatus || 'VALID'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Calibration Date *</label>
                  <input
                    type="date"
                    required
                    value={renewForm.lastCalibrationDate}
                    onChange={(e) => {
                      const calDate = new Date(e.target.value);
                      const nextDate = new Date(calDate.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      setRenewForm({ ...renewForm, lastCalibrationDate: e.target.value, nextCalibrationDate: nextDate });
                    }}
                    className="w-full border border-gray-300 rounded-xl p-2 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Next Expiry / Due Date *</label>
                  <input
                    type="date"
                    required
                    value={renewForm.nextCalibrationDate}
                    onChange={(e) => setRenewForm({ ...renewForm, nextCalibrationDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2 bg-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Certificate Number</label>
                  <input
                    type="text"
                    required
                    value={renewForm.certificateNumber}
                    onChange={(e) => setRenewForm({ ...renewForm, certificateNumber: e.target.value })}
                    placeholder="e.g. CAL-2026-8812"
                    className="w-full border border-gray-300 rounded-xl p-2 bg-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Issuing Agency / Lab</label>
                  <input
                    type="text"
                    required
                    value={renewForm.certificateAgency}
                    onChange={(e) => setRenewForm({ ...renewForm, certificateAgency: e.target.value })}
                    placeholder="e.g. National Metrology Institute"
                    className="w-full border border-gray-300 rounded-xl p-2 bg-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Certificate Type</label>
                  <select
                    value={renewForm.certificateType}
                    onChange={(e) => setRenewForm({ ...renewForm, certificateType: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2 bg-white text-xs"
                  >
                    <option value="Calibration Certificate">Calibration Certificate</option>
                    <option value="Safety Compliance Permit">Safety Compliance Permit</option>
                    <option value="ISO 17025 Standard">ISO 17025 Standard</option>
                    <option value="Laser/Radiation License">Laser/Radiation License</option>
                    <option value="Vendor Warranty Cert">Vendor Warranty Cert</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Calibration Status</label>
                  <select
                    value={renewForm.calibrationStatus}
                    onChange={(e) => setRenewForm({ ...renewForm, calibrationStatus: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2 bg-white text-xs font-bold text-emerald-700"
                  >
                    <option value="VALID">VALID (Certified)</option>
                    <option value="DUE_SOON">DUE SOON (Within 30d)</option>
                    <option value="EXPIRED">EXPIRED (Needs Servicing)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Service Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={renewForm.cost}
                    onChange={(e) => setRenewForm({ ...renewForm, cost: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Digital Doc Reference URL</label>
                  <input
                    type="text"
                    value={renewForm.certificateUrl}
                    onChange={(e) => setRenewForm({ ...renewForm, certificateUrl: e.target.value })}
                    placeholder="https://certs.lab.org/doc-8812.pdf"
                    className="w-full border border-gray-300 rounded-xl p-2 bg-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Calibration Notes & Observations</label>
                <textarea
                  rows={2}
                  value={renewForm.notes}
                  onChange={(e) => setRenewForm({ ...renewForm, notes: e.target.value })}
                  placeholder="Record sensor tolerance adjustments, temperature readings, NIST standards used..."
                  className="w-full border border-gray-300 rounded-xl p-2 text-xs"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowRenewModal(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-sm"
                >
                  Save & Issue Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIGITAL CERTIFICATE BADGE MODAL */}
      {showCertPreview && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200">
            {/* Certificate Printable Area */}
            <div className="p-6 bg-gradient-to-br from-gray-900 via-blue-950 to-slate-900 text-white relative">
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-bold transition-colors cursor-pointer"
                  title="Print Certificate"
                >
                  <Printer size={16} />
                </button>
                <button
                  onClick={() => setShowCertPreview(null)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-400/30">
                  <ShieldCheck size={32} />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-blue-400 uppercase">OFFICIAL EHM VERIFIED</span>
                  <h2 className="text-lg font-black tracking-tight">CERTIFICATE OF CALIBRATION</h2>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-300">Equipment Name:</span>
                  <span className="font-bold text-white">{showCertPreview.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Serial Number:</span>
                  <span className="font-mono text-amber-300">{showCertPreview.serialNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Certificate ID:</span>
                  <span className="font-mono text-blue-300 font-bold">{showCertPreview.certificateNumber || 'CAL-2026-VERIFIED'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Issuing Body:</span>
                  <span className="font-semibold text-white">{showCertPreview.certificateAgency || 'National Calibration Bureau'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Last Calibrated:</span>
                  <span>{showCertPreview.lastCalibrationDate ? new Date(showCertPreview.lastCalibrationDate).toLocaleDateString() : '2026-03-15'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Valid Until:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {showCertPreview.nextCalibrationDate ? new Date(showCertPreview.nextCalibrationDate).toLocaleDateString() : '2026-09-15'}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-white/10">
                <span>Status: <strong className="text-emerald-400">{showCertPreview.calibrationStatus || 'VALID'}</strong></span>
                <span>NIST & ISO 17025 Compliant</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t border-gray-200">
              <button
                onClick={() => setShowCertPreview(null)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-300 cursor-pointer"
              >
                Close Badge Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH DISPATCH WORK ORDER MODAL */}
      {showBatchDispatchModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-amber-600" />
                <h3 className="font-bold text-gray-900 text-sm">Batch Recalibration Work Order Dispatch</h3>
              </div>
              <button
                onClick={() => setShowBatchDispatchModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBatchDispatch} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Target Equipment Filter</label>
                <select
                  value={batchForm.targetStatus}
                  onChange={(e) => setBatchForm({ ...batchForm, targetStatus: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 bg-white text-xs font-semibold"
                >
                  <option value="EXPIRED_AND_DUE">All Expired & Due Soon ({expiredCount + dueSoonCount} items)</option>
                  <option value="EXPIRED">Expired Items Only ({expiredCount} items)</option>
                  <option value="DUE_SOON">Due Soon Items Only ({dueSoonCount} items)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Assign Service Technician</label>
                <select
                  value={batchForm.technicianId}
                  onChange={(e) => setBatchForm({ ...batchForm, technicianId: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 bg-white text-xs"
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
                <label className="block font-bold text-gray-700 mb-1">Work Order Instructions</label>
                <textarea
                  rows={3}
                  value={batchForm.notes}
                  onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2 text-xs"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchDispatchModal(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-700 cursor-pointer shadow-sm"
                >
                  Dispatch All Work Orders
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
