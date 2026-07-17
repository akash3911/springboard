import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';

export default function Departments() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', institutionId: '' });

  const isAdmin = user?.role === 'SYSTEM_ADMIN';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      toast.error('Failed to load departments');
    }
    if (isAdmin) {
      try {
        const res = await api.get('/institutions');
        setInstitutions(res.data);
      } catch {
        // ignore
      }
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/departments', {
        name: form.name,
        institutionId: form.institutionId ? Number(form.institutionId) : undefined,
      });
      toast.success('Department added');
      setShowForm(false);
      setForm({ name: '', institutionId: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add department');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await api.delete(`/departments/${id}`);
      toast.success('Department deleted');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Departments</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Department
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Add Department</h3>
          <form onSubmit={handleAdd} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                required
              />
            </div>
            {isAdmin && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Institution
                </label>
                <select
                  value={form.institutionId}
                  onChange={(e) => setForm({ ...form, institutionId: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="">Select Institution</option>
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Institution</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d, idx) => (
              <tr
                key={d.id}
                className={`border-b border-gray-100 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="px-4 py-3">{d.id}</td>
                <td className="px-4 py-3">{d.name}</td>
                <td className="px-4 py-3 text-gray-500">
                  {d.institution?.name || 'N/A'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {departments.length === 0 && (
          <p className="text-center text-gray-500 py-8">No departments found</p>
        )}
      </div>
    </div>
  );
}
