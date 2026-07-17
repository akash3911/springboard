import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import RoleBadge from '../components/RoleBadge';
import { Trash2, Key, Edit, Plus, X } from 'lucide-react';

export default function Users() {
  const { user } = { user: JSON.parse(localStorage.getItem('user')) }; // Get fresh user state
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  
  // Modals / forms state
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPwdForm, setShowPwdForm] = useState(null); // stores user object to reset pwd
  const [showEditForm, setShowEditForm] = useState(null); // stores user object to edit

  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    departmentId: '',
    institutionId: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    departmentId: '',
    institutionId: '',
  });

  const [pwdForm, setPwdForm] = useState({
    password: '',
  });

  const role = user?.role;
  const isSysAdmin = role === 'SYSTEM_ADMIN';
  const isInstHead = role === 'INSTITUTION_HEAD';
  const isDeptHead = role === 'DEPARTMENT_HEAD';
  const isLabMgr = role === 'LAB_MANAGER';

  // Allowed roles for creation based on current role permissions
  const getAllowedRolesForCreation = () => {
    if (isSysAdmin) {
      return ['SYSTEM_ADMIN', 'INSTITUTION_HEAD', 'DEPARTMENT_HEAD', 'LAB_MANAGER', 'LAB_TECHNICIAN', 'RESEARCHER', 'STUDENT'];
    }
    if (isInstHead) {
      return ['DEPARTMENT_HEAD', 'LAB_MANAGER', 'LAB_TECHNICIAN', 'RESEARCHER', 'STUDENT'];
    }
    if (isDeptHead) {
      return ['LAB_MANAGER', 'LAB_TECHNICIAN', 'RESEARCHER', 'STUDENT'];
    }
    if (isLabMgr) {
      return ['LAB_TECHNICIAN', 'RESEARCHER', 'STUDENT'];
    }
    return [];
  };

  const allowedRolesForCreation = getAllowedRolesForCreation();

  // Allowed roles for modification
  const getAllowedRolesForModification = (targetUser) => {
    if (isSysAdmin) return ['SYSTEM_ADMIN', 'INSTITUTION_HEAD', 'DEPARTMENT_HEAD', 'LAB_MANAGER', 'LAB_TECHNICIAN', 'RESEARCHER', 'STUDENT'];
    if (isInstHead) return ['DEPARTMENT_HEAD', 'LAB_MANAGER', 'LAB_TECHNICIAN', 'RESEARCHER', 'STUDENT'];
    if (isDeptHead) return ['LAB_MANAGER', 'LAB_TECHNICIAN', 'RESEARCHER', 'STUDENT'];
    if (isLabMgr) return ['LAB_TECHNICIAN', 'RESEARCHER', 'STUDENT'];
    return [];
  };

  useEffect(() => {
    loadUsers();
    loadDepartments();
    loadInstitutions();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users');
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (isSysAdmin) {
        setDepartments(res.data);
      } else {
        // Restrict to their own institution
        const instId = user?.department?.institution?.id || user?.institution?.id;
        setDepartments(res.data.filter((d) => d.institution?.id === instId));
      }
    } catch {
      // ignore
    }
  };

  const loadInstitutions = async () => {
    try {
      const res = await api.get('/institutions');
      setInstitutions(res.data);
    } catch {
      // ignore
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      // Determine college/institution id
      let instId = addForm.institutionId;
      if (!isSysAdmin) {
        instId = user?.institution?.id || user?.department?.institution?.id;
      }

      if (!instId) {
        toast.error('College is required');
        return;
      }

      const payload = {
        name: addForm.name,
        email: addForm.email,
        password: addForm.password,
        role: addForm.role,
        departmentId: addForm.role === 'STUDENT' ? null : (addForm.departmentId ? Number(addForm.departmentId) : null),
        institutionId: Number(instId),
      };

      await api.post('/users', payload);
      toast.success('User created successfully');
      setShowAddForm(false);
      setAddForm({ name: '', email: '', password: '', role: '', departmentId: '', institutionId: '' });
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleEditClick = (u) => {
    setShowEditForm(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      departmentId: u.department?.id || '',
      institutionId: u.institution?.id || u.department?.institution?.id || '',
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      let instId = editForm.institutionId;
      if (!isSysAdmin) {
        instId = user?.institution?.id || user?.department?.institution?.id;
      }

      const payload = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        departmentId: editForm.role === 'STUDENT' ? null : (editForm.departmentId ? Number(editForm.departmentId) : null),
        institutionId: instId ? Number(instId) : null,
      };
      await api.put(`/users/${showEditForm.id}`, payload);
      toast.success('User updated successfully');
      setShowEditForm(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${showPwdForm.id}/password`, { password: pwdForm.password });
      toast.success('Password reset successfully');
      setShowPwdForm(null);
      setPwdForm({ password: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const canManageUser = (targetUser) => {
    if (targetUser.id === user.id) return false; // Cannot manage self
    if (isSysAdmin) return true;

    const myInstId = user?.institution?.id || user?.department?.institution?.id;
    const targetInstId = targetUser.institution?.id || targetUser.department?.institution?.id;

    if (targetInstId !== myInstId) return false; // Restrict to same institution

    if (isInstHead && targetUser.role !== 'SYSTEM_ADMIN') return true;

    // Dept Head and Lab Manager can manage users in their department except roles equal/higher than theirs
    const myDeptId = user?.department?.id;
    const targetDeptId = targetUser.department?.id;

    if (isDeptHead && targetDeptId === myDeptId && ['LAB_MANAGER', 'LAB_TECHNICIAN', 'RESEARCHER', 'STUDENT'].includes(targetUser.role)) return true;
    if (isLabMgr && targetDeptId === myDeptId && ['LAB_TECHNICIAN', 'RESEARCHER', 'STUDENT'].includes(targetUser.role)) return true;

    // If target is student at the same institution (students have no department_id), Inst Head can manage them
    if (isInstHead && targetUser.role === 'STUDENT') return true;

    return false;
  };

  // Filtered departments for creation
  const addFormFilteredDepts = departments.filter(
    (d) => !addForm.institutionId || d.institution?.id === Number(addForm.institutionId)
  );

  // Filtered departments for modification
  const editFormFilteredDepts = departments.filter(
    (d) => !editForm.institutionId || d.institution?.id === Number(editForm.institutionId)
  );

  const getInstitutionName = (u) => {
    return u.institution?.name || u.department?.institution?.name || 'N/A';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-sm text-gray-500">Manage portal users, roles, and profiles</p>
        </div>
        {allowedRolesForCreation.length > 0 && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 font-medium cursor-pointer"
          >
            <Plus size={16} /> Add User
          </button>
        )}
      </div>

      {/* Add User Modal */}
      {showAddForm && (
        <div className="bg-white p-6 rounded border border-gray-200 shadow-sm max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Add New User</h2>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value, departmentId: '', institutionId: '' })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">Select Role</option>
                {allowedRolesForCreation.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* College/Institution Selection */}
            {isSysAdmin ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">College *</label>
                <select
                  value={addForm.institutionId}
                  onChange={(e) => setAddForm({ ...addForm, institutionId: e.target.value, departmentId: '' })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select College</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                <div className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 font-medium">
                  {user?.institution?.name || user?.department?.institution?.name}
                </div>
              </div>
            )}

            {/* Department Selection - Hidden if Student */}
            {addForm.role !== 'STUDENT' && addForm.role !== '' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                {(!isSysAdmin && !isInstHead) ? (
                  <div className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 font-medium">
                    {user?.department?.name}
                  </div>
                ) : (
                  <select
                    value={addForm.departmentId}
                    onChange={(e) => setAddForm({ ...addForm, departmentId: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {addFormFilteredDepts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="col-span-2 flex gap-2 mt-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 font-medium cursor-pointer"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300 font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditForm && (
        <div className="bg-white p-6 rounded border border-gray-200 shadow-sm max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Edit User Details</h2>
            <button onClick={() => setShowEditForm(null)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleEditSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value, departmentId: '' })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
                required
              >
                {getAllowedRolesForModification(showEditForm).map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* College/Institution Selection */}
            {isSysAdmin ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">College *</label>
                <select
                  value={editForm.institutionId}
                  onChange={(e) => setEditForm({ ...editForm, institutionId: e.target.value, departmentId: '' })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select College</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                <div className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 font-medium">
                  {user?.institution?.name || user?.department?.institution?.name}
                </div>
              </div>
            )}

            {/* Department Selection - Hidden if Student */}
            {editForm.role !== 'STUDENT' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                {(!isSysAdmin && !isInstHead) ? (
                  <div className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 font-medium">
                    {showEditForm.department?.name || 'N/A'}
                  </div>
                ) : (
                  <select
                    value={editForm.departmentId}
                    onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {editFormFilteredDepts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="col-span-2 flex gap-2 mt-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 font-medium cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowEditForm(null)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300 font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPwdForm && (
        <div className="bg-white p-6 rounded border border-gray-200 shadow-sm max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Reset Password for {showPwdForm.name}</h2>
            <button onClick={() => setShowPwdForm(null)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={pwdForm.password}
                onChange={(e) => setPwdForm({ password: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700 font-medium cursor-pointer"
              >
                Reset Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPwdForm(null);
                  setPwdForm({ password: '' });
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300 font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Department (College)</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u, idx) => (
              <tr
                key={u.id}
                className={`border-b border-gray-100 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {u.department?.name || 'Student (No Dept)'} ({getInstitutionName(u)})
                </td>
                <td className="px-4 py-3 text-right">
                  {canManageUser(u) ? (
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleEditClick(u)}
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5 cursor-pointer"
                        title="Edit User"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setShowPwdForm(u);
                        }}
                        className="text-yellow-600 hover:text-yellow-800 font-medium flex items-center gap-0.5 cursor-pointer"
                        title="Reset Password"
                      >
                        <Key size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-red-600 hover:text-red-800 font-medium flex items-center gap-0.5 cursor-pointer"
                        title="Delete User"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">No permissions</span>
                  )}
                </td>
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
