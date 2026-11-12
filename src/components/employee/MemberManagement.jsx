import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/MemberManagement.css';

const INITIAL_FORM = {
  id_number: '',
  password: '',
  last_name: '',
  first_name: '',
  middle_initial: '',
  contact_number: '',
  address: '',
  birthdate: '',
  gender: 'Male',
  emergency_contact: '',
};

const MemberManagement = () => {
  const { user } = useAuth();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(INITIAL_FORM);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        member:members!members_user_id_fkey(
  id,
  card_number,
  start_date,
  end_date,
  status,
  membership_plan:membership_plans(
    name,
    price
  )
)
      `)
      .eq('role', 'client')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching members:', error);
    } else {
      setMembers(data || []);
    }

    setLoading(false);
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    if (loading) return;

    setShowModal(false);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      if (!/^\d{8}$/.test(formData.id_number)) {
        throw new Error('ID Number must be exactly 8 digits.');
      }

      if (!formData.password || formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      if (!formData.last_name.trim()) {
        throw new Error('Last Name is required.');
      }

      if (!formData.first_name.trim()) {
        throw new Error('First Name is required.');
      }

      const autoEmail = `${formData.id_number}@gym.com`;

      const { data: existingId } = await supabase
        .from('users')
        .select('id')
        .eq('id_number', formData.id_number)
        .maybeSingle();

      if (existingId) {
        throw new Error('ID Number already exists.');
      }

      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', autoEmail)
        .maybeSingle();

      if (existingEmail) {
        throw new Error('Generated email already exists.');
      }

      const fullName = `${formData.last_name.trim()}, ${formData.first_name.trim()}${
        formData.middle_initial.trim()
          ? ` ${formData.middle_initial.trim()}`
          : ''
      }`;

      /*
       * NOTE:
       * This keeps your current employee-created-member flow.
       * We are only rebuilding the UI here.
       */
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: autoEmail,
          password: formData.password,
        });

      if (authError) {
        throw authError;
      }

      if (!authData?.user) {
        throw new Error('Unable to create member authentication account.');
      }

      const { error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            id_number: formData.id_number,
            username: formData.id_number,
            email: autoEmail,
            last_name: formData.last_name.trim(),
            first_name: formData.first_name.trim(),
            middle_initial: formData.middle_initial.trim(),
            full_name: fullName,
            contact_number: formData.contact_number.trim(),
            address: formData.address.trim(),
            birthdate: formData.birthdate,
            gender: formData.gender,
            emergency_contact: formData.emergency_contact.trim(),
            role: 'client',
            is_approved: false,
          },
        ]);

      if (userError) {
        throw userError;
      }

      const { error: approvalError } = await supabase
        .from('approval_requests')
        .insert([
          {
            request_type: 'client_reg',
            requested_by: user?.id,
            target_id: authData.user.id,
            status: 'pending',
          },
        ]);

      if (approvalError) {
        throw approvalError;
      }

      alert(
        `Member created successfully!\n\nEmail: ${autoEmail}\nStatus: Pending Admin Approval`
      );

      setShowModal(false);
      resetForm();

      await fetchMembers();
    } catch (error) {
      console.error('Member creation error:', error);

      alert(
        error?.message || 'Unable to create the member.'
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return members;
    }

    return members.filter((member) => {
      const name = [
        member.last_name,
        member.first_name,
        member.middle_initial,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const idNumber = String(
        member.id_number || ''
      ).toLowerCase();

      const email = String(
        member.email || ''
      ).toLowerCase();

      return (
        name.includes(keyword) ||
        idNumber.includes(keyword) ||
        email.includes(keyword)
      );
    });
  }, [members, searchTerm]);

  const approvedCount = members.filter(
    (member) => member.is_approved
  ).length;

  const pendingCount = members.filter(
    (member) => !member.is_approved
  ).length;

  const formatName = (member) => {
    return `${member.last_name || ''}, ${
      member.first_name || ''
    }${
      member.middle_initial
        ? ` ${member.middle_initial}`
        : ''
    }`;
  };

  return (
    <section className="member-management">
      {/* =========================
          HEADER
      ========================== */}
      <div className="member-management-header">
        <div>
          <div className="member-title-row">
            <span className="member-title-icon">
              <Users size={19} />
            </span>

            <div>
              <p className="member-kicker">
                MEMBER RECORDS
              </p>

              <h3>Member Management</h3>
            </div>
          </div>

          <p className="member-description">
            Manage client accounts, member information, and
            approval status.
          </p>
        </div>

        <button
          type="button"
          className="member-add-btn"
          onClick={openModal}
        >
          <Plus size={17} />
          Add Member
        </button>
      </div>

      {/* =========================
          SUMMARY
      ========================== */}
      <div className="member-summary">
        <div className="member-summary-card">
          <span className="member-summary-icon">
            <Users size={17} />
          </span>

          <div>
            <span>Total members</span>
            <strong>{members.length}</strong>
          </div>
        </div>

        <div className="member-summary-card">
          <span className="member-summary-icon">
            <CheckCircle2 size={17} />
          </span>

          <div>
            <span>Approved</span>
            <strong>{approvedCount}</strong>
          </div>
        </div>

        <div className="member-summary-card">
          <span className="member-summary-icon">
            <Clock3 size={17} />
          </span>

          <div>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>
        </div>
      </div>

      {/* =========================
          TOOLBAR
      ========================== */}
      <div className="member-toolbar">
        <div className="member-search">
          <Search size={16} />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search name, ID number, or email..."
          />

          {searchTerm && (
            <button
              type="button"
              className="member-search-clear"
              onClick={() => setSearchTerm('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <span className="member-count">
          {filteredMembers.length}{' '}
          {filteredMembers.length === 1
            ? 'member'
            : 'members'}
        </span>
      </div>

      {/* =========================
          TABLE
      ========================== */}
      <div className="member-table-card">
        {loading ? (
          <div className="member-empty">
            <div className="member-spinner" />
            <h4>Loading members...</h4>
            <p>Fetching member records.</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="member-empty">
            <span className="member-empty-icon">
              <Users size={24} />
            </span>

            <h4>
              {searchTerm
                ? 'No members found'
                : 'No members yet'}
            </h4>

            <p>
              {searchTerm
                ? 'Try a different search term.'
                : 'Add your first client member to get started.'}
            </p>

            {!searchTerm && (
              <button
                type="button"
                className="member-empty-btn"
                onClick={openModal}
              >
                <UserPlus size={15} />
                Add first member
              </button>
            )}
          </div>
        ) : (
          <div className="member-table-scroll">
            <table className="member-table">
              <thead>
                <tr>
                  <th>ID Number</th>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Card Number</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredMembers.map((member) => {
                  const membership =
                    member.member?.[0];

                  const plan =
                    membership?.membership_plan;

                  return (
                    <tr key={member.id}>
                      <td>
                        <span className="member-id">
                          {member.id_number || '—'}
                        </span>
                      </td>

                      <td>
                        <div className="member-name">
                          <div className="member-avatar">
                            {(
                              member.first_name?.charAt(0) ||
                              'M'
                            ) +
                              (
                                member.last_name?.charAt(0) ||
                                ''
                              )}
                          </div>

                          <div>
                            <strong>
                              {formatName(member)}
                            </strong>

                            <span>
                              @{member.username ||
                                'member'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="member-email">
                          <Mail size={13} />
                          {member.email || '—'}
                        </span>
                      </td>

                      <td>
                        <div className="member-plan">
                          <strong>
                            {plan?.name ||
                              'No membership'}
                          </strong>

                          {plan?.price != null && (
                            <span>
                              ₱
                              {Number(
                                plan.price
                              ).toLocaleString(
                                'en-PH',
                                {
                                  minimumFractionDigits: 2,
                                }
                              )}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="member-card">
                          {membership?.card_number ||
                            'Not assigned'}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`member-status ${
                            member.is_approved
                              ? 'approved'
                              : 'pending'
                          }`}
                        >
                          {member.is_approved ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <Clock3 size={12} />
                          )}

                          {member.is_approved
                            ? 'Approved'
                            : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================
          ADD MEMBER MODAL
      ========================== */}
      {showModal && (
        <div
          className="member-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="member-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="member-modal-header">
              <div>
                <p className="member-kicker">
                  NEW MEMBER
                </p>

                <h3>Add New Member</h3>

                <p>
                  Create a client account and place it in
                  the approval queue.
                </p>
              </div>

              <button
                type="button"
                className="member-modal-close"
                onClick={closeModal}
                disabled={loading}
              >
                <X size={18} />
              </button>
            </div>

            <form
              className="member-form"
              onSubmit={handleSubmit}
            >
              {/* ACCOUNT */}
              <section className="member-form-section">
                <div className="member-section-heading">
                  <span>01</span>

                  <div>
                    <h4>Account Information</h4>
                    <p>
                      Login information for the new
                      member.
                    </p>
                  </div>
                </div>

                <div className="member-form-grid">
                  <div className="member-field">
                    <label htmlFor="id_number">
                      ID Number <b>*</b>
                    </label>

                    <input
                      id="id_number"
                      name="id_number"
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      value={formData.id_number}
                      onChange={handleChange}
                      placeholder="12345678"
                      required
                    />

                    <small>
                      Email:{' '}
                      <strong>
                        {formData.id_number ||
                          '12345678'}
                        @gym.com
                      </strong>
                    </small>
                  </div>

                  <div className="member-field">
                    <label htmlFor="password">
                      Temporary Password <b>*</b>
                    </label>

                    <input
                      id="password"
                      name="password"
                      type="password"
                      minLength={6}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      required
                    />

                    <small>
                      Used to create the member Auth
                      account.
                    </small>
                  </div>
                </div>
              </section>

              {/* PERSONAL */}
              <section className="member-form-section">
                <div className="member-section-heading">
                  <span>02</span>

                  <div>
                    <h4>Personal Information</h4>
                    <p>
                      Member identity and basic details.
                    </p>
                  </div>
                </div>

                <div className="member-form-grid">
                  <div className="member-field">
                    <label htmlFor="last_name">
                      Last Name <b>*</b>
                    </label>

                    <input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Dela Cruz"
                      required
                    />
                  </div>

                  <div className="member-field">
                    <label htmlFor="first_name">
                      First Name <b>*</b>
                    </label>

                    <input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="Juan"
                      required
                    />
                  </div>

                  <div className="member-field">
                    <label htmlFor="middle_initial">
                      Middle Initial
                    </label>

                    <input
                      id="middle_initial"
                      name="middle_initial"
                      maxLength={1}
                      value={formData.middle_initial}
                      onChange={handleChange}
                      placeholder="M"
                    />
                  </div>

                  <div className="member-field">
                    <label htmlFor="birthdate">
                      Birthdate <b>*</b>
                    </label>

                    <div className="member-input-icon">
                      <CalendarDays size={15} />

                      <input
                        id="birthdate"
                        name="birthdate"
                        type="date"
                        value={formData.birthdate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="member-field">
                    <label htmlFor="gender">
                      Gender <b>*</b>
                    </label>

                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                    >
                      <option value="Male">
                        Male
                      </option>

                      <option value="Female">
                        Female
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>
                  </div>
                </div>
              </section>

              {/* CONTACT */}
              <section className="member-form-section">
                <div className="member-section-heading">
                  <span>03</span>

                  <div>
                    <h4>Contact Information</h4>
                    <p>
                      Contact details for the member.
                    </p>
                  </div>
                </div>

                <div className="member-form-grid">
                  <div className="member-field">
                    <label htmlFor="contact_number">
                      Contact Number <b>*</b>
                    </label>

                    <div className="member-input-icon">
                      <Phone size={15} />

                      <input
                        id="contact_number"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleChange}
                        placeholder="09123456789"
                        required
                      />
                    </div>
                  </div>

                  <div className="member-field">
                    <label htmlFor="emergency_contact">
                      Emergency Contact
                    </label>

                    <input
                      id="emergency_contact"
                      name="emergency_contact"
                      value={
                        formData.emergency_contact
                      }
                      onChange={handleChange}
                      placeholder="Name - 09123456789"
                    />
                  </div>

                  <div className="member-field member-field-full">
                    <label htmlFor="address">
                      Address <b>*</b>
                    </label>

                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="House number, street, barangay, city..."
                      required
                    />
                  </div>
                </div>
              </section>

              {/* NOTICE */}
              <div className="member-notice">
                <ShieldAlert size={17} />

                <div>
                  <strong>
                    Admin approval required
                  </strong>

                  <span>
                    The new client is created as
                    pending and will need administrator
                    approval before accessing the
                    system.
                  </span>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="member-modal-actions">
                <button
                  type="button"
                  className="member-cancel-btn"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="member-create-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="member-button-spinner" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Create Member
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default MemberManagement;