import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import RoleBadge from '../components/RoleBadge';
import { Trash2 } from 'lucide-react';

const allRoles = [
  'STUDENT',
  'RESEARCHER',
  'LAB_TECHNICIAN',
  'LAB_MANAGER',
  'DEPARTMENT_HEAD',
  'INSTITUTION_HEAD',
  'SYSTEM_ADMIN',
];

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [editingRole, setEditingRole] = useState({});

  const isAdmin = user?.role === 'SYSTEM_ADMIN';
  const canChangeRole = ['SYSTEM_ADMIN', 'INSTITUTION_HEAD'].includes(user?.role);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      toast.success('Role updated');
      setEditingRole({});
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Users</h2>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
              {canChangeRole && (
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr
                key={u.id}
                className={`border-b border-gray-100 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  {canChangeRole && editingRole[u.id] !== undefined ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={editingRole[u.id]}
                        onChange={(e) =>
                          setEditingRole({ ...editingRole, [u.id]: e.target.value })
                        }
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                      >
                        {allRoles.map((r) => (
                          <option key={r} value={r}>
                            {r.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRoleChange(u.id, editingRole[u.id])}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          const newEditing = { ...editingRole };
                          delete newEditing[u.id];
                          setEditingRole(newEditing);
                        }}
                        className="text-gray-500 text-xs hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div
                      className={canChangeRole ? 'cursor-pointer' : ''}
                      onClick={() =>
                        canChangeRole &&
                        setEditingRole({ ...editingRole, [u.id]: u.role })
                      }
                    >
                      <RoleBadge role={u.role} />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {u.department?.name || 'N/A'}
                </td>
                {canChangeRole && (
                  <td className="px-4 py-3">
                    {isAdmin && u.id !== user?.id && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="text-center text-gray-500 py-8">No users found</p>
        )}
      </div>
    </div>
  );
}
