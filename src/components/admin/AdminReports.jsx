import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import '../../styles/AdminReports.css';

const money = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const localDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayKey = () => localDateKey(new Date());
const monthKey = () => todayKey().slice(0, 7);

const dateFromKey = (key) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const prettyDate = (key, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  if (!key) return '—';
  return dateFromKey(key).toLocaleDateString('en-PH', options);
};

const paymentDateKey = (payment) => {
  const value = payment.payment_date || payment.created_at || payment.approved_at;
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : localDateKey(parsed);
};

const getRange = ({ period, selectedDate, selectedMonth, selectedYear, customStart, customEnd }) => {
  if (period === 'daily') return { start: selectedDate, end: selectedDate };

  if (period === 'monthly') {
    const [year, month] = selectedMonth.split('-').map(Number);
    if (!year || !month) return { start: '', end: '' };
    const lastDay = new Date(year, month, 0).getDate();
    return {
      start: `${selectedMonth}-01`,
      end: `${selectedMonth}-${String(lastDay).padStart(2, '0')}`,
    };
  }

  if (period === 'yearly') {
    return { start: `${selectedYear}-01-01`, end: `${selectedYear}-12-31` };
  }

  return { start: customStart, end: customEnd };
};

function RevenueChart({ data, period }) {
  const width = 1000;
  const height = 310;
  const padding = { top: 22, right: 22, bottom: 48, left: 84 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const values = data.map((item) => item.value);
  const rawMax = Math.max(0, ...values);
  const maxValue = rawMax > 0 ? rawMax * 1.15 : 1;
  const slotWidth = plotWidth / Math.max(data.length, 1);
  const barWidth = Math.min(34, Math.max(5, slotWidth * 0.62));
  const tickValues = Array.from({ length: 5 }, (_, index) => (maxValue / 4) * index).reverse();
  const labelEvery = data.length > 24 ? Math.ceil(data.length / 8) : data.length > 12 ? 2 : 1;

  return (
    <div className="fr-chart-wrap">
      <svg
        className="fr-revenue-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Revenue chart for the selected date range"
      >
        {tickValues.map((tick, index) => {
          const y = padding.top + (plotHeight / 4) * index;
          return (
            <g key={`tick-${index}`}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                className="fr-chart-gridline"
              />
              <text x={padding.left - 12} y={y + 4} textAnchor="end" className="fr-chart-axis-label">
                {tick >= 1000 ? `₱${(tick / 1000).toFixed(1)}k` : `₱${Math.round(tick)}`}
              </text>
            </g>
          );
        })}

        {data.map((item, index) => {
          const barHeight = item.value > 0 ? (item.value / maxValue) * plotHeight : 0;
          const x = padding.left + index * slotWidth + (slotWidth - barWidth) / 2;
          const y = padding.top + plotHeight - barHeight;
          const showLabel = index % labelEvery === 0 || index === data.length - 1;
          return (
            <g key={`${item.label}-${index}`}>
              {item.value > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(2, barHeight)}
                  rx="5"
                  className="fr-chart-bar"
                >
                  <title>{`${item.label}: ${money(item.value)}`}</title>
                </rect>
              )}
              {showLabel && (
                <text
                  x={padding.left + index * slotWidth + slotWidth / 2}
                  y={height - 17}
                  textAnchor="middle"
                  className="fr-chart-axis-label"
                >
                  {item.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {rawMax === 0 && (
        <div className="fr-chart-empty">
          <span className="fr-empty-icon"><Wallet size={21} /></span>
          <strong>No approved payments for this period</strong>
          <span>Approved gym payments will appear here once recorded.</span>
        </div>
      )}
    </div>
  );
}

export default function AdminReports() {
  const currentDate = todayKey();
  const [period, setPeriod] = useState('yearly');
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [selectedMonth, setSelectedMonth] = useState(monthKey());
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [customStart, setCustomStart] = useState(`${monthKey()}-01`);
  const [customEnd, setCustomEnd] = useState(currentDate);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: queryError } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          status,
          payment_method,
          receipt_number,
          payment_date,
          approved_at,
          created_at,
          member:members!payments_member_id_fkey(
            id,
            membership_plan:membership_plans!members_membership_plan_id_fkey(name)
          )
        `)
        .eq('status', 'approved')
        .order('payment_date', { ascending: true });

      if (queryError) throw queryError;
      setPayments(data || []);
    } catch (fetchError) {
      console.error('Admin reports: unable to fetch approved payments:', fetchError);
      setError(fetchError.message || 'Unable to load report data. Please try again.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const range = useMemo(
    () => getRange({ period, selectedDate, selectedMonth, selectedYear, customStart, customEnd }),
    [period, selectedDate, selectedMonth, selectedYear, customStart, customEnd]
  );

  const validRange = Boolean(range.start && range.end && range.start <= range.end);

  const filteredPayments = useMemo(() => {
    if (!validRange) return [];
    return payments.filter((payment) => {
      const date = paymentDateKey(payment);
      return date && date >= range.start && date <= range.end;
    });
  }, [payments, range.start, range.end, validRange]);

  const totalRevenue = useMemo(
    () => filteredPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [filteredPayments]
  );
  const paymentCount = filteredPayments.length;
  const averagePayment = paymentCount ? totalRevenue / paymentCount : 0;

  const chartData = useMemo(() => {
    if (!validRange) return [];

    if (period === 'daily') {
      return Array.from({ length: 24 }, (_, hour) => {
        const value = filteredPayments.reduce((sum, payment) => {
          const timestamp = payment.payment_date || payment.created_at || payment.approved_at;
          const date = timestamp ? new Date(timestamp) : null;
          return date && date.getHours() === hour ? sum + Number(payment.amount || 0) : sum;
        }, 0);
        const label = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
        return { label, value };
      });
    }

    if (period === 'yearly') {
      return Array.from({ length: 12 }, (_, monthIndex) => {
        const label = new Date(Number(selectedYear), monthIndex, 1).toLocaleDateString('en-PH', { month: 'short' });
        const prefix = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
        const value = filteredPayments.reduce(
          (sum, payment) => sum + (paymentDateKey(payment).startsWith(prefix) ? Number(payment.amount || 0) : 0),
          0
        );
        return { label, value };
      });
    }

    const start = dateFromKey(range.start);
    const end = dateFromKey(range.end);
    const dayCount = Math.max(1, Math.round((end - start) / 86400000) + 1);
    const buckets = [];
    const useWeekly = period === 'custom' && dayCount > 45;
    const step = useWeekly ? 7 : 1;

    for (let offset = 0; offset < dayCount; offset += step) {
      const bucketStart = new Date(start);
      bucketStart.setDate(start.getDate() + offset);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setDate(bucketEnd.getDate() + step - 1);
      if (bucketEnd > end) bucketEnd.setTime(end.getTime());
      const startKey = localDateKey(bucketStart);
      const endKey = localDateKey(bucketEnd);
      const label = useWeekly
        ? prettyDate(startKey, { month: 'short', day: 'numeric' })
        : period === 'monthly'
          ? String(bucketStart.getDate())
          : prettyDate(startKey, { month: 'short', day: 'numeric' });
      const value = filteredPayments.reduce((sum, payment) => {
        const date = paymentDateKey(payment);
        return date >= startKey && date <= endKey ? sum + Number(payment.amount || 0) : sum;
      }, 0);
      buckets.push({ label, value });
    }
    return buckets;
  }, [filteredPayments, period, range.start, range.end, selectedYear, validRange]);

  const planBreakdown = useMemo(() => {
    const groups = new Map();
    filteredPayments.forEach((payment) => {
      const member = Array.isArray(payment.member) ? payment.member[0] : payment.member;
      const plan = Array.isArray(member?.membership_plan) ? member.membership_plan[0] : member?.membership_plan;
      const name = plan?.name || 'Unassigned plan';
      const current = groups.get(name) || { name, count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += Number(payment.amount || 0);
      groups.set(name, current);
    });
    return [...groups.values()].sort((a, b) => b.revenue - a.revenue);
  }, [filteredPayments]);

  const hourlyBreakdown = useMemo(() => {
    const groups = new Map();
    filteredPayments.forEach((payment) => {
      const timestamp = payment.payment_date || payment.created_at || payment.approved_at;
      const date = timestamp ? new Date(timestamp) : null;
      if (!date || Number.isNaN(date.getTime())) return;
      const hour = date.getHours();
      const current = groups.get(hour) || { hour, count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += Number(payment.amount || 0);
      groups.set(hour, current);
    });
    return [...groups.values()].sort((a, b) => a.hour - b.hour);
  }, [filteredPayments]);

  const rangeLabel = useMemo(() => {
    if (!validRange) return 'Invalid date range';
    if (period === 'daily') return prettyDate(selectedDate);
    if (period === 'monthly') return dateFromKey(`${selectedMonth}-01`).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
    if (period === 'yearly') return selectedYear;
    return `${prettyDate(range.start)} – ${prettyDate(range.end)}`;
  }, [period, selectedDate, selectedMonth, selectedYear, range.start, range.end, validRange]);

  const handlePeriodChange = (nextPeriod) => setPeriod(nextPeriod);

  return (
    <section className="forge-reports">
      <div className="fr-heading-row">
        <div className="fr-heading-copy">
          <p className="fr-eyebrow">INSIGHTS</p>
          <div className="fr-title-line">
            <span className="fr-title-icon"><BarChart3 size={22} /></span>
            <h2>Analytics &amp; Reports</h2>
          </div>
          <p className="fr-subtitle">Track gym revenue and membership payment performance.</p>
        </div>
        <div className="fr-period-tabs" role="tablist" aria-label="Report period">
          {[
            ['daily', 'Daily'],
            ['monthly', 'Monthly'],
            ['yearly', 'Yearly'],
            ['custom', 'Custom Date'],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              role="tab"
              aria-selected={period === value}
              className={`fr-period-tab ${period === value ? 'is-active' : ''}`}
              onClick={() => handlePeriodChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="fr-date-panel">
        <div className="fr-date-label"><CalendarDays size={16} /> Select Period</div>
        {period === 'daily' && (
          <>
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            <button type="button" className="fr-today-button" onClick={() => setSelectedDate(todayKey())}>Today</button>
          </>
        )}
        {period === 'monthly' && (
          <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
        )}
        {period === 'yearly' && (
          <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} aria-label="Select year">
            {Array.from({ length: 8 }, (_, index) => String(new Date().getFullYear() - 5 + index)).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        )}
        {period === 'custom' && (
          <div className="fr-custom-dates">
            <label><span>From</span><input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></label>
            <span className="fr-date-dash">to</span>
            <label><span>To</span><input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></label>
          </div>
        )}
        <div className="fr-date-spacer" />
        <button type="button" className="fr-refresh-button" onClick={fetchPayments} disabled={loading} aria-label="Refresh report">
          <RefreshCw size={16} className={loading ? 'fr-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {!validRange && (
        <div className="fr-error-banner">Please choose a valid date range. The end date must not be earlier than the start date.</div>
      )}
      {error && <div className="fr-error-banner">Unable to load reports: {error}</div>}

      <div className="fr-kpi-grid">
        <article className="fr-kpi-card">
          <span className="fr-kpi-icon"><Wallet size={18} /></span>
          <div><p>Total Revenue</p><strong>{loading ? '—' : money(totalRevenue)}</strong><small>Approved payments only</small></div>
        </article>
        <article className="fr-kpi-card">
          <span className="fr-kpi-icon"><CreditCard size={18} /></span>
          <div><p>Approved Payments</p><strong>{loading ? '—' : paymentCount}</strong><small>Completed transactions</small></div>
        </article>
        <article className="fr-kpi-card">
          <span className="fr-kpi-icon"><CheckCircle2 size={18} /></span>
          <div><p>Average Payment</p><strong>{loading ? '—' : money(averagePayment)}</strong><small>Revenue per approved payment</small></div>
        </article>
      </div>

      <article className="fr-report-panel fr-main-chart-panel">
        <div className="fr-panel-heading">
          <div>
            <h3>{period === 'daily' ? 'Daily Revenue' : period === 'monthly' ? 'Monthly Revenue' : period === 'yearly' ? 'Yearly Revenue' : 'Revenue for Selected Dates'}</h3>
            <p>Approved membership payments · {rangeLabel}</p>
          </div>
          <span className="fr-period-total">{loading ? 'Loading…' : money(totalRevenue)}</span>
        </div>
        {loading ? (
          <div className="fr-loading-state"><span className="fr-loader" /> Loading approved payments…</div>
        ) : error ? (
          <div className="fr-chart-placeholder">Report data could not be loaded. Check your connection and refresh.</div>
        ) : !validRange ? (
          <div className="fr-chart-placeholder">Select a valid date range to view revenue.</div>
        ) : (
          <RevenueChart data={chartData} period={period} />
        )}
      </article>

      <div className="fr-secondary-grid">
        <article className="fr-report-panel">
          <div className="fr-panel-heading">
            <div>
              <h3>{period === 'daily' ? 'Hourly Revenue Breakdown' : 'Membership Plan Breakdown'}</h3>
              <p>{period === 'daily' ? 'Approved payments grouped by transaction hour.' : 'Revenue generated by each membership plan in this period.'}</p>
            </div>
            <span className="fr-small-panel-icon">{period === 'daily' ? <Clock3 size={17} /> : <CreditCard size={17} />}</span>
          </div>
          {loading ? (
            <div className="fr-chart-placeholder compact">Loading breakdown…</div>
          ) : period === 'daily' ? (
            hourlyBreakdown.length ? (
              <div className="fr-breakdown-list">
                {hourlyBreakdown.map((item) => {
                  const label = new Date(2000, 0, 1, item.hour).toLocaleTimeString('en-PH', { hour: 'numeric', hour12: true });
                  const share = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
                  return (
                    <div className="fr-breakdown-row" key={item.hour}>
                      <div className="fr-breakdown-meta"><strong>{label}</strong><span>{item.count} payment{item.count !== 1 ? 's' : ''}</span><b>{money(item.revenue)}</b></div>
                      <div className="fr-breakdown-track"><span style={{ width: `${share}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="fr-chart-placeholder compact">No approved payments for this day.</div>
            )
          ) : planBreakdown.length ? (
            <div className="fr-breakdown-list">
              {planBreakdown.map((item) => {
                const share = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
                return (
                  <div className="fr-breakdown-row" key={item.name}>
                    <div className="fr-breakdown-meta"><strong>{item.name}</strong><span>{item.count} payment{item.count !== 1 ? 's' : ''}</span><b>{money(item.revenue)}</b></div>
                    <div className="fr-breakdown-track"><span style={{ width: `${share}%` }} /></div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="fr-chart-placeholder compact">No membership plan sales for this period.</div>
          )}
        </article>

        <article className="fr-report-panel fr-payment-note-panel">
          <div className="fr-panel-heading">
            <div>
              <h3>Report Information</h3>
              <p>How Forge Fitness calculates this report.</p>
            </div>
            <span className="fr-small-panel-icon"><BarChart3 size={17} /></span>
          </div>
          <div className="fr-report-notes">
            <div><span className="fr-note-dot" /><p><strong>Revenue</strong> includes approved payments only. Pending and rejected payments are excluded.</p></div>
            <div><span className="fr-note-dot" /><p><strong>Transaction date</strong> is based on the payment date saved in Supabase.</p></div>
            <div><span className="fr-note-dot" /><p><strong>Average payment</strong> is total approved revenue divided by the number of approved payments.</p></div>
          </div>
        </article>
      </div>
    </section>
  );
}
