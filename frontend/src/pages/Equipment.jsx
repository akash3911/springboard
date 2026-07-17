import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search } from 'lucide-react';

const statusColors = {
  AVAILABLE: 'bg-green-100 text-green-700',
  BOOKED: 'bg-blue-100 text-blue-700',
  UNDER_MAINTENANCE: 'bg-yellow-100 text-yellow-700',
  OUT_OF_SERVICE: 'bg-red-100 text-red-700',
};

export default function Equipment() {
  const { user } = { user: JSON.parse(localStorage.getItem('user')) }; // Get fresh user state
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [addForm, setAddForm] = useState({
    name: '',
    category: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    status: 'AVAILABLE',
    roomNumber: '',
    contactEmail: user?.email || '',
    purchaseDate: '',
    specifications: '',
    description: '',
    isShared: false,
    isRestricted: false,
    departmentId: user?.role === 'LAB_MANAGER' ? user?.department?.id || '' : '',
  });

  const canManage = ['LAB_MANAGER', 'DEPARTMENT_HEAD', 'INSTITUTION_HEAD', 'SYSTEM_ADMIN'].includes(user?.role);
  const hideTagsRoles = ['STUDENT', 'RESEARCHER'];
  const showTags = !hideTagsRoles.includes(user?.role);

  useEffect(() => {
    loadEquipment();
    if (canManage) {
      loadDepartments();
    }
  }, []);

  const loadEquipment = async () => {
    try {
      const res = await api.get('/equipment');
      setEquipment(res.data);
      const cats = [...new Set(res.data.map((e) => e.category).filter(Boolean))];
      setCategories(cats);
    } catch (err) {
      toast.error('Failed to load equipment');
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await api.get('/departments');
      // If Lab Manager, limit departments to their own department
      if (user?.role === 'LAB_MANAGER') {
        setDepartments(res.data.filter(d => d.id === user?.department?.id));
      } else if (user?.role === 'DEPARTMENT_HEAD') {
        setDepartments(res.data.filter(d => d.id === user?.department?.id));
      } else if (user?.role === 'INSTITUTION_HEAD') {
        setDepartments(res.data.filter(d => d.institution?.id === user?.department?.institution?.id));
      } else {
        setDepartments(res.data);
      }
    } catch {
      // ignore
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...addForm,
        departmentId: addForm.departmentId ? Number(addForm.departmentId) : undefined,
      };
      await api.post('/equipment', payload);
      toast.success('Equipment added');
      setShowAddForm(false);
      setAddForm({
        name: '',
        category: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        status: 'AVAILABLE',
        roomNumber: '',
        contactEmail: user?.email || '',
        purchaseDate: '',
        specifications: '',
        description: '',
        isShared: false,
        isRestricted: false,
        departmentId: user?.role === 'LAB_MANAGER' ? user?.department?.id || '' : '',
      });
      loadEquipment();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add equipment');
    }
  };

  const filtered = equipment.filter((e) => {
    // 1. Role-based visibility rules
    if (user?.role === 'STUDENT') {
      // Students can ONLY view available (or booked/under-maint) equipment in their OWN department
      if (e.department?.id !== user?.department?.id) return false;
      // Cannot access restricted equipment
      if (e.isRestricted) return false;
    } else if (user?.role === 'RESEARCHER') {
      // Researchers can view equipment in their OWN institution
      const isSameInst = e.department?.institution?.id === user?.department?.institution?.id;
      // Researchers can view external (other institution) equipment ONLY if it is marked as shared
      const isShared = e.isShared;
      if (!isSameInst && !isShared) return false;
      // Note: Researchers CAN view restricted equipment (within their institution or if shared)
    } else if (user?.role === 'LAB_TECHNICIAN') {
      // Techs view in their institution
      const isSameInst = e.department?.institution?.id === user?.department?.institution?.id;
      if (!isSameInst) return false;
    } else if (user?.role === 'LAB_MANAGER') {
      // Lab managers can view equipment in their department (to manage) or their institution
      const isSameInst = e.department?.institution?.id === user?.department?.institution?.id;
      if (!isSameInst) return false;
    } else if (user?.role === 'DEPARTMENT_HEAD') {
      // Dept heads view all department equipment
      if (e.department?.id !== user?.department?.id) return false;
    } else if (user?.role === 'INSTITUTION_HEAD') {
      // Inst heads view all equipment in their institution
      const isSameInst = e.department?.institution?.id === user?.department?.institution?.id;
      if (!isSameInst) return false;
    }
    // SYSTEM_ADMIN sees everything

    const matchSearch =
      !search ||
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.model?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || e.status === statusFilter;
    const matchCategory = !categoryFilter || e.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Equipment</h2>
        {canManage && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
          >
            <Plus size={16} />
            Add Equipment
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="BOOKED">Booked</option>
          <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          <option value="OUT_OF_SERVICE">Out of Service</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Add Equipment Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Add New Equipment</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={addForm.category}
                onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <input
                type="text"
                value={addForm.manufacturer}
                onChange={(e) => setAddForm({ ...addForm, manufacturer: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                value={addForm.model}
                onChange={(e) => setAddForm({ ...addForm, model: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
              <input
                type="text"
                value={addForm.serialNumber}
                onChange={(e) => setAddForm({ ...addForm, serialNumber: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
              <input
                type="text"
                value={addForm.roomNumber}
                onChange={(e) => setAddForm({ ...addForm, roomNumber: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={addForm.contactEmail}
                onChange={(e) => setAddForm({ ...addForm, contactEmail: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
              <input
                type="date"
                value={addForm.purchaseDate}
                onChange={(e) => setAddForm({ ...addForm, purchaseDate: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              {user?.role === 'LAB_MANAGER' ? (
                <div className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 font-medium">
                  {user?.department?.name}
                </div>
              ) : (
                <select
                  value={addForm.departmentId}
                  onChange={(e) => setAddForm({ ...addForm, departmentId: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.institution?.name})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-center gap-4 mt-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <input
                  type="checkbox"
                  checked={addForm.isRestricted}
                  onChange={(e) => setAddForm({ ...addForm, isRestricted: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Restricted Equipment
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <input
                  type="checkbox"
                  checked={addForm.isShared}
                  onChange={(e) => setAddForm({ ...addForm, isShared: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Shared (Inter-Institution)
              </label>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
              <textarea
                value={addForm.specifications}
                onChange={(e) => setAddForm({ ...addForm, specifications: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                Add Equipment
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((eq) => {
          const isExternal = eq.department?.institution?.id !== user?.department?.institution?.id;
          return (
            <div
              key={eq.id}
              onClick={() => navigate(`/equipment/${eq.id}`)}
              className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{eq.name}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      statusColors[eq.status] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {eq.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-1">Model: {eq.model || 'N/A'}</p>
                <p className="text-sm text-gray-500 mb-2">Room: {eq.roomNumber || 'N/A'}</p>
              </div>

              {showTags && (
                <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-100">
                  {eq.isRestricted && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                      Restricted
                    </span>
                  )}
                  {eq.isShared && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-200">
                      Shared
                    </span>
                  )}
                  {isExternal && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200">
                      External ({eq.department?.institution?.name})
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-500 mt-8">No equipment found</p>
      )}
    </div>
  );
}
