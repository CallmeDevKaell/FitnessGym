import React, { useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Dumbbell,
  KeyRound,
  LogOut,
  Menu,
  ReceiptText,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import MyMembership from './MyMembership';
import MyReceipts from './MyReceipts';
import ChangePassword from './ChangePassword';
import '../../styles/ClientDashboard.css';

const CLIENT_TABS = [
  {
    key: 'membership',
    label: 'My Membership',
    icon: Dumbbell,
    eyebrow: 'Membership',
    description: 'View your current plan, card, and validity.',
  },
  {
    key: 'receipts',
    label: 'My Receipts',
    icon: ReceiptText,
    eyebrow: 'Payment history',
    description: 'Review your approved payment receipts.',
  },
  {
    key: 'security',
    label: 'Account Security',
    icon: KeyRound,
    eyebrow: 'Account security',
    description: 'Update your password and keep your account protected.',
  },
];

const ClientDashboard = () => {
  const { user, logout } = useAuth();

  const [clientData, setClientData] = useState(null);
  const [activeTab, setActiveTab] = useState('membership');
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchClientData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select(
          'id,id_number,username,email,last_name,first_name,middle_name,suffix,full_name,contact_number'
        )
        .eq('id', user.id)
        .single();

      if (!error && mounted) {
        setClientData(data);
      }

      if (mounted) setLoading(false);
    };

    fetchClientData();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const firstName = useMemo(() => {
    if (!clientData?.first_name) return 'Member';
    return clientData.first_name;
  }, [clientData?.first_name]);

  const initials = useMemo(() => {
    const first = clientData?.first_name?.charAt(0) || '';
    const last = clientData?.last_name?.charAt(0) || '';

    return `${first}${last}`.toUpperCase() || 'M';
  }, [clientData?.first_name, clientData?.last_name]);

  const currentTab =
    CLIENT_TABS.find((tab) => tab.key === activeTab) || CLIENT_TABS[0];

  const handleTabChange = (key) => {
    setActiveTab(key);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      } else {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <main className="client-page client-loading-page">
        <div className="client-loading-card">
          <div className="client-loading-spinner" />
          <h2>Loading your dashboard...</h2>
          <p>Please wait while we prepare your member space.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="client-page">
      <header className="client-topbar">
        <div className="client-topbar-inner">
          <Link to="/" className="client-brand">
            <span className="client-brand-mark">
              <Dumbbell size={18} />
            </span>
            <span>FORGE FITNESS</span>
          </Link>

          <span className="client-role-pill">MEMBER</span>

          <div className="client-topbar-user">
            <div className="client-avatar client-avatar-small">{initials}</div>

            <div className="client-user-copy">
              <strong>{clientData?.full_name || 'Member'}</strong>
              <span>{clientData?.email || 'Member account'}</span>
            </div>

            <button
              type="button"
              className="client-logout"
              onClick={handleLogout}
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>

          <button
            type="button"
            className="client-mobile-menu"
            onClick={() => setMobileOpen((current) => !current)}
            aria-label="Toggle client navigation"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <div className="client-layout">
        <aside className={`client-sidebar ${mobileOpen ? 'is-open' : ''}`}>
          <div className="client-profile-card">
            <div className="client-avatar">{initials}</div>

            <div>
              <p className="client-sidebar-kicker">MEMBER ACCOUNT</p>
              <h2>{clientData?.full_name || 'Forge Member'}</h2>
              <span>ID {clientData?.id_number || '—'}</span>
            </div>
          </div>

          <div className="client-sidebar-section">
            <p className="client-sidebar-label">YOUR SPACE</p>

            <nav className="client-nav" aria-label="Member navigation">
              {CLIENT_TABS.map(({ key, label, icon: Icon }) => (
                <button
                  type="button"
                  key={key}
                  className={`client-nav-item ${
                    activeTab === key ? 'is-active' : ''
                  }`}
                  onClick={() => handleTabChange(key)}
                  aria-current={activeTab === key ? 'page' : undefined}
                >
                  <span className="client-nav-icon">
                    <Icon size={17} />
                  </span>

                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="client-sidebar-help">
            <div className="client-help-icon">
              <ShieldCheck size={17} />
            </div>

            <div>
              <strong>Member access</strong>
              <span>
                Your account and payment information are protected.
              </span>
            </div>
          </div>

          <div className="client-sidebar-footer">
            <div className="client-status-dot" />

            <div>
              <strong>Account active</strong>
              <span>Forge Fitness member</span>
            </div>
          </div>
        </aside>

        <section className="client-content">
          <div className="client-heading">
            <div>
              <p className="client-eyebrow">MEMBER PORTAL</p>

              <h1>
                Welcome back, <span>{firstName}.</span>
              </h1>

              <p>{currentTab.description}</p>
            </div>

            <div className="client-heading-card">
              <div className="client-heading-card-icon">
                {activeTab === 'security' ? (
                  <KeyRound size={18} />
                ) : (
                  <UserRound size={18} />
                )}
              </div>

              <div>
                <strong>
                  {activeTab === 'security'
                    ? 'Protect your account'
                    : 'Your member account'}
                </strong>
                <span>
                  {clientData?.username
                    ? `@${clientData.username}`
                    : 'Forge Fitness'}
                </span>
              </div>
            </div>
          </div>

          <div className="client-summary-grid">
            <div className="client-summary-card">
              <div className="client-summary-icon">
                <Dumbbell size={17} />
              </div>

              <div>
                <span>Membership</span>
                <strong>
                  {activeTab === 'membership'
                    ? 'View current plan'
                    : 'Membership details'}
                </strong>
              </div>
            </div>

            <div className="client-summary-card">
              <div className="client-summary-icon">
                <ReceiptText size={17} />
              </div>

              <div>
                <span>Receipts</span>
                <strong>Approved payment history</strong>
              </div>
            </div>

            <div className="client-summary-card">
              <div className="client-summary-icon">
                {activeTab === 'security' ? (
                  <ShieldCheck size={17} />
                ) : (
                  <CreditCard size={17} />
                )}
              </div>

              <div>
                <span>
                  {activeTab === 'security' ? 'Security' : 'Account ID'}
                </span>
                <strong>
                  {activeTab === 'security'
                    ? 'Password protection'
                    : clientData?.id_number || '—'}
                </strong>
              </div>
            </div>
          </div>

          <section className="client-workspace">
            <div className="client-workspace-top">
              <div>
                <p className="client-workspace-kicker">{currentTab.eyebrow}</p>
                <h2>{currentTab.label}</h2>
              </div>

              <span className="client-workspace-badge">
                <ShieldCheck size={14} />
                Secure member view
              </span>
            </div>

            <div className="client-panel">
              {activeTab === 'membership' && (
                <MyMembership userId={user?.id} />
              )}

              {activeTab === 'receipts' && (
                <MyReceipts userId={user?.id} />
              )}

              {activeTab === 'security' && <ChangePassword />}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
};

export default ClientDashboard;
