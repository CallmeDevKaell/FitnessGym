import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CreditCard,
  Dumbbell,
  FileText,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

import MemberManagement from './MemberManagement';
import PaymentProcessing from './PaymentProcessing';
import MembershipManagement from './MembershipManagement';

import '../../styles/EmployeeDashboard.css';

const EMPLOYEE_TABS = [
  {
    key: 'members',
    label: 'Members',
    icon: Users,
    eyebrow: 'MEMBER RECORDS',
    description:
      'View and manage gym members and their account information.',
  },
  {
    key: 'payments',
    label: 'Payments',
    icon: CreditCard,
    eyebrow: 'PAYMENT PROCESSING',
    description:
      'Process membership payments and keep transactions updated.',
  },
  {
    key: 'plans',
    label: 'Membership Plans',
    icon: FileText,
    eyebrow: 'PLAN MANAGEMENT',
    description:
      'Create and manage the available membership plans.',
  },
];

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();

  const [employeeData, setEmployeeData] = useState(null);
  const [activeTab, setActiveTab] = useState('members');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeTabMeta = useMemo(() => {
    return (
      EMPLOYEE_TABS.find(
        (item) => item.key === activeTab
      ) || EMPLOYEE_TABS[0]
    );
  }, [activeTab]);

  useEffect(() => {
    let mounted = true;

    const loadEmployee = async () => {
      if (!user?.id) {
        if (mounted) setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select(
          'id,id_number,username,email,last_name,first_name,middle_name,suffix,full_name,role,is_approved'
        )
        .eq('id', user.id)
        .single();

      if (!error && mounted) {
        setEmployeeData(data);
      }

      if (mounted) {
        setLoading(false);
      }
    };

    loadEmployee();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const initials = useMemo(() => {
    const first =
      employeeData?.first_name?.charAt(0) || '';

    const last =
      employeeData?.last_name?.charAt(0) || '';

    return (
      `${first}${last}`.toUpperCase() || 'EE'
    );
  }, [employeeData]);

  const firstName =
    employeeData?.first_name || 'Employee';

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
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
      <main className="employee-page employee-loading-page">
        <div className="employee-loading-card">
          <div className="employee-loading-spinner" />

          <h2>
            Loading employee workspace...
          </h2>

          <p>
            Please wait while we prepare your dashboard.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="employee-page">

      {/* ==================================
          TOP BAR
      =================================== */}
      <header className="employee-topbar">
        <div className="employee-topbar-inner">

          <Link
            to="/"
            className="employee-brand"
          >
            <span className="employee-brand-mark">
              <Dumbbell size={18} />
            </span>

            <span>FORGE FITNESS</span>
          </Link>

          <span className="employee-role-pill">
            EMPLOYEE
          </span>

          <div className="employee-topbar-user">
            <div className="employee-avatar employee-avatar-small">
              {initials}
            </div>

            <div className="employee-user-copy">
              <strong>
                {employeeData?.full_name ||
                  'Employee'}
              </strong>

              <span>
                {employeeData?.email ||
                  'employee@gym.com'}
              </span>
            </div>

            <button
              type="button"
              className="employee-logout"
              onClick={handleLogout}
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>

          <button
            type="button"
            className="employee-mobile-menu"
            onClick={() =>
              setMobileMenuOpen(
                (current) => !current
              )
            }
            aria-label="Toggle employee navigation"
          >
            {mobileMenuOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>

        </div>
      </header>

      {/* ==================================
          MAIN LAYOUT
      =================================== */}
      <div className="employee-layout">

        {/* ==================================
            SIDEBAR
        =================================== */}
        <aside
          className={`employee-sidebar ${
            mobileMenuOpen ? 'is-open' : ''
          }`}
        >

          <div className="employee-profile-card">
            <div className="employee-avatar">
              {initials}
            </div>

            <div className="employee-profile-copy">
              <p>STAFF ACCOUNT</p>

              <h2>
                {employeeData?.full_name ||
                  'Employee'}
              </h2>

              <span>
                @{employeeData?.username ||
                  'employee'}
              </span>
            </div>
          </div>

          <div className="employee-sidebar-section">
            <p className="employee-sidebar-label">
              WORKSPACE
            </p>

            <nav className="employee-nav">
              {EMPLOYEE_TABS.map(
                ({
                  key,
                  label,
                  icon: Icon,
                }) => (
                  <button
                    key={key}
                    type="button"
                    className={`employee-nav-item ${
                      activeTab === key
                        ? 'is-active'
                        : ''
                    }`}
                    onClick={() =>
                      handleTabChange(key)
                    }
                  >
                    <span className="employee-nav-icon">
                      <Icon size={17} />
                    </span>

                    <span>{label}</span>
                  </button>
                )
              )}
            </nav>
          </div>

          <div className="employee-sidebar-info">
            <div className="employee-info-icon">
              <BadgeCheck size={17} />
            </div>

            <div>
              <strong>
                Staff access
              </strong>

              <span>
                You have access to daily gym
                operations and member services.
              </span>
            </div>
          </div>

          <div className="employee-sidebar-footer">
            <span className="employee-status-dot" />

            <div>
              <strong>
                Account active
              </strong>

              <span>
                Forge Fitness staff
              </span>
            </div>
          </div>

        </aside>

        {/* ==================================
            CONTENT
        =================================== */}
        <section className="employee-content">

          {/* HEADING */}
          <div className="employee-heading">
            <div>
              <p className="employee-eyebrow">
                STAFF WORKSPACE
              </p>

              <h1>
                Good morning,{' '}
                <span>{firstName}.</span>
              </h1>

              <p>
                Manage members, payments, and
                membership plans from one workspace.
              </p>
            </div>

            <div className="employee-status-card">
              <span className="employee-status-icon">
                <BadgeCheck size={18} />
              </span>

              <div>
                <strong>
                  Employee access
                </strong>

                <span>
                  Authenticated and active
                </span>
              </div>
            </div>
          </div>

          {/* QUICK TABS */}
          <div className="employee-summary-grid">
            {EMPLOYEE_TABS.map(
              ({
                key,
                label,
                icon: Icon,
              }) => (
                <button
                  key={key}
                  type="button"
                  className={`employee-summary-card ${
                    activeTab === key
                      ? 'is-active'
                      : ''
                  }`}
                  onClick={() =>
                    handleTabChange(key)
                  }
                >
                  <span className="employee-summary-icon">
                    <Icon size={17} />
                  </span>

                  <div>
                    <span>
                      Workspace
                    </span>

                    <strong>
                      {label}
                    </strong>
                  </div>
                </button>
              )
            )}
          </div>

          {/* WORKSPACE */}
          <section className="employee-workspace">

            <div className="employee-workspace-header">
              <div>
                <p className="employee-workspace-kicker">
                  {activeTabMeta.eyebrow}
                </p>

                <h2>
                  {activeTabMeta.label}
                </h2>

                <p>
                  {activeTabMeta.description}
                </p>
              </div>

              <div className="employee-workspace-badge">
                <BadgeCheck size={14} />
                Staff view
              </div>
            </div>

            <div className="employee-panel">

              {activeTab === 'members' && (
                <MemberManagement />
              )}

              {activeTab === 'payments' && (
                <PaymentProcessing />
              )}

              {activeTab === 'plans' && (
                <MembershipManagement />
              )}

            </div>

          </section>

        </section>
      </div>
    </main>
  );
};

export default EmployeeDashboard;