import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search, Building2 } from 'lucide-react';

const statusColors = {
  AVAILABLE: 'bg-green-100 text-green-700 border border-green-200',
  BOOKED: 'bg-blue-100 text-blue-700 border border-blue-200',
  BOOKING_PENDING: 'bg-amber-100 text-amber-800 border border-amber-200',
  UNDER_MAINTENANCE: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  OUT_OF_SERVICE: 'bg-red-100 text-red-700 border border-red-200',
};

export default function Equipment() {
  const { user } = { user: JSON.parse(localStorage.getItem('user')) }; // Get fresh user state
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
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
    isShared: true,
    isRestricted: false,
    departmentId: user?.role === 'LAB_MANAGER' ? user?.department?.id || '' : '',
  });

  const isLabManager = user?.role === 'LAB_MANAGER';
  const canManage = ['LAB_MANAGER', 'DEPARTMENT_HEAD', 'INSTITUTION_HEAD', 'SYSTEM_ADMIN'].includes(user?.role);

  useEffect(() => {
    loadEquipment();
    loadInstitutions();
    loadDepartments();
  }, []);

  useEffect(() => {
    setDepartmentFilter('');
  }, [institutionFilter]);

  const loadEquipment = async () => {
    try {
      const res = await api.get('/equipment');
      setEquipment(res.data);
    } catch (err) {
      toast.error('Failed to load equipment');
    }
  };

  const loadInstitutions = async () => {
    try {
      const res = await api.get('/institutions');
      setInstitutions(Array.isArray(res.data) ? res.data : []);
    } catch {
      setInstitutions([]);
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (user?.role === 'LAB_MANAGER' || user?.role === 'DEPARTMENT_HEAD') {
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
        isShared: true,
        isRestricted: false,
        departmentId: user?.role === 'LAB_MANAGER' ? user?.department?.id || '' : '',
      });
      loadEquipment();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add equipment');
    }
  };

  const filtered = equipment.filter((e) => {
    // Lab Manager strictly sees ONLY equipment in their lab
    if (isLabManager) {
      if (e.department?.id !== user?.department?.id) return false;
    }

    // Hide restricted equipment from students
    if (user?.role === 'STUDENT' && e.isRestricted) {
      return false;
    }

    const matchSearch =
      !search ||
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.model?.toLowerCase().includes(search.toLowerCase()) ||
      e.manufacturer?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || e.status === statusFilter;
    const matchDepartment = !departmentFilter || e.department?.id === Number(departmentFilter);
    
    const eqInstId = e.department?.institution?.id;
    const matchInstitution = !institutionFilter || eqInstId === Number(institutionFilter);

    return matchSearch && matchStatus && matchDepartment && matchInstitution;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isLabManager ? 'My Lab Equipment' : 'Equipment Catalog'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {isLabManager
              ? 'Manage inventory, status, and maintenance for your laboratory equipment'
              : 'Explore and book shared research equipment across all partner institutions'}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 font-medium cursor-pointer"
          >
            <Plus size={16} />
            Add Equipment
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search equipment, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Institution Filter (Hidden for Lab Manager) */}
        {!isLabManager && (
          <select
            value={institutionFilter}
            onChange={(e) => setInstitutionFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Colleges & Institutions</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>
        )}

        {/* Department Filter */}
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Departments</option>
          {(() => {
            const displayedDepartments = institutionFilter
              ? departments.filter(d => d.institution?.id === Number(institutionFilter))
              : departments;
            return displayedDepartments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} {!institutionFilter && dept.institution?.name ? `(${dept.institution.name})` : ''}
              </option>
            ));
          })()}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="BOOKING_PENDING">BOOKING PENDING</option>
          <option value="BOOKED">BOOKED</option>
          <option value="UNDER_MAINTENANCE">UNDER MAINTENANCE</option>
          <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
        </select>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Add New Equipment</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                required
                placeholder="e.g. Fabrication, Optics, Biology"
                value={addForm.category}
                onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Manufacturer</label>
              <input
                type="text"
                required
                value={addForm.manufacturer}
                onChange={(e) => setAddForm({ ...addForm, manufacturer: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                required
                value={addForm.model}
                onChange={(e) => setAddForm({ ...addForm, model: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Serial Number</label>
              <input
                type="text"
                value={addForm.serialNumber}
                onChange={(e) => setAddForm({ ...addForm, serialNumber: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Room Number</label>
              <input
                type="text"
                value={addForm.roomNumber}
                onChange={(e) => setAddForm({ ...addForm, roomNumber: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={addForm.contactEmail}
                onChange={(e) => setAddForm({ ...addForm, contactEmail: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
              <select
                value={addForm.departmentId}
                onChange={(e) => setAddForm({ ...addForm, departmentId: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.institution?.name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Image URL</label>
              <input
                type="text"
                placeholder="https://..."
                value={addForm.imageUrl || ''}
                onChange={(e) => setAddForm({ ...addForm, imageUrl: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Date</label>
              <input
                type="date"
                value={addForm.purchaseDate}
                onChange={(e) => setAddForm({ ...addForm, purchaseDate: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Specifications</label>
              <textarea
                value={addForm.specifications}
                onChange={(e) => setAddForm({ ...addForm, specifications: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                rows={2}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                rows={2}
              />
            </div>
            <div className="col-span-2 flex gap-2 pt-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 font-medium"
              >
                Add Equipment
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300 font-medium"
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
          const instName = eq.department?.institution?.name || 'Partner College';

          return (
            <div
              key={eq.id}
              onClick={() => navigate(`/equipment/${eq.id}`)}
              className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-base">{eq.name}</h3>
                    <p className="text-xs font-medium text-blue-600 flex items-center gap-1 mt-0.5">
                      <Building2 size={12} />
                      {instName}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      statusColors[eq.status] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {eq.status === 'BOOKING_PENDING' ? 'BOOKING PENDING' : eq.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">Model: {eq.model || 'N/A'}</p>
                <p className="text-xs text-gray-500">Room: {eq.roomNumber || 'N/A'}</p>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-500 mt-8">No equipment found matching criteria</p>
      )}
    </div>
  );
}
