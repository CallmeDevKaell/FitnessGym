import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Dumbbell,
  ShieldAlert,
} from 'lucide-react';
import { supabase } from '../../services/supabase';

const MyMembership = ({ userId }) => {
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchMembership = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('members')
        .select(`
          id,
          user_id,
          membership_plan_id,
          card_number,
          start_date,
          end_date,
          status,
          created_at,
          membership_plan:membership_plan_id(
            id,
            name,
            description,
            duration_months,
            price
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!mounted) return;

      if (fetchError) {
        console.error('Membership fetch error:', fetchError);
        setError('Unable to load your membership information.');
        setMembership(null);
      } else {
        setMembership(data || null);
      }

      setLoading(false);
    };

    fetchMembership();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const membershipState = useMemo(() => {
    if (!membership) {
      return {
        isExpired: false,
        daysLeft: 0,
        progress: 0,
        label: 'No membership',
      };
    }

    const today = new Date();
    const start = new Date(`${membership.start_date}T00:00:00`);
    const end = new Date(`${membership.end_date}T23:59:59`);

    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = today.getTime() - start.getTime();

    const daysLeft = Math.max(
      0,
      Math.ceil((end.getTime() - today.getTime()) / 86400000)
    );

    const isExpired =
      end.getTime() < today.getTime() || membership.status === 'expired';

    const progress =
      totalMs > 0
        ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100))
        : 100;

    return {
      isExpired,
      daysLeft,
      progress,
      label: isExpired ? 'Expired' : 'Active',
    };
  }, [membership]);

  const formatDate = (value) => {
    if (!value) return '—';

    return new Intl.DateTimeFormat('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
  };

  if (loading) {
    return (
      <div className="client-section-loading">
        <div className="client-section-spinner" />
        <p>Loading your membership...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-empty-state client-empty-error">
        <span className="client-empty-icon">
          <ShieldAlert size={22} />
        </span>
        <h3>Unable to load membership</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="client-empty-state">
        <span className="client-empty-icon">
          <Dumbbell size={24} />
        </span>

        <p className="client-card-kicker">MEMBERSHIP</p>

        <h3>No membership yet</h3>

        <p>
          You do not have a membership record yet. Once an employee processes
          your membership, your plan and validity details will appear here.
        </p>
      </div>
    );
  }

  const plan = membership.membership_plan;

  return (
    <div className="membership-view">
      <div className="membership-hero">
        <div className="membership-hero-glow" />

        <div className="membership-hero-top">
          <div>
            <p className="membership-kicker">MEMBERSHIP CARD</p>
            <h3>{plan?.name || 'Membership Plan'}</h3>
            <p>
              {plan?.description || 'Your current Forge Fitness membership.'}
            </p>
          </div>

          <div className="membership-card-chip">
            <CreditCard size={18} />
            <span>{membership.card_number || 'NO CARD NUMBER'}</span>
          </div>
        </div>

        <div className="membership-hero-bottom">
          <div>
            <span>Status</span>
            <strong
              className={
                membershipState.isExpired
                  ? 'membership-status expired'
                  : 'membership-status active'
              }
            >
              {membershipState.isExpired ? (
                <ShieldAlert size={14} />
              ) : (
                <CheckCircle2 size={14} />
              )}
              {membershipState.label}
            </strong>
          </div>

          <div className="membership-days">
            <span>{membershipState.isExpired ? 'Status' : 'Time remaining'}</span>
            <strong>
              {membershipState.isExpired
                ? 'Expired'
                : `${membershipState.daysLeft} days`}
            </strong>
          </div>
        </div>
      </div>

      <div className="membership-progress-card">
        <div className="membership-progress-head">
          <div>
            <span>Membership progress</span>
            <strong>
              {membershipState.isExpired
                ? 'Membership period completed'
                : `${Math.round(membershipState.progress)}% elapsed`}
            </strong>
          </div>

          <span className="membership-progress-label">
            {membershipState.isExpired ? 'Expired' : 'Active'}
          </span>
        </div>

        <div className="membership-progress-track">
          <div
            className={`membership-progress-bar ${
              membershipState.isExpired ? 'is-expired' : ''
            }`}
            style={{ width: `${membershipState.progress}%` }}
          />
        </div>
      </div>

      <div className="membership-info-grid">
        <div className="membership-info-card">
          <span className="membership-info-icon">
            <Dumbbell size={17} />
          </span>

          <div>
            <span>Plan</span>
            <strong>{plan?.name || '—'}</strong>
          </div>
        </div>

        <div className="membership-info-card">
          <span className="membership-info-icon">
            <CalendarDays size={17} />
          </span>

          <div>
            <span>Start date</span>
            <strong>{formatDate(membership.start_date)}</strong>
          </div>
        </div>

        <div className="membership-info-card">
          <span className="membership-info-icon">
            <Clock3 size={17} />
          </span>

          <div>
            <span>End date</span>
            <strong>{formatDate(membership.end_date)}</strong>
          </div>
        </div>

        <div className="membership-info-card">
          <span className="membership-info-icon">
            <CreditCard size={17} />
          </span>

          <div>
            <span>Plan price</span>
            <strong>
              ₱{Number(plan?.price || 0).toLocaleString('en-PH', {
                minimumFractionDigits: 2,
              })}
            </strong>
          </div>
        </div>
      </div>

      <div className="membership-note">
        <CheckCircle2 size={16} />
        <span>
          Membership information shown here comes directly from your approved
          member record.
        </span>
      </div>
    </div>
  );
};

export default MyMembership;