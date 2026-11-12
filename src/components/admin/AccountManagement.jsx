import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, Edit, Trash2, Search } from 'lucide-react';

const AccountManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    id_number: '',
    password: '',
    last_name: '',
    first_name: '',
    middle_name: '',
    suffix: '',
    contact_number: '',
    address: '',
    birthdate: '',
    gender: 'Male',
    emergency_contact: '',
    role: 'client'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .neq('role', 'admin')
      .order('created_at', { ascending: false });
    
    if (!error) setUsers(data || []);
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id_number?.includes(searchTerm)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Build full name with suffix
    let fullName = `${formData.last_name}, ${formData.first_name}`;
    if (formData.middle_name) {
      fullName += ` ${formData.middle_name}`;
    }
    if (formData.suffix) {
      fullName += ` ${formData.suffix}`;
    }

    const autoEmail = `${formData.id_number}@gym.com`;

    try {
      if (!/^\d{8}$/.test(formData.id_number)) {
        alert('ID Number must be exactly 8 digits');
        setLoading(false);
        return;
      }

      if (editingUser) {
        const { error } = await supabase
          .from('users')
          .update({
            id_number: formData.id_number,
            last_name: formData.last_name,
            first_name: formData.first_name,
            middle_name: formData.middle_name,
            suffix: formData.suffix,
            full_name: fullName,
            contact_number: formData.contact_number,
            address: formData.address,
            birthdate: formData.birthdate,
            gender: formData.gender,
            emergency_contact: formData.emergency_contact,
            role: formData.role
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        alert('User updated successfully!');
      } else {
        // Check if ID Number already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id_number')
          .eq('id_number', formData.id_number)
          .maybeSingle();

        if (existingUser) {
          alert('ID Number already exists.');
          setLoading(false);
          return;
        }

        // Check if email already exists
        const { data: existingEmail } = await supabase
          .from('users')
          .select('email')
          .eq('email', autoEmail)
          .maybeSingle();

        if (existingEmail) {
          alert('Email already exists.');
          setLoading(false);
          return;
        }

        // Create new user with password
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: autoEmail,
          password: formData.password || 'temp123'
        });

        if (authError) throw authError;

        const { error: userError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            id_number: formData.id_number,
            username: formData.id_number,
            email: autoEmail,
            last_name: formData.last_name,
            first_name: formData.first_name,
            middle_name: formData.middle_name,
            suffix: formData.suffix,
            full_name: fullName,
            contact_number: formData.contact_number,
            address: formData.address,
            birthdate: formData.birthdate,
            gender: formData.gender,
            emergency_contact: formData.emergency_contact,
            role: formData.role,
            is_approved: true
          }]);

        if (userError) throw userError;

        alert(`Account created! Email: ${autoEmail}. Password: ${formData.password}. User can now login.`);
      }

      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      id_number: '',
      password: '',
      last_name: '',
      first_name: '',
      middle_name: '',
      suffix: '',
      contact_number: '',
      address: '',
      birthdate: '',
      gender: 'Male',
      emergency_contact: '',
      role: 'client'
    });
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      id_number: user.id_number || '',
      password: '',
      last_name: user.last_name || '',
      first_name: user.first_name || '',
      middle_name: user.middle_name || '',
      suffix: user.suffix || '',
      contact_number: user.contact_number || '',
      address: user.address || '',
      birthdate: user.birthdate || '',
      gender: user.gender || 'Male',
      emergency_contact: user.emergency_contact || '',
      role: user.role
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this user?')) {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (!error) {
        alert('User deleted!');
        fetchUsers();
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-['Poppins'] font-bold text-white">👥 Account Management</h2>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gym-primary transition"
            />
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-gym-primary text-white px-4 py-2 rounded-xl hover:bg-gym-secondary transition flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" /> Create Account
          </button>
        </div>
      </div>

      {/* User List */}
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
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => handleEdit(u)}
                    className="text-blue-400 hover:text-blue-300 transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="text-red-400 hover:text-red-300 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">No users found.</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gym-dark border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-['Poppins'] font-bold text-white mb-4">
              {editingUser ? 'Edit Account' : 'Create New Account'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Role Selection */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gym-primary transition"
                  required
                >
                  <option value="client">Client</option>
                  <option value="employee">Employee</option>
                </select>
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">ID Number * (8 digits)</label>
                <input
                  type="text"
                  required
                  value={formData.id_number}
                  onChange={(e) => setFormData({...formData, id_number: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gym-primary transition"
                  placeholder="12345678"
                  maxLength="8"
                />
                <p className="text-xs text-gym-primary mt-1">📧 Email: {formData.id_number || '12345678'}@gym.com</p>
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gym-primary transition"
                  placeholder="Dela Cruz"
                />
              </div>

              {/* First Name */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gym-primary transition"
                  placeholder="Juan"
                />
              </div>

              {/* Middle Name */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Middle Name</label>
                <input
                  type="text"
                  value={formData.middle_name}
                  onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gym-primary transition"
                  placeholder="Santos"
                />
              </div>

              {/* Suffix */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Suffix</label>
                <input
                  type="text"
                  value={formData.suffix}
                  onChange={(e) => setFormData({...formData, suffix: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gym-primary transition"
                  placeholder="Jr., Sr., III"
                />
              </div>

              {/* Password - ONLY for new users */}
              {!editingUser && (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gym-primary transition"
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>
              )}

              {/* Contact Number */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Contact Number *</label>
                <input
                  type="text"
                  required
                  value={formData.contact_number}
                  onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gym-primary transition"
                  placeholder="09123456789"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Address *</label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gym-primary transition"
                  rows="2"
                  placeholder="123 Street, Barangay, City"
                />
              </div>

              {/* Birthdate */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Birthdate *</label>
                <input
                  type="date"
                  required
                  value={formData.birthdate}
                  onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gym-primary transition"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gym-primary transition"
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Emergency Contact (Name & Number)</label>
                <input
                  type="text"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gym-primary transition"
                  placeholder="Juan Dela Cruz - 09123456789"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-white/40 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gym-primary text-white rounded-xl hover:bg-gym-secondary transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;