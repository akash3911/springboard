import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { CheckCircle, X } from 'lucide-react';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function Maintenance() {
  const { user } = { user: JSON.parse(localStorage.getItem('user')) }; // Get fresh user state
  const [records, setRecords] = useState([]);
  
  // Modal state
  const [completeMaintId, setCompleteMaintId] = useState(null);
  const [repairNotes, setRepairNotes] = useState('');
  const [calibrationNotes, setCalibrationNotes] = useState('');

  const isTechnician = user?.role === 'LAB_TECHNICIAN';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const endpoint = isTechnician ? '/maintenance/my' : '/maintenance';
      const res = await api.get(endpoint);
      setRecords(res.data);
    } catch (err) {
      toast.error('Failed to load maintenance records');
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/maintenance/${completeMaintId}/complete`, {
        repairNotes,
        calibrationNotes,
      });
      toast.success('Maintenance completed and equipment status set to AVAILABLE');
      setCompleteMaintId(null);
      setRepairNotes('');
      setCalibrationNotes('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete maintenance');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Maintenance</h2>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Equipment</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date Scheduled</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Details / Description</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Technician</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Next Due</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((m, idx) => (
              <tr
                key={m.id}
                className={`border-b border-gray-100 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="px-4 py-3 font-medium text-gray-800">{m.equipment?.name || m.equipmentName || 'N/A'}</td>
                <td className="px-4 py-3">
                  {m.maintenanceDate
                    ? new Date(m.maintenanceDate).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td className="px-4 py-3 max-w-xs whitespace-pre-wrap">{m.description || 'N/A'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      statusColors[m.status] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {m.technician?.name || m.technicianName || 'N/A'}
                </td>
                <td className="px-4 py-3">
                  {m.nextDueDate
                    ? new Date(m.nextDueDate).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td className="px-4 py-3">
                  {m.status === 'PENDING' && isTechnician && (
                    <button
                      onClick={() => setCompleteMaintId(m.id)}
                      className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 font-medium cursor-pointer"
                    >
                      <CheckCircle size={14} />
                      Complete Work
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && (
          <p className="text-center text-gray-500 py-8">No maintenance records found</p>
        )}
      </div>

      {/* Complete Maintenance Modal */}
      {completeMaintId && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md border border-gray-200 relative">
            <button
              onClick={() => setCompleteMaintId(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-semibold mb-3">Complete Maintenance Task</h3>
            <form onSubmit={handleComplete} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repair Notes
                </label>
                <textarea
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  placeholder="Enter details about repairs performed..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calibration Notes
                </label>
                <textarea
                  value={calibrationNotes}
                  onChange={(e) => setCalibrationNotes(e.target.value)}
                  placeholder="Enter equipment calibration adjustments..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCompleteMaintId(null);
                    setRepairNotes('');
                    setCalibrationNotes('');
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 font-medium cursor-pointer"
                >
                  Mark Completed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
