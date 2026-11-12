import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, CalendarClock, KeyRound, RefreshCw, Search, ShieldCheck, UserRound } from 'lucide-react';
import { supabase } from '../../services/supabase';
import '../../styles/SecurityActivity.css';

const formatManilaDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

export default function SecurityActivity() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState('all');

  const fetchEvents = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase
        .from('user_security_events')
        .select('id, user_id, user_name, user_email, user_role, event_type, event_details, changed_at')
        .order('changed_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching security activity:', error);
      setErrorMessage(error?.message || 'Unable to load security activity.');
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const filteredEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const now = Date.now();
    const days = period === '30' ? 30 : period === '90' ? 90 : null;

    return events.filter((event) => {
      const matchesSearch = !query || [
        event.user_name,
        event.user_email,
        event.user_id,
        event.event_details,
      ].some((value) => String(value || '').toLowerCase().includes(query));
      const matchesPeriod = !days || (now - new Date(event.changed_at).getTime()) <= days * 86400000;
      return matchesSearch && matchesPeriod;
    });
  }, [events, searchTerm, period]);

  const lastChange = events[0]?.changed_at;
  const recentCount = events.filter((event) => (Date.now() - new Date(event.changed_at).getTime()) <= 30 * 86400000).length;

  return (
    <section className="security-activity">
      <div className="security-activity-header">
        <div className="security-activity-title-wrap">
          <div className="security-activity-icon"><ShieldCheck size={21} /></div>
          <div>
            <p className="security-activity-eyebrow">SECURITY MONITORING</p>
            <h2>Security Activity</h2>
            <p>Review client password changes and account security events.</p>
          </div>
        </div>
        <button className="security-activity-refresh" type="button" onClick={() => fetchEvents(true)} disabled={refreshing}>
          <RefreshCw size={15} className={refreshing ? 'is-spinning' : ''} />
          {refreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      <div className="security-activity-stats">
        <article className="security-activity-stat">
          <span><Activity size={17} /></span>
          <div><small>Total password changes</small><strong>{events.length}</strong></div>
        </article>
        <article className="security-activity-stat">
          <span><CalendarClock size={17} /></span>
          <div><small>Last 30 days</small><strong>{recentCount}</strong></div>
        </article>
        <article className="security-activity-stat security-activity-stat-wide">
          <span><KeyRound size={17} /></span>
          <div><small>Most recent activity</small><strong>{lastChange ? formatManilaDate(lastChange) : 'No activity recorded'}</strong></div>
        </article>
      </div>

      <div className="security-activity-toolbar">
        <label className="security-activity-search">
          <Search size={16} />
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search client name, email, or account ID..." />
        </label>
        <select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Filter security activity by date">
          <option value="all">All time</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {errorMessage && <div className="security-activity-error" role="alert">{errorMessage}</div>}

      {loading ? (
        <div className="security-activity-empty"><div className="security-activity-loader" /><strong>Loading security activity...</strong></div>
      ) : filteredEvents.length === 0 ? (
        <div className="security-activity-empty">
          <div className="security-activity-empty-icon"><ShieldCheck size={25} /></div>
          <strong>{events.length === 0 ? 'No password changes recorded yet' : 'No matching activity found'}</strong>
          <p>{events.length === 0 ? 'Client password changes will appear here after the security log is installed.' : 'Try a different search term or date filter.'}</p>
        </div>
      ) : (
        <div className="security-activity-list">
          {filteredEvents.map((event) => (
            <article className="security-activity-row" key={event.id}>
              <div className="security-activity-row-icon"><KeyRound size={17} /></div>
              <div className="security-activity-row-main">
                <div className="security-activity-row-heading">
                  <strong>{event.user_name || 'Client account'}</strong>
                  <span className="security-activity-badge"><ShieldCheck size={12} /> Password changed</span>
                </div>
                <p>{event.user_email || 'No email recorded'}</p>
                <small><UserRound size={12} /> {event.user_role || 'client'} account · {event.event_details || 'Client changed their account password.'}</small>
              </div>
              <time dateTime={event.changed_at}>{formatManilaDate(event.changed_at)}</time>
            </article>
          ))}
        </div>
      )}

      <p className="security-activity-note">For security, this log records the account, event type, and timestamp only. It never stores or displays passwords or password hashes.</p>
    </section>
  );
}
