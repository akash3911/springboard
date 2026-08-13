import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  Building2,
  Landmark,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();

  // Personal Info Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gmail, setGmail] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Security / Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const res = await api.get('/users/me');
      if (res.data) {
        setName(res.data.name || '');
        setEmail(res.data.email || '');
        setGmail(res.data.gmail || '');
        updateUser({
          name: res.data.name,
          email: res.data.email,
          gmail: res.data.gmail,
        });
      }
    } catch {
      // Fallback to auth context cached user info
      if (user) {
        setName(user.name || '');
        setEmail(user.email || '');
        setGmail(user.gmail || '');
      }
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    if (!email.trim()) {
      toast.error('Email address cannot be empty');
      return;
    }

    setLoadingProfile(true);
    try {
      const res = await api.put('/users/me', {
        name: name.trim(),
        email: email.trim(),
        gmail: gmail.trim() || '',
      });

      updateUser({
        name: res.data?.name || name.trim(),
        email: res.data?.email || email.trim(),
        gmail: res.data?.gmail || (gmail.trim() ? gmail.trim() : null),
      });

      toast.success('Profile details updated successfully!');
    } catch (err) {
      console.error('Profile update error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to update profile';
      toast.error(msg);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoadingPassword(true);
    try {
      await api.put('/users/me', {
        currentPassword,
        newPassword,
      });

      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password change error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to change password';
      toast.error(msg);
    } finally {
      setLoadingPassword(false);
    }
  };

  const formatRole = (role) => {
    return role?.replace(/_/g, ' ') || 'USER';
  };

  const userDeptName = user?.department?.name || 'General Science';
  const userInstName = user?.department?.institution?.name || user?.institution?.name || 'Main Campus';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600/50 border-2 border-white/30 flex items-center justify-center text-white font-bold text-2xl shadow-inner">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{user?.name}</h1>
              <p className="text-blue-200 text-sm">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-blue-500/40 text-blue-100 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-300/30">
                  {formatRole(user?.role)}
                </span>
                <span className="text-xs text-blue-200 flex items-center gap-1">
                  <Landmark size={12} /> {userInstName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Details Form (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <User className="text-blue-600" size={20} />
              <h2 className="text-lg font-bold text-gray-800">Personal Account Information</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Primary Account Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="primary@institution.edu"
                    required
                  />
                </div>
              </div>

              {/* Optional Gmail Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Gmail Address <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                    <CheckCircle size={12} /> Google SSO Sync
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-2.5 text-red-500 font-bold text-xs">G</div>
                  <input
                    type="email"
                    value={gmail}
                    onChange={(e) => setGmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="yourname@gmail.com"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Link your personal Gmail address to enable Google 1-Click login or receive external notifications.
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loadingProfile}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Save size={16} />
                  {loadingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <KeyRound className="text-amber-600" size={20} />
              <h2 className="text-lg font-bold text-gray-800">Security & Password</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter current password"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="At least 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loadingPassword}
                  className="flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Lock size={16} />
                  {loadingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Info Card (1 Col) */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-600" />
              Role & Affiliation
            </h3>

            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-xs text-gray-500 font-medium">Assigned System Role</div>
                <div className="text-sm font-bold text-gray-800 mt-0.5">{formatRole(user?.role)}</div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <Landmark size={12} /> Institution
                </div>
                <div className="text-sm font-semibold text-gray-800 mt-0.5">{userInstName}</div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <Building2 size={12} /> Department
                </div>
                <div className="text-sm font-semibold text-gray-800 mt-0.5">{userDeptName}</div>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg">
                <div className="text-xs text-blue-800 font-semibold flex items-center gap-1">
                  <AlertCircle size={13} className="text-blue-600" /> Need Role Changes?
                </div>
                <p className="text-[11px] text-blue-700 mt-1">
                  Department or role permissions are managed by your Institution Administrator.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
