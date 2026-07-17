import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const isManager = ['LAB_MANAGER', 'DEPARTMENT_HEAD', 'INSTITUTION_HEAD', 'SYSTEM_ADMIN'].includes(user?.role);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const endpoint = isManager ? '/bookings' : '/bookings/my';
      const res = await api.get(endpoint);
      setBookings(res.data);
    } catch (err) {
      toast.error('Failed to load bookings');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/bookings/${id}/approve`);
      toast.success('Booking approved');
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/bookings/${id}/reject`, { reason: rejectReason });
      toast.success('Booking rejected');
      setRejectId(null);
      setRejectReason('');
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.put(`/bookings/${id}/cancel`);
      toast.success('Booking cancelled');
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Bookings</h2>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Equipment</th>
              {isManager && (
                <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
              )}
              <th className="text-left px-4 py-3 font-medium text-gray-600">Start Time</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">End Time</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Purpose</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              {isManager && (
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {bookings.map((b, idx) => (
              <tr
                key={b.id}
                className={`border-b border-gray-100 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="px-4 py-3">{b.equipment?.name || b.equipmentName || 'N/A'}</td>
                {isManager && (
                  <td className="px-4 py-3">{b.user?.name || b.userName || 'N/A'}</td>
                )}
                <td className="px-4 py-3">
                  {b.startTime ? new Date(b.startTime).toLocaleString() : 'N/A'}
                </td>
                <td className="px-4 py-3">
                  {b.endTime ? new Date(b.endTime).toLocaleString() : 'N/A'}
                </td>
                <td className="px-4 py-3 max-w-xs truncate">{b.purpose || 'N/A'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      statusColors[b.status] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
                {isManager && (
                  <td className="px-4 py-3">
                    {b.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleApprove(b.id)}
                          className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectId(b.id)}
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && (
          <p className="text-center text-gray-500 py-8">No bookings found</p>
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3">Rejection Reason</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setRejectId(null);
                  setRejectReason('');
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectId)}
                className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
