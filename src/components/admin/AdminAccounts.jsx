import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CalendarDays,
  Clock3,
  Eye,
  IdCard,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import '../../styles/AdminAccounts.css';

const ACCOUNT_FIELDS = [
  'id',
  'id_number',
  'username',
  'email',
  'last_name',
  'first_name',
  'middle_name',
  'suffix',
  'full_name',
  'contact_number',
  'address',
  'birthdate',
  'gender',
  'emergency_contact',
  'role',
  'is_approved',
  'created_at',
].join(',');

function getAccountName(account) {
  if (account?.full_name?.trim()) return account.full_name.trim();

  const first = account?.first_name || '';
  const middle = account?.middle_name || '';
  const last = account?.last_name || '';
  const suffix = account?.suffix || '';
  const name = [first, middle, last, suffix].filter(Boolean).join(' ').trim();

  return name || account?.username || account?.email || 'Unnamed account';
}

function formatDate(value) {
  if (!value) return 'Not provided';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not provided';

  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatRole(role) {
  if (!role) return 'Unknown';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="accounts-detail-item">
      <span className="accounts-detail-icon"><Icon size={16} /></span>
      <div>
        <span className="accounts-detail-label">{label}</span>
        <strong>{value || 'Not provided'}</strong>
      </div>
    </div>
  );
}

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select(ACCOUNT_FIELDS)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAccounts(data || []);
    } catch (fetchError) {
      console.error('Error fetching accounts:', fetchError);
      setError(fetchError.message || 'Unable to load accounts. Please try again.');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const counts = useMemo(() => ({
    total: accounts.length,
    admins: accounts.filter((account) => account.role === 'admin').length,
    employees: accounts.filter((account) => account.role === 'employee').length,
    clients: accounts.filter((account) => account.role === 'client').length,
    pending: accounts.filter((account) => !account.is_approved).length,
  }), [accounts]);

  const filteredAccounts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return accounts.filter((account) => {
      const matchesRole = roleFilter === 'all' || account.role === roleFilter;
      const matchesApproval = approvalFilter === 'all'
        || (approvalFilter === 'approved' && account.is_approved)
        || (approvalFilter === 'pending' && !account.is_approved);

      const searchableValues = [
        getAccountName(account),
        account.email,
        account.username,
        account.id_number,
        account.contact_number,
        account.role,
      ];
      const matchesSearch = !term || searchableValues.some((value) =>
        String(value || '').toLowerCase().includes(term)
      );

      return matchesRole && matchesApproval && matchesSearch;
    });
  }, [accounts, searchTerm, roleFilter, approvalFilter]);

  return (
    <section className="accounts-page">
      <div className="accounts-heading">
        <div>
          <p className="accounts-eyebrow">ACCOUNT DIRECTORY</p>
          <h2>Account Management</h2>
          <p className="accounts-subtitle">View and organize registered Forge Fitness accounts.</p>
        </div>
        <button
          type="button"
          className="accounts-refresh-btn"
          onClick={fetchAccounts}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'accounts-spinning' : ''} />
          {loading ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      <div className="accounts-stats-grid">
        <article className="accounts-stat-card accounts-stat-total">
          <span className="accounts-stat-icon"><Users size={19} /></span>
          <div><span>Total accounts</span><strong>{counts.total}</strong></div>
        </article>
        <article className="accounts-stat-card">
          <span className="accounts-stat-icon"><UserRound size={19} /></span>
          <div><span>Clients</span><strong>{counts.clients}</strong></div>
        </article>
        <article className="accounts-stat-card">
          <span className="accounts-stat-icon"><ShieldCheck size={19} /></span>
          <div><span>Employees</span><strong>{counts.employees}</strong></div>
        </article>
        <article className="accounts-stat-card">
          <span className="accounts-stat-icon"><BadgeCheck size={19} /></span>
          <div><span>Admins</span><strong>{counts.admins}</strong></div>
        </article>
        <article className="accounts-stat-card">
          <span className="accounts-stat-icon"><Clock3 size={19} /></span>
          <div><span>Pending approval</span><strong>{counts.pending}</strong></div>
        </article>
      </div>

      <div className="accounts-toolbar">
        <label className="accounts-search">
          <Search size={17} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search name, email, username, or ID..."
            aria-label="Search accounts"
          />
        </label>

        <label className="accounts-filter-field">
          <span>Role</span>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="employee">Employee</option>
            <option value="client">Client</option>
          </select>
        </label>

        <label className="accounts-filter-field">
          <span>Status</span>
          <select value={approvalFilter} onChange={(event) => setApprovalFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </label>
      </div>

      <div className="accounts-table-card">
        <div className="accounts-table-heading">
          <div>
            <h3>Registered accounts</h3>
            <p>Accounts are sorted by their most recent registration.</p>
          </div>
          <span className="accounts-result-count">{filteredAccounts.length} result{filteredAccounts.length === 1 ? '' : 's'}</span>
        </div>

        {loading ? (
          <div className="accounts-state-panel">
            <span className="accounts-loading-mark"><RefreshCw size={20} /></span>
            <strong>Loading accounts...</strong>
            <p>Getting the latest account records.</p>
          </div>
        ) : error ? (
          <div className="accounts-state-panel accounts-error-state">
            <strong>Could not load accounts</strong>
            <p>{error}</p>
            <button type="button" onClick={fetchAccounts}>Try again</button>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="accounts-state-panel">
            <span className="accounts-loading-mark"><Users size={20} /></span>
            <strong>{accounts.length ? 'No matching accounts' : 'No accounts found'}</strong>
            <p>{accounts.length ? 'Try changing your search or filters.' : 'Registered accounts will appear here once available.'}</p>
          </div>
        ) : (
          <div className="accounts-table-scroll">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Account ID</th>
                  <th>Role</th>
                  <th>Approval status</th>
                  <th>Date registered</th>
                  <th><span className="accounts-visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr key={account.id}>
                    <td>
                      <div className="accounts-person-cell">
                        <span className="accounts-avatar">{getAccountName(account).charAt(0).toUpperCase()}</span>
                        <div>
                          <strong>{getAccountName(account)}</strong>
                          <span>{account.email || account.username || 'No email provided'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="accounts-id-cell">{account.id_number || '—'}</td>
                    <td><span className={`accounts-role-pill role-${account.role || 'unknown'}`}>{formatRole(account.role)}</span></td>
                    <td>
                      <span className={`accounts-status-pill ${account.is_approved ? 'is-approved' : 'is-pending'}`}>
                        <span />{account.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="accounts-date-cell">{formatDate(account.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="accounts-view-btn"
                        onClick={() => setSelectedAccount(account)}
                        aria-label={`View ${getAccountName(account)} details`}
                      >
                        <Eye size={15} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && accounts.length > 0 && (
          <div className="accounts-table-footer">
            Showing {filteredAccounts.length} of {accounts.length} accounts
          </div>
        )}
      </div>

      {selectedAccount && (
        <div className="accounts-modal-overlay" onClick={() => setSelectedAccount(null)}>
          <section
            className="accounts-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="accounts-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="accounts-modal-header">
              <div>
                <p className="accounts-eyebrow">ACCOUNT PROFILE</p>
                <h3 id="accounts-detail-title">Account details</h3>
              </div>
              <button type="button" className="accounts-modal-close" onClick={() => setSelectedAccount(null)} aria-label="Close account details">
                <X size={19} />
              </button>
            </div>

            <div className="accounts-profile-summary">
              <span className="accounts-profile-avatar">{getAccountName(selectedAccount).charAt(0).toUpperCase()}</span>
              <div>
                <h4>{getAccountName(selectedAccount)}</h4>
                <p>{selectedAccount.email || 'No email provided'}</p>
                <div className="accounts-profile-badges">
                  <span className={`accounts-role-pill role-${selectedAccount.role || 'unknown'}`}>{formatRole(selectedAccount.role)}</span>
                  <span className={`accounts-status-pill ${selectedAccount.is_approved ? 'is-approved' : 'is-pending'}`}>
                    <span />{selectedAccount.is_approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="accounts-detail-grid">
              <DetailItem icon={IdCard} label="Account ID" value={selectedAccount.id_number} />
              <DetailItem icon={UserRound} label="Username" value={selectedAccount.username} />
              <DetailItem icon={Mail} label="Email address" value={selectedAccount.email} />
              <DetailItem icon={Phone} label="Contact number" value={selectedAccount.contact_number} />
              <DetailItem icon={CalendarDays} label="Birthdate" value={formatDate(selectedAccount.birthdate)} />
              <DetailItem icon={UserRound} label="Gender" value={selectedAccount.gender} />
              <DetailItem icon={MapPin} label="Address" value={selectedAccount.address} />
              <DetailItem icon={Phone} label="Emergency contact" value={selectedAccount.emergency_contact} />
              <DetailItem icon={BadgeCheck} label="Date registered" value={formatDate(selectedAccount.created_at)} />
            </div>

            <div className="accounts-modal-note">
              <ShieldCheck size={16} />
              Account approvals are handled separately in the Approvals section.
            </div>
            <div className="accounts-modal-actions">
              <button type="button" onClick={() => setSelectedAccount(null)}>Close</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
