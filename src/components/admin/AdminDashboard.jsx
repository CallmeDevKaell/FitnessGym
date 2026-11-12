import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, CheckCircle2, ClipboardCheck, CreditCard, FileText, LogOut, Menu, ShieldCheck, Users, X } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import UserApprovals from './UserApprovals';
import AdminAccounts from './AdminAccounts';
import MembershipManagement from '../employee/MembershipManagement';
import AdminReports from './AdminReports';
import SecurityActivity from './SecurityActivity';
import '../../styles/AdminDashboard.css';

const nav = [
  ['accounts', 'Accounts', Users],
  ['plans', 'Plans', FileText],
  ['approvals', 'Approvals', ClipboardCheck],
  ['payments', 'Payments', CreditCard],
  ['reports', 'Reports', BarChart3],
  ['security', 'Security Activity', ShieldCheck],
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('approvals');
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!user?.id) return undefined;

    supabase
      .from('users')
      .select('full_name,email,role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (alive) setProfile(data || null);
      });

    return () => { alive = false; };
  }, [user?.id]);

  const firstName = useMemo(() => {
    const name = profile?.full_name || 'Admin';
    return name.includes(',')
      ? (name.split(',')[1] || '').trim().split(' ')[0] || 'Admin'
      : name.split(' ')[0] || 'Admin';
  }, [profile?.full_name]);

  const switchTab = (value) => {
    setTab(value);
    setOpen(false);
  };

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <Link to="/" className="admin-brand"><span className="admin-brand-mark">✦</span> FORGE FITNESS</Link>
          <span className="admin-role-pill">ADMIN</span>
          <div className="admin-topbar-actions">
            <span className="admin-user-name">{profile?.full_name || 'Administrator'}</span>
            <button className="admin-logout" onClick={logout}><LogOut size={15} /> Logout</button>
          </div>
          <button className="admin-mobile-menu" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      <div className="admin-layout">
        <aside className={`admin-sidebar ${open ? 'is-open' : ''}`}>
          <div className="admin-sidebar-heading">
            <p>OPERATIONS CENTER</p>
            <span>Manage your gym from one workspace.</span>
          </div>
          <nav className="admin-nav" aria-label="Admin navigation">
            {nav.map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                className={`admin-nav-item ${tab === key ? 'is-active' : ''}`}
                onClick={() => switchTab(key)}
              >
                <span className="admin-nav-icon"><Icon size={17} /></span>{label}
              </button>
            ))}
          </nav>
          <div className="admin-sidebar-footer">
            <span className="admin-sidebar-dot" />
            <div><strong>System connected</strong><span>Supabase database</span></div>
          </div>
        </aside>

        <section className="admin-content">
          <div className="admin-page-heading">
            <div>
              <p className="admin-eyebrow">OPERATIONS CENTER</p>
              <h1>Good morning, <span>{firstName}.</span></h1>
              <p>Review registrations and manage the Forge Fitness workspace.</p>
            </div>
            <div className="admin-status-card">
              <span className="admin-status-icon"><CheckCircle2 size={17} /></span>
              <div><strong>Admin access</strong><span>Authenticated and approved</span></div>
            </div>
          </div>

          <div className="admin-workspace">
            {tab === 'accounts' && <AdminAccounts />}
            {tab === 'approvals' && <UserApprovals />}
            {tab === 'plans' && <MembershipManagement />}
            {tab === 'payments' && <Placeholder icon={CreditCard} title="Payments" text="Payment approvals will be rebuilt next." />}
            {tab === 'reports' && <AdminReports />}
            {tab === 'security' && <SecurityActivity />}
          </div>
        </section>
      </div>
    </main>
  );
}

function Placeholder({ icon: Icon, title, text }) {
  return (
    <div className="admin-placeholder-panel">
      <span className="admin-placeholder-icon"><Icon size={22} /></span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
