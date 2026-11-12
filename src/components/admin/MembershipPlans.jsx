import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';

const MembershipPlans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_months: '',
    price: '',
    discount_percent: '',
    is_active: true
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .order('price', { ascending: true });
      
      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to load plans: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate fields
      if (!formData.name.trim()) {
        setError('Plan name is required');
        setLoading(false);
        return;
      }
      if (!formData.duration_months || parseInt(formData.duration_months) < 1) {
        setError('Duration must be at least 1 month');
        setLoading(false);
        return;
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        setError('Price must be greater than 0');
        setLoading(false);
        return;
      }

      const planData = {
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        duration_months: parseInt(formData.duration_months),
        price: parseFloat(formData.price),
        discount_percent: parseInt(formData.discount_percent) || 0,
        is_active: formData.is_active,
        created_by: user.id
      };

      console.log('Saving plan:', planData);

      let result;
      if (editingPlan) {
        result = await supabase
          .from('membership_plans')
          .update(planData)
          .eq('id', editingPlan.id);
      } else {
        result = await supabase
          .from('membership_plans')
          .insert([planData]);
      }

      if (result.error) throw result.error;

      setSuccess(editingPlan ? 'Plan updated successfully!' : 'Plan added successfully!');
      setShowModal(false);
      resetForm();
      fetchPlans();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving plan:', err);
      setError('Failed to save plan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      duration_months: '',
      price: '',
      discount_percent: '',
      is_active: true
    });
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('membership_plans')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setSuccess('Plan deleted successfully!');
      fetchPlans();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting plan:', err);
      setError('Failed to delete plan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      duration_months: plan.duration_months.toString(),
      price: plan.price.toString(),
      discount_percent: plan.discount_percent?.toString() || '',
      is_active: plan.is_active
    });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('membership_plans')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      fetchPlans();
    } catch (err) {
      console.error('Error toggling plan:', err);
      setError('Failed to update plan status');
    }
  };

  return (
    <div>
      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-['Poppins'] font-bold text-white">📋 Membership Plans</h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-gym-primary text-white px-4 py-2 rounded-xl hover:bg-gym-secondary transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Plan
        </button>
      </div>

      {/* Plans Grid */}
      {loading && !showModal ? (
        <div className="text-center py-8 text-gray-400">Loading plans...</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-gray-400">No membership plans yet.</p>
          <p className="text-gray-500 text-sm mt-2">Click "Add Plan" to create your first plan!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`bg-white/5 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 ${
                plan.is_active 
                  ? 'border-white/10 hover:border-gym-primary/50' 
                  : 'border-white/5 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-['Poppins'] font-bold text-white">{plan.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{plan.description || 'No description'}</p>
                </div>
                <button
                  onClick={() => toggleActive(plan.id, plan.is_active)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    plan.is_active 
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                      : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                  }`}
                >
                  {plan.is_active ? (
                    <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Active</span>
                  ) : (
                    <span className="flex items-center gap-1"><X className="w-3 h-3" /> Inactive</span>
                  )}
                </button>
              </div>
              
              <div className="mt-4 flex justify-between items-end">
                <div>
                  <p className="text-3xl font-['Poppins'] font-bold text-gym-primary">₱{plan.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-400">{plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}</p>
                  {plan.discount_percent > 0 && (
                    <p className="text-sm text-green-400">Save {plan.discount_percent}%</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gym-dark border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-['Poppins'] font-bold text-white mb-4">
              {editingPlan ? 'Edit Plan' : 'Add New Plan'}
            </h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gym-primary transition"
                  placeholder="e.g., Premium"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gym-primary transition"
                  rows="2"
                  placeholder="Describe the plan"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Duration (months) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.duration_months}
                  onChange={(e) => setFormData({...formData, duration_months: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gym-primary transition"
                  placeholder="1, 3, 6, 12"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Price (₱) *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gym-primary transition"
                  placeholder="500"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({...formData, discount_percent: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gym-primary transition"
                  placeholder="10"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 accent-gym-primary"
                />
                <label className="text-gray-300 text-sm">Active (visible to users)</label>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
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
                  {loading ? 'Saving...' : (editingPlan ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipPlans;