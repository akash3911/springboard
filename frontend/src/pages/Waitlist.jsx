import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const statusColors = {
  WAITING: 'bg-yellow-100 text-yellow-700',
  NOTIFIED: 'bg-blue-100 text-blue-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function Waitlist() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);

  const isManager = ['LAB_MANAGER', 'DEPARTMENT_HEAD', 'INSTITUTION_HEAD', 'SYSTEM_ADMIN'].includes(user?.role);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const endpoint = isManager ? '/waitlist' : '/waitlist/my';
      const res = await api.get(endpoint);
      setEntries(res.data);
    } catch (err) {
      toast.error('Failed to load waitlist');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Waitlist</h2>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Equipment</th>
              {isManager && (
                <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
              )}
              <th className="text-left px-4 py-3 font-medium text-gray-600">Request Time</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
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
                <td className="px-4 py-3">
                  {entry.equipment?.name || entry.equipmentName || 'N/A'}
                </td>
                {isManager && (
                  <td className="px-4 py-3">
                    {entry.user?.name || entry.userName || 'N/A'}
                  </td>
                )}
                <td className="px-4 py-3">
                  {entry.requestTime || entry.createdAt
                    ? new Date(entry.requestTime || entry.createdAt).toLocaleString()
                    : 'N/A'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      statusColors[entry.status] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {entry.status || 'WAITING'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <p className="text-center text-gray-500 py-8">No waitlist entries</p>
        )}
      </div>
    </div>
  );
}
