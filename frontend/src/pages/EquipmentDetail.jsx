import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Calendar,
  Wrench,
  Edit,
  Trash2,
  ArrowLeft,
  Clock,
  UserCheck,
  CheckCircle2,
  Building2,
} from 'lucide-react';

const statusColors = {
  AVAILABLE: 'bg-green-100 text-green-700 border border-green-200',
  BOOKED: 'bg-blue-100 text-blue-700 border border-blue-200',
  BOOKING_PENDING: 'bg-amber-100 text-amber-800 border border-amber-200',
  UNDER_MAINTENANCE: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  OUT_OF_SERVICE: 'bg-red-100 text-red-700 border border-red-200',
};

const getEquipmentImage = (eq) => {
  if (eq?.imageUrl) return eq.imageUrl;
  const name = (eq?.name || '').toLowerCase();
  const cat = (eq?.category || '').toLowerCase();

  if (name.includes('3d printer')) return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
  if (name.includes('vr') || name.includes('headset')) return 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?auto=format&fit=crop&w=800&q=80';
  if (name.includes('laser') || cat.includes('optics')) return 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80';
  if (name.includes('cryostat') || cat.includes('cryo')) return 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80';
  if (name.includes('pcr') || cat.includes('biology')) return 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80';
  if (name.includes('microscope') || cat.includes('imaging')) return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80';
  if (name.includes('centrifuge')) return 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=800&q=80';
  if (name.includes('sequencer') || cat.includes('chemistry') || cat.includes('genetics')) return 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80';
  return 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80';
};

