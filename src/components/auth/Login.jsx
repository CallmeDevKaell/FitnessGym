import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Dumbbell,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import '../../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Sign In | Forge Fitness';

    return () => {
      document.title = 'Forge Fitness';
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError('');
    setLoading(true);

    const loginEmail = email.trim().toLowerCase();

    try {
      if (!loginEmail || !password) {
        throw new Error('Please enter your email and password.');
      }

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });

      if (signInError) {
        throw new Error('Invalid email or password.');
      }

      if (!data?.user) {
        throw new Error('Unable to sign in. Please try again.');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, is_approved')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        await supabase.auth.signOut();
        throw new Error(
          'Your account profile could not be found. Please contact the administrator.'
        );
      }

      if (!userData.is_approved) {
        await supabase.auth.signOut();
        throw new Error(
          'Your account is still pending approval. Please wait for administrator confirmation.'
        );
      }

      switch (userData.role) {
        case 'admin':
          navigate('/admin/dashboard', { replace: true });
          break;

        case 'employee':
          navigate('/employee/dashboard', { replace: true });
          break;

        case 'client':
          navigate('/client/dashboard', { replace: true });
          break;

        default:
          await supabase.auth.signOut();
          throw new Error('Your account has an invalid role configuration.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err?.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-shell">
        <section className="login-hero">
          <div className="login-hero-overlay" />

          <div className="login-hero-content">
            <Link to="/" className="login-back-link">
              <ArrowLeft size={16} />
              Back to home
            </Link>

            <div className="login-brand">
              <span className="login-brand-mark">
                <Dumbbell size={18} />
              </span>
              <span>FORGE FITNESS</span>
            </div>

            <div className="login-hero-copy">
              <p className="login-eyebrow">WELCOME BACK</p>

              <h1>
                Keep showing
                <span> up for you.</span>
              </h1>

              <p className="login-hero-description">
                Your routine, your progress, your community. Everything you
                need to stay consistent is waiting inside.
              </p>

              <div className="login-hero-feature">
                <span className="login-feature-icon">
                  <ShieldCheck size={17} />
                </span>

                <div>
                  <strong>Secure member access</strong>
                  <span>
                    One login for Admin, Employee, and Client accounts.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-form-wrap">
            <div className="login-mobile-brand">
              <span className="login-brand-mark">
                <Dumbbell size={18} />
              </span>
              <span>FORGE FITNESS</span>
            </div>

            <div className="login-heading">
              <p className="login-form-kicker">MEMBER PORTAL</p>
              <h2>Sign in.</h2>
              <p>
                Access your Forge Fitness account using your registered email
                and password.
              </p>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <span className="login-error-dot" />
                <p>{error}</p>
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="login-field">
                <div className="login-field-label-row">
                  <label htmlFor="password">Password</label>
                </div>

                <div className="login-password-wrap">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="login-spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="login-bottom">
              
              <Link to="/" className="login-home-link">
                <ArrowLeft size={15} />
                Return to homepage
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
