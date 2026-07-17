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
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    departmentId: '',
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
    // Cannot promote above themselves
    if (isSysAdmin) return ['SYSTEM_ADMIN', 'INSTITUTION_HEAD', 'DEPARTMENT_HEAD', 'LAB_MANAGER', 'LAB_TECHNICIAN', 'RESEARCHER', 'STUDENT'];
    if (isInstHead) return ['DEPARTMENT_HEAD', 'LAB_MANAGER', 'LAB_TECHNICIAN', 'RESEARCHER', 'STUDENT'];
    if (isDeptHead) return ['LAB_MANAGER', 'LAB_TECHNICIAN', 'RESEARCHER', 'STUDENT'];
    if (isLabMgr) return ['LAB_TECHNICIAN', 'RESEARCHER', 'STUDENT'];
    return [];
  };

  useEffect(() => {
    loadUsers();
    loadDepartments();
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
        const instId = user?.department?.institution?.id;
        setDepartments(res.data.filter((d) => d.institution?.id === instId));
      }
    } catch {
      // ignore
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      // Auto pre-fill department for manager/dept head if not SysAdmin/InstHead
      let deptId = addForm.departmentId;
      if ((isLabMgr || isDeptHead) && user?.department?.id) {
        deptId = user.department.id;
      }
      
      const payload = {
        name: addForm.name,
        email: addForm.email,
        password: addForm.password,
        role: addForm.role,
        departmentId: deptId ? Number(deptId) : undefined,
      };

      await api.post('/users', payload);
      toast.success('User created successfully');
      setShowAddForm(false);
      setAddForm({ name: '', email: '', password: '', role: '', departmentId: '' });
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // First update core fields
      const payload = {
        name: editForm.name,
        email: editForm.email,
        departmentId: editForm.departmentId ? Number(editForm.departmentId) : undefined,
      };
      await api.put(`/users/${showEditForm.id}`, payload);

      // Next update role if allowed
      if (editForm.role && editForm.role !== showEditForm.role) {
        await api.put(`/users/${showEditForm.id}/role`, { role: editForm.role });
      }

      toast.success('User updated successfully');
      setShowEditForm(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
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
      toast.success('User deleted');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const canManageUser = (targetUser) => {
    if (user?.id === targetUser.id) return false; // cannot delete/edit self here
    if (isSysAdmin) return true;
    
    // Institution Head can manage all users in their institution except SYSTEM_ADMIN
    const targetInstId = targetUser.department?.institution?.id;
    const myInstId = user?.department?.institution?.id;
    if (isInstHead && targetInstId === myInstId && targetUser.role !== 'SYSTEM_ADMIN') return true;

    // Dept Head and Lab Manager can manage users in their department except roles equal/higher than theirs
    const targetDeptId = targetUser.department?.id;
    const myDeptId = user?.department?.id;
    if (isDeptHead && targetDeptId === myDeptId && ['LAB_MANAGER', 'LAB_TECHNICIAN', 'RESEARCHER', 'STUDENT'].includes(targetUser.role)) return true;
    if (isLabMgr && targetDeptId === myDeptId && ['LAB_TECHNICIAN', 'RESEARCHER', 'STUDENT'].includes(targetUser.role)) return true;

    return false;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 font-sans">Users</h2>
        {allowedRolesForCreation.length > 0 && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 font-medium cursor-pointer"
          >
            <Plus size={16} />
            Create User
          </button>
        )}
      </div>

      {/* Add User Modal form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 relative">
          <button
            onClick={() => setShowAddForm(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X size={18} />
          </button>
          <h3 className="text-lg font-semibold mb-3">Create New User</h3>
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
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              {(isLabMgr || isDeptHead) ? (
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
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.institution?.name})
                    </option>
                  ))}
                </select>
              )}
            </div>
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

      {/* Edit User Modal form */}
      {showEditForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 relative">
          <button
            onClick={() => setShowEditForm(null)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X size={18} />
          </button>
          <h3 className="text-lg font-semibold mb-3">Edit User ({showEditForm.email})</h3>
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
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              {(isLabMgr || isDeptHead) ? (
                <div className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 font-medium">
                  {showEditForm.department?.name}
                </div>
              ) : (
                <select
                  value={editForm.departmentId}
                  onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
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

      {/* Password Reset Modal form */}
      {showPwdForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 relative">
          <button
            onClick={() => setShowPwdForm(null)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X size={18} />
          </button>
          <h3 className="text-lg font-semibold mb-3 font-sans">Reset Password for {showPwdForm.name} ({showPwdForm.email})</h3>
          <form onSubmit={handleResetPasswordSubmit} className="space-y-3 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={pwdForm.password}
                onChange={(e) => setPwdForm({ password: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
                placeholder="Enter new password"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 font-medium cursor-pointer"
              >
                Reset Password
              </button>
              <button
                type="button"
                onClick={() => setShowPwdForm(null)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300 font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
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
                <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {u.department?.name || 'N/A'} {u.department?.institution ? `(${u.department.institution.name})` : ''}
                </td>
                <td className="px-4 py-3 text-right">
                  {canManageUser(u) ? (
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setShowEditForm(u);
                          setEditForm({
                            name: u.name,
                            email: u.email,
                            role: u.role,
                            departmentId: u.department?.id || '',
                          });
                        }}
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