export default function EquipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [equipment, setEquipment] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [userPendingBooking, setUserPendingBooking] = useState(null);
  const [anyPendingBooking, setAnyPendingBooking] = useState(null);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [userWaitlistEntry, setUserWaitlistEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookForm, setShowBookForm] = useState(false);
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [bookForm, setBookForm] = useState({
    startTime: '',
    endTime: '',
    purpose: '',
  });
  const [waitlistForm, setWaitlistForm] = useState({
    startTime: '',
    endTime: '',
  });
  const [maintForm, setMaintForm] = useState({
    scheduledDate: '',
    description: '',
    technicianId: '',
  });
  const [editForm, setEditForm] = useState({});

  const role = user?.role;

  useEffect(() => {
    loadEquipment();
    loadWaitlist();
    loadBookings();
  }, [id]);

  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const getMinBookingStartTime = () => {
    if (activeBooking?.endTime) {
      const endTime = new Date(activeBooking.endTime);
      endTime.setMinutes(endTime.getMinutes() - endTime.getTimezoneOffset());
      return endTime.toISOString().slice(0, 16);
    }
    return getCurrentDateTimeLocal();
  };

  const loadEquipment = async () => {
    try {
      const res = await api.get(`/equipment/${id}`);
      setEquipment(res.data);
      setEditForm(res.data);
    } catch (err) {
      toast.error('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const res = await api.get(`/bookings/equipment/${id}`);
      const list = Array.isArray(res.data) ? res.data : [];
      const approved = list.find(b => b.status === 'APPROVED');
      setActiveBooking(approved || null);

      const pending = list.find(b => b.status === 'PENDING' && b.user?.email === user?.email);
      setUserPendingBooking(pending || null);

      const firstPending = list.find(b => b.status === 'PENDING');
      setAnyPendingBooking(firstPending || null);
    } catch {
      setActiveBooking(null);
      setUserPendingBooking(null);
      setAnyPendingBooking(null);
    }
  };

  const loadWaitlist = async () => {
    try {
      const res = await api.get(`/equipment/${id}/waitlist`);
      const list = Array.isArray(res.data) ? res.data : [];
      setWaitlistEntries(list.filter(w => w.status === 'PENDING'));
      const myEntry = list.find(w => w.user?.email === user?.email && w.status === 'PENDING');
      setUserWaitlistEntry(myEntry || null);
    } catch {
      // ignore
    }
  };

  const isOwnDept = equipment && user && user.department?.id && equipment.department?.id === user.department?.id;
  const isOwnInst = equipment && user && equipment.department?.institution?.id === (user.institution?.id || user.department?.institution?.id);

  const isStudentBlocked = role === 'STUDENT' && Boolean(equipment?.isRestricted);

  // Managers cannot book or join waitlists (only Students & Researchers can)
  const canBook = ['STUDENT', 'RESEARCHER'].includes(role) && !isStudentBlocked;
  const canJoinWaitlist = ['STUDENT', 'RESEARCHER'].includes(role) && !isStudentBlocked;

  const canEdit = (role === 'LAB_MANAGER' && isOwnDept) || 
                  (role === 'DEPARTMENT_HEAD' && isOwnDept) || 
                  (role === 'INSTITUTION_HEAD' && isOwnInst) || 
                  (role === 'SYSTEM_ADMIN');

  const canDelete = canEdit;

  const canScheduleMaint = (role === 'LAB_MANAGER' && isOwnDept);

  const isCurrentlyUsed = equipment?.status === 'BOOKED' || Boolean(activeBooking);
  const isBeingUsed = isCurrentlyUsed || equipment?.status === 'UNDER_MAINTENANCE' || equipment?.status === 'OUT_OF_SERVICE';

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bookings', {
        equipmentId: Number(id),
        startTime: bookForm.startTime,
        endTime: bookForm.endTime,
        purpose: bookForm.purpose,
      });
      toast.success('Booking request submitted');
      setShowBookForm(false);
      setBookForm({ startTime: '', endTime: '', purpose: '' });
      loadEquipment();
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book');
    }
  };

  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    try {
      await api.post('/waitlist', {
        equipmentId: Number(id),
        startTime: waitlistForm.startTime,
        endTime: waitlistForm.endTime,
      });
      toast.success('Successfully joined waitlist!');
      setShowWaitlistForm(false);
      setWaitlistForm({ startTime: '', endTime: '' });
      loadWaitlist();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join waitlist');
    }
  };

  const handleLeaveWaitlist = async () => {
    if (!userWaitlistEntry) return;
    try {
      await api.put(`/waitlist/${userWaitlistEntry.id}/cancel`);
      toast.success('Left waitlist');
      loadWaitlist();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave waitlist');
    }
  };

  const handleScheduleMaintenance = async (e) => {
    e.preventDefault();
    try {
      await api.post('/maintenance', {
        equipmentId: Number(id),
        scheduledDate: maintForm.scheduledDate,
        description: maintForm.description,
        technicianId: maintForm.technicianId ? Number(maintForm.technicianId) : undefined,
      });
      toast.success('Maintenance scheduled');
      setShowMaintenanceForm(false);
      setMaintForm({ scheduledDate: '', description: '', technicianId: '' });
      loadEquipment();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule maintenance');
    }
  };

  const loadTechnicians = async () => {
    try {
      const res = await api.get('/users?role=LAB_TECHNICIAN');
      setTechnicians(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTechnicians([]);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editForm,
        departmentId: editForm.department?.id || undefined,
      };
      await api.put(`/equipment/${id}`, payload);
      toast.success('Equipment updated');
      setShowEditForm(false);
      loadEquipment();
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;
    try {
      await api.delete(`/equipment/${id}`);
      toast.success('Equipment deleted');
      navigate('/equipment');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <p className="text-gray-500 py-8 text-center">Loading equipment details...</p>;
  if (!equipment) return <p className="text-gray-500 py-8 text-center">Equipment not found</p>;

  if (isStudentBlocked) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
        <h3 className="font-bold text-lg mb-2">Access Denied</h3>
        <p>You do not have the required permissions to view this restricted equipment.</p>
        <button onClick={() => navigate('/equipment')} className="mt-4 text-blue-600 font-medium hover:underline flex items-center gap-1">
          <ArrowLeft size={16} /> Back to Catalog
        </button>
      </div>
    );
  }

  const instName = equipment.department?.institution?.name || 'Partner College';

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/equipment')}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 mb-4 cursor-pointer font-medium"
      >
        <ArrowLeft size={16} />
        Back to Equipment
      </button>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded">
                {equipment.category}
              </span>
              <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded flex items-center gap-1">
                <Building2 size={12} />
                {instName}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mt-2">{equipment.name}</h1>
            <p className="text-gray-500 text-sm">{equipment.manufacturer} — {equipment.model}</p>
          </div>
          <span
            className={`text-sm px-3.5 py-1.5 rounded-full font-semibold shadow-sm ${
              statusColors[equipment.status] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {equipment.status === 'BOOKING_PENDING' ? 'BOOKING PENDING' : equipment.status?.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Main Section: Image + Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Left: Equipment Image */}
          <div className="md:col-span-1">
            <div className="w-full h-64 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative">
              <img
                src={getEquipmentImage(equipment)}
                alt={equipment.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80';
                }}
              />
            </div>
          </div>

          {/* Right: Details Grid */}
          <div className="md:col-span-2 space-y-4">
            {/* Active Booking Banner */}
            {activeBooking && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 flex items-start gap-3">
                <Calendar size={20} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="w-full">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-blue-900">Currently Booked & Approved</h4>
                  <p className="text-xs text-blue-800 mt-1">
                    Booked by <span className="font-semibold text-blue-950">{activeBooking.user?.name || 'User'}</span> ({activeBooking.user?.email})
                  </p>
                  <p className="text-xs font-mono text-blue-900 mt-1 bg-blue-100/70 inline-block px-2 py-0.5 rounded">
                    Booked until: {new Date(activeBooking.endTime).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Pending Booking Banner for current user */}
            {userPendingBooking && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3">
                <Clock size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-wider text-amber-900">Pending Booking Request</h4>
                  <p className="text-xs text-amber-800 mt-1">
                    You already submitted a booking request for this equipment (from{' '}
                    <span className="font-semibold">{new Date(userPendingBooking.startTime).toLocaleString()}</span> to{' '}
                    <span className="font-semibold">{new Date(userPendingBooking.endTime).toLocaleString()}</span>). Awaiting manager approval.
                  </p>
                </div>
              </div>
            )}

            {/* Pending Booking Banner for other user */}
            {!userPendingBooking && anyPendingBooking && !activeBooking && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3">
                <Clock size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-wider text-amber-900">Booking Request Pending</h4>
                  <p className="text-xs text-amber-800 mt-1">
                    Another user has submitted a booking request for this equipment awaiting manager approval. You can still submit your own booking request.
                  </p>
                </div>
              </div>
            )}

            {/* Waitlist Banner if user is on waitlist */}
            {userWaitlistEntry && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-800">
                  <CheckCircle2 size={16} className="text-purple-600" />
                  <span className="text-xs font-medium">You are currently on the waitlist for this equipment.</span>
                </div>
                <button
                  onClick={handleLeaveWaitlist}
                  className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2.5 py-1 rounded font-medium cursor-pointer"
                >
                  Leave Waitlist
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Manufacturer</p>
                <p className="font-medium text-gray-800">{equipment.manufacturer || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Model</p>
                <p className="font-medium text-gray-800">{equipment.model || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Serial Number</p>
                <p className="font-medium text-gray-800 font-mono text-xs">{equipment.serialNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Room Number</p>
                <p className="font-medium text-gray-800">{equipment.roomNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Contact Email</p>
                <p className="font-medium text-gray-800">{equipment.contactEmail || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Purchase Date</p>
                <p className="font-medium text-gray-800">
                  {equipment.purchaseDate
                    ? new Date(equipment.purchaseDate).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Department & College</p>
                <p className="font-medium text-gray-800">
                  {equipment.department?.name || 'N/A'} ({instName})
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Active Waitlist</p>
                <p className="font-medium text-gray-800 flex items-center gap-1">
                  <Clock size={14} className="text-purple-600" />
                  {waitlistEntries.length} {waitlistEntries.length === 1 ? 'user' : 'users'} waiting
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        {equipment.specifications && (
          <div className="mb-6 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Specifications</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-mono text-gray-700 whitespace-pre-wrap">
              {equipment.specifications}
            </div>
          </div>
        )}

        {/* Description */}
        {equipment.description && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{equipment.description}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 flex-wrap">
          {canBook && !isBeingUsed && !userPendingBooking && (
            <button
              onClick={() => {
                setShowBookForm(!showBookForm);
                if (!showBookForm) {
                  setBookForm({
                    startTime: getMinBookingStartTime(),
                    endTime: '',
                    purpose: '',
                  });
                }
              }}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 font-medium cursor-pointer transition-colors shadow-sm"
            >
              <Calendar size={16} />
              Book Equipment
            </button>
          )}

          {/* Join Waitlist shown ONLY when equipment is currently being used by someone (approved booking) and user does not have a pending booking */}
          {canJoinWaitlist && isCurrentlyUsed && !userWaitlistEntry && !userPendingBooking && (
            <button
              onClick={() => {
                setShowWaitlistForm(!showWaitlistForm);
                if (!showWaitlistForm) {
                  setWaitlistForm({
                    startTime: getMinBookingStartTime(),
                    endTime: '',
                  });
                }
              }}
              className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 font-medium cursor-pointer transition-colors shadow-sm"
            >
              <Clock size={16} />
              Join Waitlist
            </button>
          )}

          {userWaitlistEntry && (
            <button
              onClick={handleLeaveWaitlist}
              className="flex items-center gap-1.5 bg-purple-100 text-purple-800 border border-purple-300 px-4 py-2 rounded-lg text-sm hover:bg-purple-200 font-medium cursor-pointer transition-colors"
            >
              <UserCheck size={16} />
              On Waitlist (Click to Leave)
            </button>
          )}

          {canScheduleMaint && (
            <button
              onClick={() => {
                setShowMaintenanceForm(!showMaintenanceForm);
                if (!showMaintenanceForm) loadTechnicians();
              }}
              className="flex items-center gap-1.5 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 font-medium cursor-pointer transition-colors shadow-sm"
            >
              <Wrench size={16} />
              Schedule Maintenance
            </button>
          )}

          {canEdit && (
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              className="flex items-center gap-1.5 bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 font-medium cursor-pointer transition-colors shadow-sm"
            >
              <Edit size={16} />
              Edit
            </button>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 font-medium cursor-pointer transition-colors shadow-sm"
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookForm && (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Book Equipment</h3>
          <form onSubmit={handleBook} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time <span className="text-xs text-gray-400">(Previous dates dimmed)</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  min={getCurrentDateTimeLocal()}
                  value={bookForm.startTime}
                  onChange={(e) => setBookForm({ ...bookForm, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time <span className="text-xs text-gray-400">(Must be after start time)</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  min={bookForm.startTime || getCurrentDateTimeLocal()}
                  value={bookForm.endTime}
                  onChange={(e) => setBookForm({ ...bookForm, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe your purpose for booking this equipment..."
                value={bookForm.purpose}
                onChange={(e) => setBookForm({ ...bookForm, purpose: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBookForm(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Submit Booking Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Waitlist Form Modal (with start/end time selection dimmed prior to current user endtime) */}
      {showWaitlistForm && (
        <div className="mt-4 bg-white border border-purple-200 rounded-xl p-5 shadow-sm bg-purple-50/40">
          <h3 className="text-lg font-semibold text-purple-900 mb-1">Join Equipment Waitlist</h3>
          {activeBooking && (
            <p className="text-xs text-purple-800 bg-purple-100/70 border border-purple-200 p-2.5 rounded mb-4">
              Note: Equipment is currently reserved until <span className="font-bold">{new Date(activeBooking.endTime).toLocaleString()}</span>. All earlier dates/times prior to this end time are dimmed and disabled.
            </p>
          )}
          <form onSubmit={handleJoinWaitlist} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requested Start Time <span className="text-xs text-purple-600">(Dimmed before current end time)</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  min={getMinBookingStartTime()}
                  value={waitlistForm.startTime}
                  onChange={(e) => setWaitlistForm({ ...waitlistForm, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requested End Time
                </label>
                <input
                  type="datetime-local"
                  required
                  min={waitlistForm.startTime || getMinBookingStartTime()}
                  value={waitlistForm.endTime}
                  onChange={(e) => setWaitlistForm({ ...waitlistForm, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWaitlistForm(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
              >
                Join Waitlist Queue
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Maintenance Form Modal */}
      {showMaintenanceForm && (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Schedule Maintenance</h3>
          <form onSubmit={handleScheduleMaintenance} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  required
                  min={getCurrentDateTimeLocal().slice(0, 10)}
                  value={maintForm.scheduledDate}
                  onChange={(e) => setMaintForm({ ...maintForm, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Technician
                </label>
                <select
                  value={maintForm.technicianId}
                  onChange={(e) => setMaintForm({ ...maintForm, technicianId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select Technician (Optional)</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe maintenance work..."
                value={maintForm.description}
                onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMaintenanceForm(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium"
              >
                Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Equipment</h3>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={editForm.category || ''}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                <input
                  type="text"
                  required
                  value={editForm.manufacturer || ''}
                  onChange={(e) => setEditForm({ ...editForm, manufacturer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input
                  type="text"
                  required
                  value={editForm.model || ''}
                  onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={editForm.imageUrl || ''}
                  onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.status || 'AVAILABLE'}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="BOOKING_PENDING">BOOKING PENDING</option>
                  <option value="BOOKED">BOOKED</option>
                  <option value="UNDER_MAINTENANCE">UNDER MAINTENANCE</option>
                  <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-900 font-medium"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
