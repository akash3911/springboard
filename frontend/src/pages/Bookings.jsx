import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Calendar, ClipboardList, CheckCircle2, XCircle } from 'lucide-react';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  APPROVED: 'bg-green-100 text-green-700 border border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border border-gray-200',
};

export default function Bookings() {
  const { user } = { user: JSON.parse(localStorage.getItem('user')) }; // Get fresh user state
  const [bookings, setBookings] = useState([]);
  const [waitlistRequests, setWaitlistRequests] = useState([]);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState('bookings');

  const role = user?.role;
  const isManager = ['LAB_MANAGER', 'DEPARTMENT_HEAD', 'INSTITUTION_HEAD', 'SYSTEM_ADMIN'].includes(role);

  useEffect(() => {
    loadBookings();
    if (isManager) {
      loadWaitlistRequests();
    }
  }, []);

  const loadBookings = async () => {
    try {
      const endpoint = isManager ? '/bookings' : '/bookings/my';
      const res = await api.get(endpoint);
      let list = Array.isArray(res.data) ? res.data : [];

      // If Lab Manager, limit to their department equipment
      if (role === 'LAB_MANAGER') {
        const userDeptId = user?.department?.id;
        if (userDeptId) {
          list = list.filter(b => b.equipment?.department?.id === userDeptId);
        }
      }
      setBookings(list);
    } catch (err) {
      toast.error('Failed to load bookings');
    }
  };

  const loadWaitlistRequests = async () => {
    try {
      const res = await api.get('/waitlist');
      let list = Array.isArray(res.data) ? res.data : [];

      // If Lab Manager, limit to their department equipment
      if (role === 'LAB_MANAGER') {
        const userDeptId = user?.department?.id;
        if (userDeptId) {
          list = list.filter(w => w.equipment?.department?.id === userDeptId);
        }
      }
      setWaitlistRequests(list);
    } catch {
      setWaitlistRequests([]);
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
      await api.put(`/bookings/${id}/reject`, { rejectionReason: rejectReason });
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

  const handleApproveWaitlist = async (id) => {
    try {
      await api.put(`/waitlist/${id}/approve`);
      toast.success('Waitlist entry approved and promoted to booking!');
      loadWaitlistRequests();
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve waitlist entry');
    }
  };

  const handleCancelWaitlist = async (id) => {
    try {
      await api.put(`/waitlist/${id}/cancel`);
      toast.success('Waitlist entry cancelled');
      loadWaitlistRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel waitlist entry');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isManager ? 'Lab Booking & Waitlist Management' : 'My Bookings'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {isManager
              ? 'Review and manage equipment booking requests and waitlists for your lab'
              : 'Track your equipment booking requests and status'}
          </p>
        </div>

        {isManager && (
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                activeTab === 'bookings' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar size={14} />
              Bookings ({bookings.filter(b => b.status === 'PENDING').length} Pending)
            </button>
            <button
              onClick={() => setActiveTab('waitlist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                activeTab === 'waitlist' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ClipboardList size={14} />
              Waitlist Queue ({waitlistRequests.filter(w => w.status === 'PENDING').length} Pending)
            </button>
          </div>
        )}
      </div>

      {activeTab === 'bookings' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Equipment</th>
                {isManager && <th className="text-left px-4 py-3 font-medium text-gray-600">User / Student</th>}
                <th className="text-left px-4 py-3 font-medium text-gray-600">Start Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">End Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Purpose</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, idx) => (
                <tr
                  key={b.id}
                  className={`border-b border-gray-100 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-gray-800">{b.equipment?.name || 'N/A'}</td>
                  {isManager && (
                    <td className="px-4 py-3 text-xs">
                      <span className="font-medium text-gray-800">{b.user?.name || 'N/A'}</span>
                      <br />
                      <span className="text-gray-500">{b.user?.email}</span>
                    </td>
                  )}
                  <td className="px-4 py-3 text-xs">
                    {b.startTime ? new Date(b.startTime).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {b.endTime ? new Date(b.endTime).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-xs">{b.purpose || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        statusColors[b.status] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {b.status === 'PENDING' && (
                      <div className="flex gap-1.5">
                        {isManager ? (
                          <>
                            <button
                              onClick={() => handleApprove(b.id)}
                              className="bg-green-600 text-white px-2.5 py-1 rounded text-xs hover:bg-green-700 font-medium cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectId(b.id)}
                              className="bg-red-600 text-white px-2.5 py-1 rounded text-xs hover:bg-red-700 font-medium cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleCancel(b.id)}
                            className="bg-gray-500 text-white px-2.5 py-1 rounded text-xs hover:bg-gray-600 font-medium cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <p className="text-center text-gray-500 py-8">No booking records found</p>
          )}
        </div>
      )}

      {/* Waitlist Queue Tab for Managers */}
      {activeTab === 'waitlist' && isManager && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-purple-50/50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Equipment</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">User / Student</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Requested Start Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Requested End Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {waitlistRequests.map((w, idx) => (
                <tr
                  key={w.id}
                  className={`border-b border-gray-100 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-gray-800">{w.equipment?.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-medium text-gray-800">{w.user?.name || 'N/A'}</span>
                    <br />
                    <span className="text-gray-500">{w.user?.email}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {w.startTime ? new Date(w.startTime).toLocaleString() : 'As soon as free'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {w.endTime ? new Date(w.endTime).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        w.status === 'PENDING'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : statusColors[w.status] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {w.status === 'PENDING' && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleApproveWaitlist(w.id)}
                          className="bg-purple-600 text-white px-2.5 py-1 rounded text-xs hover:bg-purple-700 font-medium cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} />
                          Approve & Book
                        </button>
                        <button
                          onClick={() => handleCancelWaitlist(w.id)}
                          className="bg-gray-500 text-white px-2.5 py-1 rounded text-xs hover:bg-gray-600 font-medium cursor-pointer flex items-center gap-1"
                        >
                          <XCircle size={12} />
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {waitlistRequests.length === 0 && (
            <p className="text-center text-gray-500 py-8">No waitlist requests found</p>
          )}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md border border-gray-200">
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
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectId)}
                className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 font-medium cursor-pointer"
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
