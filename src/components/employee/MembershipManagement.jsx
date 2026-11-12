import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Edit3,
  FileText,
  Plus,
  RefreshCw,
  Search,
  ToggleLeft,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/MembershipManagement.css';

const EMPTY_FORM = {
  name: '',
  description: '',
  duration_months: '1',
  price: '',
  discount_percent: '0',
  is_active: true,
};

const formatPeso = (amount) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const MembershipManagement = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    setPageError('');

    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select(
          'id, name, description, duration_months, price, discount_percent, is_active, created_at, updated_at'
        )
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading membership plans:', error);
      setPageError(error.message || 'Unable to load membership plans.');
    } finally {
      setLoading(false);
    }
  };

  const activeCount = plans.filter((plan) => plan.is_active).length;
  const inactiveCount = plans.length - activeCount;

  const filteredPlans = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return plans.filter((plan) => {
      const matchesSearch =
        !keyword ||
        String(plan.name || '').toLowerCase().includes(keyword) ||
        String(plan.description || '').toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && plan.is_active) ||
        (statusFilter === 'inactive' && !plan.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [plans, searchTerm, statusFilter]);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      duration_months: String(plan.duration_months ?? 1),
      price: String(plan.price ?? ''),
      discount_percent: String(plan.discount_percent ?? 0),
      is_active: Boolean(plan.is_active),
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingPlan(null);
    setFormData(EMPTY_FORM);
    setFormError('');
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const name = formData.name.trim();
    const duration = Number(formData.duration_months);
    const price = Number(formData.price);
    const discount = Number(formData.discount_percent || 0);

    if (!name) {
      setFormError('Please enter a membership plan name.');
      return;
    }
    if (!Number.isInteger(duration) || duration < 1) {
      setFormError('Duration must be at least 1 whole month.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setFormError('Price must be greater than ₱0.');
      return;
    }
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      setFormError('Discount must be between 0% and 100%.');
      return;
    }

    setSaving(true);
    setFormError('');
    setPageError('');
    setSuccessMessage('');

    const planFields = {
      name,
      description: formData.description.trim(),
      duration_months: duration,
      price,
      discount_percent: discount,
      is_active: Boolean(formData.is_active),
    };

    try {
      let result;

      if (editingPlan) {
        result = await supabase
          .from('membership_plans')
          .update(planFields)
          .eq('id', editingPlan.id);
      } else {
        result = await supabase
          .from('membership_plans')
          .insert([{ ...planFields, created_by: user?.id || null }]);
      }

      if (result.error) throw result.error;

      setShowModal(false);
      setEditingPlan(null);
      setFormData(EMPTY_FORM);
      setSuccessMessage(
        editingPlan
          ? 'Membership plan updated successfully.'
          : 'Membership plan created successfully.'
      );
      await fetchPlans();
    } catch (error) {
      console.error('Error saving membership plan:', error);
      setFormError(error.message || 'Unable to save this membership plan.');
    } finally {
      setSaving(false);
    }
  };

  const togglePlanStatus = async (plan) => {
    setPageError('');
    setSuccessMessage('');

    const { error } = await supabase
      .from('membership_plans')
      .update({ is_active: !plan.is_active })
      .eq('id', plan.id);

    if (error) {
      console.error('Error changing membership plan status:', error);
      setPageError(error.message || 'Unable to update plan status.');
      return;
    }

    setSuccessMessage(
      `${plan.name} is now ${plan.is_active ? 'inactive' : 'active'}.`
    );
    await fetchPlans();
  };

  const deletePlan = async (plan) => {
    const confirmed = window.confirm(
      `Delete the ${plan.name} plan? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(plan.id);
    setPageError('');
    setSuccessMessage('');

    try {
      const { error } = await supabase
        .from('membership_plans')
        .delete()
        .eq('id', plan.id);

      if (error) throw error;

      setSuccessMessage(`${plan.name} was deleted successfully.`);
      await fetchPlans();
    } catch (error) {
      console.error('Error deleting membership plan:', error);
      setPageError(
        error.code === '23503'
          ? 'This plan is already linked to a member record and cannot be deleted. You can set it to inactive instead.'
          : error.message || 'Unable to delete this membership plan.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="membership-management">
      <div className="membership-management-header">
        <div>
          <div className="membership-title-row">
            <span className="membership-title-icon">
              <FileText size={19} />
            </span>
            <div>
              <p className="membership-kicker">PLAN MANAGEMENT</p>
              <h3>Membership Plans</h3>
            </div>
          </div>
          <p className="membership-description">
            Create, update, and manage the membership options offered by Forge Fitness.
          </p>
        </div>

        <div className="membership-header-actions">
          <button
            type="button"
            className="membership-refresh-btn"
            onClick={fetchPlans}
            disabled={loading}
            aria-label="Refresh membership plans"
            title="Refresh plans"
          >
            <RefreshCw size={16} className={loading ? 'is-spinning' : ''} />
          </button>
          <button
            type="button"
            className="membership-add-btn"
            onClick={openCreateModal}
          >
            <Plus size={17} />
            Add Plan
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="membership-alert membership-alert-success" role="status">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage('')} aria-label="Dismiss message">
            <X size={15} />
          </button>
        </div>
      )}

      {pageError && (
        <div className="membership-alert membership-alert-error" role="alert">
          <span>{pageError}</span>
          <button type="button" onClick={() => setPageError('')} aria-label="Dismiss error">
            <X size={15} />
          </button>
        </div>
      )}

      <div className="membership-stats">
        <div className="membership-stat-card">
          <span className="membership-stat-icon"><FileText size={17} /></span>
          <div><span>Total plans</span><strong>{plans.length}</strong></div>
        </div>
        <div className="membership-stat-card">
          <span className="membership-stat-icon membership-stat-icon-active"><CheckCircle2 size={17} /></span>
          <div><span>Active plans</span><strong>{activeCount}</strong></div>
        </div>
        <div className="membership-stat-card">
          <span className="membership-stat-icon membership-stat-icon-muted"><ToggleLeft size={17} /></span>
          <div><span>Inactive plans</span><strong>{inactiveCount}</strong></div>
        </div>
      </div>

      <div className="membership-toolbar">
        <div className="membership-search">
          <Search size={16} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search plan name or description..."
            aria-label="Search membership plans"
          />
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        <select
          className="membership-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter membership plans by status"
        >
          <option value="all">All plans</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="membership-results-line">
        <span>{filteredPlans.length} {filteredPlans.length === 1 ? 'plan' : 'plans'} shown</span>
        {searchTerm && <span>Results for “{searchTerm}”</span>}
      </div>

      {loading ? (
        <div className="membership-empty-state">
          <span className="membership-loading-spinner" />
          <h4>Loading membership plans...</h4>
          <p>Connecting to the Forge Fitness database.</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="membership-empty-state">
          <span className="membership-empty-icon"><FileText size={25} /></span>
          <h4>No membership plans yet</h4>
          <p>Create your first plan to make it available for membership payments.</p>
          <button type="button" className="membership-empty-btn" onClick={openCreateModal}>
            <Plus size={16} /> Add your first plan
          </button>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="membership-empty-state">
          <span className="membership-empty-icon"><Search size={24} /></span>
          <h4>No matching plans</h4>
          <p>Try another search term or change the status filter.</p>
          <button
            type="button"
            className="membership-empty-btn membership-empty-btn-secondary"
            onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="membership-plan-grid">
          {filteredPlans.map((plan) => (
            <article
              key={plan.id}
              className={`membership-plan-card ${plan.is_active ? '' : 'is-inactive'}`}
            >
              <div className="membership-plan-card-top">
                <span className="membership-plan-symbol"><FileText size={18} /></span>
                <span className={`membership-status-pill ${plan.is_active ? 'is-active' : 'is-inactive'}`}>
                  <span /> {plan.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="membership-plan-copy">
                <h4>{plan.name}</h4>
                <p>{plan.description || 'No description provided for this plan.'}</p>
              </div>

              <div className="membership-plan-price">
                <strong>{formatPeso(plan.price)}</strong>
                <span>Membership fee</span>
              </div>

              <div className="membership-plan-meta">
                <div>
                  <CalendarDays size={15} />
                  <span>{plan.duration_months} {Number(plan.duration_months) === 1 ? 'month' : 'months'}</span>
                </div>
                <div>
                  <BadgePercent size={15} />
                  <span>{Number(plan.discount_percent) || 0}% discount</span>
                </div>
              </div>

              <div className="membership-plan-actions">
                <button
                  type="button"
                  className="membership-action-btn membership-edit-btn"
                  onClick={() => openEditModal(plan)}
                >
                  <Edit3 size={14} /> Edit
                </button>
                <button
                  type="button"
                  className="membership-action-btn membership-toggle-btn"
                  onClick={() => togglePlanStatus(plan)}
                >
                  <ToggleLeft size={15} /> {plan.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  className="membership-icon-action membership-delete-btn"
                  onClick={() => deletePlan(plan)}
                  disabled={deletingId === plan.id}
                  aria-label={`Delete ${plan.name}`}
                  title="Delete plan"
                >
                  {deletingId === plan.id ? <span className="membership-mini-spinner" /> : <Trash2 size={15} />}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal && (
        <div className="membership-modal-overlay" onMouseDown={closeModal}>
          <section
            className="membership-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="membership-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="membership-modal-header">
              <div>
                <p className="membership-kicker">{editingPlan ? 'UPDATE PLAN' : 'NEW PLAN'}</p>
                <h3 id="membership-modal-title">{editingPlan ? 'Edit Membership Plan' : 'Create Membership Plan'}</h3>
                <p>Set the plan name, duration, price, and availability.</p>
              </div>
              <button type="button" className="membership-modal-close" onClick={closeModal} disabled={saving} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            {formError && <div className="membership-alert membership-alert-error" role="alert">{formError}</div>}

            <form className="membership-form" onSubmit={handleSubmit}>
              <div className="membership-field">
                <label htmlFor="membership-plan-name">Plan name <b>*</b></label>
                <input
                  id="membership-plan-name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Starter, Performance, Premium"
                  maxLength={80}
                  required
                />
              </div>

              <div className="membership-field">
                <label htmlFor="membership-plan-description">Description</label>
                <textarea
                  id="membership-plan-description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={3}
                  maxLength={500}
                  placeholder="Briefly describe what this membership includes."
                />
              </div>

              <div className="membership-form-grid">
                <div className="membership-field">
                  <label htmlFor="membership-plan-duration">Duration (months) <b>*</b></label>
                  <input
                    id="membership-plan-duration"
                    name="duration_months"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.duration_months}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="membership-field">
                  <label htmlFor="membership-plan-price">Price (₱) <b>*</b></label>
                  <input
                    id="membership-plan-price"
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.price}
                    onChange={handleFormChange}
                    placeholder="500.00"
                    required
                  />
                </div>
                <div className="membership-field">
                  <label htmlFor="membership-plan-discount">Discount (%)</label>
                  <input
                    id="membership-plan-discount"
                    name="discount_percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.discount_percent}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <label className="membership-active-control">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleFormChange}
                />
                <span className="membership-checkbox-custom" />
                <span><strong>Plan is active</strong><small>Active plans can be selected when processing memberships.</small></span>
              </label>

              <div className="membership-modal-actions">
                <button type="button" className="membership-cancel-btn" onClick={closeModal} disabled={saving}>Cancel</button>
                <button type="submit" className="membership-save-btn" disabled={saving}>
                  {saving ? <><span className="membership-button-spinner" /> Saving...</> : <><Plus size={16} /> {editingPlan ? 'Save Changes' : 'Create Plan'}</>}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
};

export default MembershipManagement;
