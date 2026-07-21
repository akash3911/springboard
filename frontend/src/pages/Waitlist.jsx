import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  WAITING: 'bg-yellow-100 text-yellow-700',
  NOTIFIED: 'bg-blue-100 text-blue-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function Waitlist() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const isManager = ['LAB_MANAGER', 'DEPARTMENT_HEAD', 'INSTITUTION_HEAD', 'SYSTEM_ADMIN'].includes(user?.role);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const endpoint = isManager ? '/waitlist' : '/waitlist/my';
      const res = await api.get(endpoint);
      setEntries(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load waitlist');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this waitlist request?')) return;
    try {
      await api.put(`/waitlist/${id}/cancel`);
      toast.success('Waitlist request cancelled');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel waitlist request');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Equipment Waitlist</h2>
        <span className="text-sm text-gray-500">{entries.length} Entries</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading waitlist...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Equipment</th>
                {isManager && (
                  <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                )}
                <th className="text-left px-4 py-3 font-medium text-gray-600">Request Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr
                  key={entry.id}
                  className={`border-b border-gray-100 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">#{entry.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {entry.equipment?.name || entry.equipmentName || 'N/A'}
                  </td>
                  {isManager && (
                    <td className="px-4 py-3 text-gray-600">
                      {entry.user?.name || entry.userName || 'N/A'} ({entry.user?.email})
                    </td>
                  )}
                  <td className="px-4 py-3 text-gray-600">
                    {entry.requestTime || entry.createdAt
                      ? new Date(entry.requestTime || entry.createdAt).toLocaleString()
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        statusColors[entry.status] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {entry.status || 'PENDING'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {entry.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancel(entry.id)}
                        className="text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && entries.length === 0 && (
          <p className="text-center text-gray-500 py-8">No waitlist entries found.</p>
        )}
      </div>
    </div>
  );
}
