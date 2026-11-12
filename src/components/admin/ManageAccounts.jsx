import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Key, Check, X, Eye, EyeOff } from 'lucide-react';

const ManageAccounts = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .neq('role', 'admin')
      .order('created_at', { ascending: false });
    
    if (!error) setUsers(data || []);
    setLoading(false);
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id_number?.includes(searchTerm)
  );

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Update password using Supabase Auth Admin API
      const { error } = await supabase.auth.admin.updateUserById(
        selectedUser.id,
        { password: newPassword }
      );

      if (error) throw error;

      // If user is not yet approved, approve them
      if (!selectedUser.is_approved) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ is_approved: true })
          .eq('id', selectedUser.id);

        if (updateError) throw updateError;
      }

      setPasswordSuccess(`✅ Password set successfully for ${selectedUser.full_name}!`);
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      
      // Refresh users list
      fetchUsers();

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 3000);

    } catch (error) {
      console.error('Error setting password:', error);
      setPasswordError('Failed to set password: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    setShowPassword(false);
    setShowPasswordModal(true);
  };

  const handleApproveUser = async (userId) => {
    if (!confirm('Approve this user?')) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_approved: true })
        .eq('id', userId);
      
      if (error) throw error;
      alert('✅ User approved successfully!');
      fetchUsers();
    } catch (error) {
      alert('Error approving user: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      alert('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      alert('Error deleting user: ' + error.message);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-['Poppins'] font-bold text-white">👥 Manage Accounts</h2>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gym-primary transition"
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-4xl mb-4">👥</p>
          <p className="text-gray-400">No users found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">ID #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3 font-mono text-sm text-gray-300">{u.id_number || 'N/A'}</td>
                  <td className="px-4 py-3 text-white">
                    {u.last_name}, {u.first_name} {u.middle_name} {u.suffix}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.role === 'employee' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.is_approved ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {u.is_approved ? '✅ Approved' : '⏳ Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {/* Set Password Button - Always visible */}
                      <button
                        onClick={() => openPasswordModal(u)}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl transition"
                        title="Set Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>

                      {/* Approve Button - Only for pending users */}
                      {!u.is_approved && (
                        <button
                          onClick={() => handleApproveUser(u.id)}
                          className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-xl transition"
                          title="Approve User"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete Button - Except for employee role */}
                      {u.role !== 'employee' && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition"
                          title="Delete User"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gym-dark border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-['Poppins'] font-bold text-white mb-2">
              Set Password for {selectedUser.full_name}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {selectedUser.is_approved 
                ? 'Update password for this user.' 
                : '⚠️ Setting password will also approve this user.'}
            </p>

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-sm">
                {passwordSuccess}
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">New Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gym-primary transition pr-10"
                    placeholder="Enter new password"
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gym-primary transition"
                  placeholder="Confirm new password"
                  required
                  minLength="6"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  className="px-4 py-2 border border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-white/40 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gym-primary text-white rounded-xl hover:bg-gym-secondary transition disabled:opacity-50"
                >
                  {loading ? 'Setting...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAccounts;