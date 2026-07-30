import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Calendar,
  ClipboardList,
  CheckCircle2,
  XCircle,
  DollarSign,
  Building2,
  CreditCard,
  Send,
  Check,
} from 'lucide-react';

const statusColors = {
  PENDING: 'bg-amber-100 text-amber-800 border border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  REJECTED: 'bg-red-100 text-red-800 border border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const billingStatusColors = {
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  BILLED: 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold',
  PAID: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold',
};

export default function Bookings() {
  const { user } = { user: JSON.parse(localStorage.getItem('user')) || {} };
  const [bookings, setBookings] = useState([]);
  const [waitlistRequests, setWaitlistRequests] = useState([]);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'waitlist' | 'billing'

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
          list = list.filter((b) => b.equipment?.department?.id === userDeptId);
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

      if (role === 'LAB_MANAGER') {
        const userDeptId = user?.department?.id;
        if (userDeptId) {
          list = list.filter((w) => w.equipment?.department?.id === userDeptId);
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
      toast.success('Booking approved!');
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

  const handleUpdateBilling = async (id, status) => {
    try {
      await api.put(`/bookings/${id}/billing`, { billingStatus: status });
      toast.success(`Billing status updated to ${status}!`);
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update billing status');
    }
  };

  const handleApproveWaitlist = async (id) => {
    try {
      await api.put(`/waitlist/${id}/approve`);
      toast.success('Waitlist entry approved and promoted to active booking!');
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

  // Cross-institution filter
  const crossInstBookings = bookings.filter((b) => b.isCrossInstitution || b.user?.institution?.id !== b.equipment?.department?.institution?.id);

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isManager ? 'Lab Reservations & Inter-Institution Billing' : 'My Equipment Bookings'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isManager
              ? 'Review reservation requests, manage waitlists, and issue inter-institution billing invoices.'
              : 'Track your pending requests, approved reservations, and usage costs.'}
          </p>
        </div>

        {isManager && (
          <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg border border-gray-200 flex-wrap">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'bookings' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar size={14} />
              Bookings ({bookings.filter((b) => b.status === 'PENDING').length} Pending)
            </button>
            <button
              onClick={() => setActiveTab('waitlist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'waitlist' ? 'bg-white text-purple-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ClipboardList size={14} />
              Waitlist Queue ({waitlistRequests.filter((w) => w.status === 'PENDING').length} Pending)
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'billing' ? 'bg-white text-emerald-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CreditCard size={14} />
              Billing & Invoices ({crossInstBookings.length})
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: BOOKINGS LIST */}
      {activeTab === 'bookings' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold tracking-wider">
                  <th className="px-4 py-3">Equipment</th>
                  {isManager && <th className="px-4 py-3">Researcher / Student</th>}
                  <th className="px-4 py-3">Reservation Window</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Cost (₹)</th>
                  <th className="px-4 py-3">Access Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b, idx) => (
                  <tr key={b.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {b.equipment?.name || 'N/A'}
                      <br />
                      <span className="text-[11px] text-gray-400 font-normal">
                        {b.equipment?.department?.name || 'Main Lab'}
                      </span>
                    </td>
                    {isManager && (
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-800">{b.user?.name || 'N/A'}</span>
                        <br />
                        <span className="text-gray-400">{b.user?.email}</span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-600 leading-tight">
                      <span className="font-medium text-gray-700">
                        {b.startTime ? new Date(b.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                      </span>
                      <br />
                      <span className="text-[11px] text-gray-400">
                        to {b.endTime ? new Date(b.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-gray-600" title={b.purpose}>
                      {b.purpose || 'N/A'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      ₹{b.totalCost ? b.totalCost.toFixed(2) : '450.00'}
                    </td>
                    <td className="px-4 py-3">
                      {b.isCrossInstitution ? (
                        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200">
                          <Building2 size={11} /> Cross-Inst
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded font-medium">
                          Internal
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${statusColors[b.status] || 'bg-gray-100 text-gray-600'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {b.status === 'PENDING' && (
                        <div className="flex justify-end gap-1.5">
                          {isManager ? (
                            <>
                              <button
                                onClick={() => handleApprove(b.id)}
                                className="bg-emerald-600 text-white px-2.5 py-1 rounded text-xs hover:bg-emerald-700 font-semibold cursor-pointer shadow-2xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectId(b.id)}
                                className="bg-red-600 text-white px-2.5 py-1 rounded text-xs hover:bg-red-700 font-semibold cursor-pointer shadow-2xs"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleCancel(b.id)}
                              className="bg-gray-500 text-white px-2.5 py-1 rounded text-xs hover:bg-gray-600 font-semibold cursor-pointer"
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
          </div>
          {bookings.length === 0 && (
            <p className="text-center text-gray-400 py-12 text-xs">No booking records found</p>
          )}
        </div>
      )}

      {/* TAB 2: WAITLIST QUEUE */}
      {activeTab === 'waitlist' && isManager && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-purple-50/50 border-b border-gray-200 text-gray-600 uppercase font-semibold tracking-wider">
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">User / Researcher</th>
                  <th className="px-4 py-3">Requested Start</th>
                  <th className="px-4 py-3">Requested End</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {waitlistRequests.map((w, idx) => (
                  <tr key={w.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-3 font-semibold text-gray-800">{w.equipment?.name || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-800">{w.user?.name || 'N/A'}</span>
                      <br />
                      <span className="text-gray-400">{w.user?.email}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {w.startTime ? new Date(w.startTime).toLocaleString() : 'First available slot'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {w.endTime ? new Date(w.endTime).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-purple-100 text-purple-800 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border border-purple-200">
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {w.status === 'PENDING' && (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleApproveWaitlist(w.id)}
                            className="bg-purple-600 text-white px-2.5 py-1 rounded text-xs hover:bg-purple-700 font-semibold cursor-pointer shadow-2xs inline-flex items-center gap-1"
                          >
                            <CheckCircle2 size={12} />
                            Approve & Book
                          </button>
                          <button
                            onClick={() => handleCancelWaitlist(w.id)}
                            className="bg-gray-500 text-white px-2.5 py-1 rounded text-xs hover:bg-gray-600 font-semibold cursor-pointer inline-flex items-center gap-1"
                          >
                            <XCircle size={12} />
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {waitlistRequests.length === 0 && (
            <p className="text-center text-gray-400 py-12 text-xs">No active waitlist requests found</p>
          )}
        </div>
      )}

      {/* TAB 3: INTER-INSTITUTION BILLING & INVOICES */}
      {activeTab === 'billing' && isManager && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
            <div>
              <h3 className="font-bold text-emerald-950 text-sm">Inter-Institution Billing & Revenue Clearinghouse</h3>
              <p className="text-xs text-emerald-800">
                Track billable bookings reserved by external researchers from partner institutions.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 uppercase font-semibold">Total Billable Value</span>
              <p className="text-xl font-extrabold text-emerald-700">
                ₹{bookings.reduce((acc, curr) => acc + (curr.totalCost || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold tracking-wider">
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Researcher Institution</th>
                  <th className="px-4 py-3">Total Cost (₹)</th>
                  <th className="px-4 py-3">Billing Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b, idx) => {
                  const billStatus = b.billingStatus || 'PENDING';
                  return (
                    <tr key={b.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-3 font-mono font-bold text-gray-700">#{b.id}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{b.equipment?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700">
                        <span className="font-semibold text-purple-700">{b.user?.institution?.name || 'Partner College'}</span>
                        <br />
                        <span className="text-gray-400">{b.user?.name}</span>
                      </td>
                      <td className="px-4 py-3 font-extrabold text-gray-900">₹{(b.totalCost || 450.0).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full ${billingStatusColors[billStatus] || 'bg-gray-100 text-gray-600'}`}>
                          {billStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {billStatus !== 'BILLED' && billStatus !== 'PAID' && (
                            <button
                              onClick={() => handleUpdateBilling(b.id, 'BILLED')}
                              className="bg-blue-600 text-white px-2.5 py-1 rounded text-xs hover:bg-blue-700 font-semibold cursor-pointer transition-all shadow-2xs inline-flex items-center gap-1"
                            >
                              <Send size={11} /> Issue Bill
                            </button>
                          )}
                          {billStatus !== 'PAID' && (
                            <button
                              onClick={() => handleUpdateBilling(b.id, 'PAID')}
                              className="bg-emerald-600 text-white px-2.5 py-1 rounded text-xs hover:bg-emerald-700 font-semibold cursor-pointer transition-all shadow-2xs inline-flex items-center gap-1"
                            >
                              <Check size={11} /> Mark Paid
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
        </div>
      )}

      {/* REJECT REASON MODAL */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50 font-bold text-gray-800">Rejection Reason</div>
            <div className="p-6 space-y-4 text-xs">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setRejectId(null);
                    setRejectReason('');
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(rejectId)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-red-700 cursor-pointer shadow-sm"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
