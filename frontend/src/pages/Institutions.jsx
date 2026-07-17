import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export default function Institutions() {
  const [institutions, setInstitutions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/institutions');
      setInstitutions(res.data);
    } catch (err) {
      toast.error('Failed to load institutions');
    }
  };

  const resetForm = () => {
    setForm({ name: '', address: '', email: '', phone: '' });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/institutions/${editId}`, form);
        toast.success('Institution updated');
      } else {
        await api.post('/institutions', form);
        toast.success('Institution added');
      }
      resetForm();
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save institution');
    }
  };

  const handleEdit = (inst) => {
    setForm({
      name: inst.name || '',
      address: inst.address || '',
      email: inst.email || '',
      phone: inst.phone || '',
    });
    setEditId(inst.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this institution?')) return;
    try {
      await api.delete(`/institutions/${id}`);
      toast.success('Institution deleted');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Institutions</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Institution
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">
              {editId ? 'Edit Institution' : 'Add Institution'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                {editId ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Address</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {institutions.map((inst, idx) => (
              <tr
                key={inst.id}
                className={`border-b border-gray-100 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="px-4 py-3">{inst.id}</td>
                <td className="px-4 py-3">{inst.name}</td>
                <td className="px-4 py-3 text-gray-500">{inst.address || 'N/A'}</td>
                <td className="px-4 py-3 text-gray-500">{inst.email || 'N/A'}</td>
                <td className="px-4 py-3 text-gray-500">{inst.phone || 'N/A'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(inst)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(inst.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {institutions.length === 0 && (
          <p className="text-center text-gray-500 py-8">No institutions found</p>
        )}
      </div>
    </div>
  );
}
