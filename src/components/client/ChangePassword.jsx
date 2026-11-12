import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/ClientSecurity.css';

const INITIAL_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function ChangePassword() {
  const { userRole } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setSuccess('');
    setErrorMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccess('');
    setErrorMessage('');

    if (form.newPassword.length < 8) {
      setErrorMessage('Your new password must contain at least 8 characters.');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setErrorMessage('The new password and confirmation do not match.');
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setErrorMessage('Your new password must be different from your current password.');
      return;
    }

    setLoading(true);

    try {
      // Get the signed-in identity directly from Supabase Auth.
      const { data: authData, error: authUserError } = await supabase.auth.getUser();
      if (authUserError) throw authUserError;
      if (!authData?.user?.email) {
        throw new Error('We could not verify your signed-in email address. Please sign in again.');
      }

      // Verify the current password before allowing a change.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: authData.user.email,
        password: form.currentPassword,
      });

      if (verifyError) {
        throw new Error('Your current password is incorrect.');
      }

      // Supabase Auth performs the password update. The database trigger records
      // a password-change event without storing the new password or password hash.
      const { error: updateError } = await supabase.auth.updateUser({
        password: form.newPassword,
      });

      if (updateError) throw updateError;

      setForm(INITIAL_FORM);
      setSuccess('Your password has been changed successfully.');
    } catch (err) {
      console.error('Change password error:', err);
      setErrorMessage(err?.message || 'Unable to change your password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (userRole && userRole !== 'client') {
    return (
      <section className="client-security-panel">
        <div className="client-security-empty">
          <ShieldCheck size={28} />
          <h2>Client account security</h2>
          <p>This password panel is intended for client accounts.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="client-security-panel">
      <div className="client-security-header">
        <div className="client-security-title-icon"><KeyRound size={20} /></div>
        <div>
          <p className="client-security-eyebrow">ACCOUNT SECURITY</p>
          <h2>Change Password</h2>
          <p>Keep your Forge Fitness account protected with a password only you know.</p>
        </div>
      </div>

      <div className="client-security-notice">
        <LockKeyhole size={17} />
        <span>For your protection, enter your current password before choosing a new one.</span>
      </div>

      <form className="client-security-form" onSubmit={handleSubmit}>
        <label className="client-security-field">
          <span>Current password</span>
          <div className="client-security-input-wrap">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={form.currentPassword}
              onChange={updateField('currentPassword')}
              autoComplete="current-password"
              placeholder="Enter your current password"
              required
            />
            <button type="button" onClick={() => setShowCurrent((value) => !value)} aria-label={showCurrent ? 'Hide current password' : 'Show current password'}>
              {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>

        <label className="client-security-field">
          <span>New password</span>
          <div className="client-security-input-wrap">
            <input
              type={showNew ? 'text' : 'password'}
              value={form.newPassword}
              onChange={updateField('newPassword')}
              autoComplete="new-password"
              minLength={8}
              placeholder="Create a new password"
              required
            />
            <button type="button" onClick={() => setShowNew((value) => !value)} aria-label={showNew ? 'Hide new password' : 'Show new password'}>
              {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <small>Use at least 8 characters. A longer, unique password is recommended.</small>
        </label>

        <label className="client-security-field">
          <span>Confirm new password</span>
          <div className="client-security-input-wrap">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={updateField('confirmPassword')}
              autoComplete="new-password"
              minLength={8}
              placeholder="Re-enter your new password"
              required
            />
            <button type="button" onClick={() => setShowConfirm((value) => !value)} aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}>
              {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>

        {errorMessage && <div className="client-security-message is-error" role="alert">{errorMessage}</div>}
        {success && <div className="client-security-message is-success" role="status"><ShieldCheck size={16} />{success}</div>}

        <div className="client-security-actions">
          <button type="button" className="client-security-cancel" onClick={() => { setForm(INITIAL_FORM); setErrorMessage(''); setSuccess(''); }} disabled={loading}>
            Clear
          </button>
          <button type="submit" className="client-security-submit" disabled={loading}>
            <LockKeyhole size={16} />
            {loading ? 'Updating password...' : 'Update Password'}
          </button>
        </div>
      </form>

      <p className="client-security-footnote">A password-change event is recorded for the administrator’s security activity history. Your password itself is never displayed or stored in that history.</p>
    </section>
  );
}
