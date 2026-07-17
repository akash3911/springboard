import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, Wrench, Edit, Trash2 } from 'lucide-react';

const statusColors = {
  AVAILABLE: 'bg-green-100 text-green-700',
  BOOKED: 'bg-blue-100 text-blue-700',
  UNDER_MAINTENANCE: 'bg-yellow-100 text-yellow-700',
  OUT_OF_SERVICE: 'bg-red-100 text-red-700',
};

export default function EquipmentDetail() {
  const { id } = useParams();
  const { user } = { user: JSON.parse(localStorage.getItem('user')) }; // Get fresh user state
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookForm, setShowBookForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [bookForm, setBookForm] = useState({
    startTime: '',
    endTime: '',
    purpose: '',
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
  }, [id]);

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

  const isOwnDept = equipment && user && equipment.department?.id === user.department?.id;
  const isOwnInst = equipment && user && equipment.department?.institution?.id === user.department?.institution?.id;

  // Enforce precise Student/Researcher access checks
  const isStudentBlocked = role === 'STUDENT' && (!isOwnDept || equipment?.isRestricted);
  const isResearcherBlocked = role === 'RESEARCHER' && (!isOwnInst && !equipment?.isShared);

  const canBook = ['STUDENT', 'RESEARCHER', 'LAB_MANAGER'].includes(role) && 
                    (role === 'STUDENT' ? isOwnDept && !equipment?.isRestricted :
                     role === 'RESEARCHER' ? (isOwnInst || equipment?.isShared) : true);

  const canEdit = (role === 'LAB_MANAGER' && isOwnDept) || 
                  (role === 'DEPARTMENT_HEAD' && isOwnDept) || 
                  (role === 'INSTITUTION_HEAD' && isOwnInst) || 
                  (role === 'SYSTEM_ADMIN');

  const canDelete = canEdit;

  const canScheduleMaint = (role === 'LAB_MANAGER' && isOwnDept);
  
  const canJoinWaitlist = ['STUDENT', 'RESEARCHER'].includes(role) && 
                          (role === 'STUDENT' ? isOwnDept && !equipment?.isRestricted :
                           role === 'RESEARCHER' ? (isOwnInst || equipment?.isShared) : true);

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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book');
    }
  };

  const handleJoinWaitlist = async () => {
    try {
      await api.post('/waitlist', { equipmentId: Number(id) });
      toast.success('Added to waitlist');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join waitlist');
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
      // Tech dropdown list: if system admin, get all techs. If not, restrict to techs in their institution
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

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!equipment) return <p className="text-gray-500">Equipment not found</p>;

  if (isStudentBlocked || isResearcherBlocked) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
        <h3 className="font-bold text-lg mb-2">Access Denied</h3>
        <p>You do not have the required permissions to view this restricted or department-specific equipment.</p>
        <button onClick={() => navigate('/equipment')} className="mt-4 text-blue-600 font-medium hover:underline flex items-center gap-1">
          <ArrowLeft size={16} /> Back to Catalog
        </button>
      </div>
    );
  }

  const isExternal = equipment.department?.institution?.id !== user?.department?.institution?.id;
  const hideTagsRoles = ['STUDENT', 'RESEARCHER'];
  const showTags = !hideTagsRoles.includes(role);

  return (
    <div>
      <button
        onClick={() => navigate('/equipment')}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 mb-4"
      >
        <ArrowLeft size={16} />
        Back to Equipment
      </button>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{equipment.name}</h2>
            <p className="text-gray-500">{equipment.category}</p>
          </div>
          <span
            className={`text-sm px-3 py-1 rounded-full ${
              statusColors[equipment.status] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {equipment.status?.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Manufacturer</p>
            <p className="text-gray-800">{equipment.manufacturer || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Model</p>
            <p className="text-gray-800">{equipment.model || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Serial Number</p>
            <p className="text-gray-800">{equipment.serialNumber || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Room Number</p>
            <p className="text-gray-800">{equipment.roomNumber || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Contact Email</p>
            <p className="text-gray-800">{equipment.contactEmail || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Purchase Date</p>
            <p className="text-gray-800">
              {equipment.purchaseDate
                ? new Date(equipment.purchaseDate).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Department</p>
            <p className="text-gray-800">
              {equipment.department?.name || 'N/A'} ({equipment.department?.institution?.name || 'N/A'})
            </p>
          </div>
          {showTags && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Tags</p>
              <div className="flex gap-1 flex-wrap">
                {equipment.isRestricted && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                    Restricted
                  </span>
                )}
                {equipment.isShared && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-200">
                    Shared
                  </span>
                )}
                {isExternal && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200">
                    External
                  </span>
                )}
                {!equipment.isRestricted && !equipment.isShared && !isExternal && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-gray-50 text-gray-600 border border-gray-200">
                    Internal
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Specifications */}
        {equipment.specifications && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Specifications</h3>
            <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {equipment.specifications}
            </pre>
          </div>
        )}

        {/* Description */}
        {equipment.description && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
            <p className="text-sm text-gray-700">{equipment.description}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {canBook && equipment.status === 'AVAILABLE' && (
            <button
              onClick={() => setShowBookForm(!showBookForm)}
              className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 font-medium cursor-pointer"
            >
              <Calendar size={16} />
              Book
            </button>
          )}
          {canJoinWaitlist && equipment.status === 'BOOKED' && (
            <button
              onClick={handleJoinWaitlist}
              className="flex items-center gap-1 bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 font-medium cursor-pointer"
            >
              Join Waitlist
            </button>
          )}
          {canScheduleMaint && (
            <button
              onClick={() => {
                setShowMaintenanceForm(!showMaintenanceForm);
                if (!showMaintenanceForm) loadTechnicians();
              }}
              className="flex items-center gap-1 bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700 font-medium cursor-pointer"
            >
              <Wrench size={16} />
              Schedule Maintenance
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              className="flex items-center gap-1 bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 font-medium cursor-pointer"
            >
              <Edit size={16} />
              Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 font-medium cursor-pointer"
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookForm && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Book Equipment</h3>
          <form onSubmit={handleBook} className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={bookForm.startTime}
                  onChange={(e) =>
                    setBookForm({ ...bookForm, startTime: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={bookForm.endTime}
                  onChange={(e) =>
                    setBookForm({ ...bookForm, endTime: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose
              </label>
              <textarea
                value={bookForm.purpose}
                onChange={(e) =>
                  setBookForm({ ...bookForm, purpose: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                rows={2}
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 font-medium cursor-pointer"
              >
                Submit Booking
              </button>
              <button
                type="button"
                onClick={() => setShowBookForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300 font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Maintenance Form */}
      {showMaintenanceForm && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Schedule Maintenance</h3>
          <form onSubmit={handleScheduleMaintenance} className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={maintForm.scheduledDate}
                  onChange={(e) =>
                    setMaintForm({ ...maintForm, scheduledDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Technician
                </label>
                <select
                  value={maintForm.technicianId}
                  onChange={(e) =>
                    setMaintForm({ ...maintForm, technicianId: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="">Select Technician</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.department?.name})
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
                value={maintForm.description}
                onChange={(e) =>
                  setMaintForm({ ...maintForm, description: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                rows={2}
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700 font-medium cursor-pointer"
              >
                Schedule
              </button>
              <button
                type="button"
                onClick={() => setShowMaintenanceForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300 font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form */}
      {showEditForm && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Edit Equipment</h3>
          <form onSubmit={handleEdit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={editForm.category || ''}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <input
                type="text"
                value={editForm.manufacturer || ''}
                onChange={(e) => setEditForm({ ...editForm, manufacturer: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                value={editForm.model || ''}
                onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
              <input
                type="text"
                value={editForm.roomNumber || ''}
                onChange={(e) => setEditForm({ ...editForm, roomNumber: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={editForm.status || ''}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="AVAILABLE">Available</option>
                <option value="BOOKED">Booked</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <input
                  type="checkbox"
                  checked={editForm.isRestricted || false}
                  onChange={(e) => setEditForm({ ...editForm, isRestricted: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Restricted Equipment
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <input
                  type="checkbox"
                  checked={editForm.isShared || false}
                  onChange={(e) => setEditForm({ ...editForm, isShared: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Shared (Inter-Institution)
              </label>
            </div>
            <div>{/* Spacer */}</div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
              <textarea
                value={editForm.specifications || ''}
                onChange={(e) => setEditForm({ ...editForm, specifications: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 font-medium cursor-pointer"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300 font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
