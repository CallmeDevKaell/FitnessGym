import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Dumbbell,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import '../../styles/SetPassword.css';

const SetPassword = () => {
  const navigate = useNavigate();

  const [recoveryReady, setRecoveryReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    document.title = 'Set Password | Forge Fitness';

    let cancelled = false;

    const initializeRecovery = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!cancelled && session) {
        setRecoveryReady(true);
      }

      if (!cancelled) {
        setLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setRecoveryReady(true);
        setLoading(false);
        setError('');
      }
    });

    initializeRecovery();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      document.title = 'Forge Fitness';
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!recoveryReady) {
      setError(
        'Please open the password setup page using the secure link sent to your email.'
      );
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(
        'Password created successfully. Redirecting you to sign in...'
      );

      await supabase.auth.signOut();

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1400);
    } catch (err) {
      console.error('Set password error:', err);
      setError(
        err?.message ||
          'Unable to create your password. Please request a new setup email.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="set-password-page">
      <section className="set-password-card">
        <div className="set-password-brand">
          <span className="set-password-mark">
            <Dumbbell size={18} />
          </span>
          <span>FORGE FITNESS</span>
        </div>

        <div className="set-password-heading">
          <p>ACCOUNT SETUP</p>
          <h1>Create your password.</h1>
          <span>
            Your registration was approved. Choose a password to secure your
            Forge Fitness account.
          </span>
        </div>

        {loading ? (
          <div className="set-password-message">
            <Loader2 size={24} className="set-password-loader" />
            <h2>Checking secure link...</h2>
          </div>
        ) : !recoveryReady ? (
          <div className="set-password-message">
            <div className="set-password-message-icon">✉</div>
            <h2>Use your email link</h2>
            <p>
              Open the secure password setup link sent to your registered email
              address.
            </p>
            <Link to="/login" className="set-password-link">
              Return to sign in
            </Link>
          </div>
        ) : (
          <form className="set-password-form" onSubmit={handleSubmit}>
            {error && <div className="set-password-error">{error}</div>}

            {success && (
              <div className="set-password-success">
                <CheckCircle2 size={18} />
                <span>{success}</span>
              </div>
            )}

            <div className="set-password-field">
              <label htmlFor="new-password">New password</label>
              <div className="set-password-input-wrap">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="set-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="set-password-field">
              <label htmlFor="confirm-password">Confirm password</label>
              <div className="set-password-input-wrap">
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Enter the password again"
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="set-password-toggle"
                  onClick={() => setShowConfirm((value) => !value)}
                >
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="set-password-submit"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="set-password-spinner" />
                  Saving password...
                </>
              ) : (
                'Create password'
              )}
            </button>
          </form>
        )}

        <p className="set-password-footer">
          Secure password setup · Forge Fitness
        </p>
      </section>
    </main>
  );
};

export default SetPassword;
