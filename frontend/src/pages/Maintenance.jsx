import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';

const statusColors = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function Maintenance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);

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

  const handleComplete = async (id) => {
    try {
      await api.put(`/maintenance/${id}/complete`);
      toast.success('Maintenance completed');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete');
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
              <th className="text-left px-4 py-3 font-medium text-gray-600">Scheduled Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
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
                <td className="px-4 py-3">{m.equipment?.name || m.equipmentName || 'N/A'}</td>
                <td className="px-4 py-3">
                  {m.scheduledDate
                    ? new Date(m.scheduledDate).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td className="px-4 py-3 max-w-xs truncate">{m.description || 'N/A'}</td>
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
                  {(m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS') &&
                    isTechnician && (
                      <button
                        onClick={() => handleComplete(m.id)}
                        className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                      >
                        <CheckCircle size={14} />
                        Complete
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
    </div>
  );
}
