import { useState } from 'react';

import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Waves,
} from 'lucide-react';

import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from './useAuth';

import './auth.css';
import BrandLogo from '../../components/BrandLogo';

// Choose the existing customer or administration destination after authentication.
function getHomeRoute(role) {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';

    case 'STAFF':
      return '/admin/dashboard';

    case 'CUSTOMER':
      return '/rooms';

    default:
      return '/login';
  }
}

// Render the login page with its loading, error, and record/form states.
export default function LoginPage() {
  // Track local state and read any session or route values needed by this component.
  const navigate = useNavigate();
  const location = useLocation();
  const paymentReturn = location.state?.paymentReturn;
  // Only the two internal payment-result routes may override the usual role destination.
  const safePaymentReturn =
    typeof paymentReturn === 'string' &&
    /^\/payment\/(success|cancelled)(\?|$)/.test(paymentReturn)
      ? paymentReturn
      : null;

  const { login, user, isLoading, isAuthenticated } = useAuth();

  const [identifier, setIdentifier] = useState('');

  const [password, setPassword] = useState('');

  const [rememberMe, setRememberMe] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');

  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && isAuthenticated && user) {
    return (
      <Navigate to={safePaymentReturn || getHomeRoute(user.role)} replace />
    );
  }

  // Submit credentials, honor the temporary-password requirement, and resume a safe
  // payment return or role destination.
  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSubmitting(true);

    try {
      const loggedInUser = await login({
        identifier,
        password,
        rememberMe,
      });

      navigate(safePaymentReturn || getHomeRoute(loggedInUser.role), {
        replace: true,
      });
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        'Unable to sign in. Please try again.';

      setError(Array.isArray(message) ? message.join(' ') : message);
    } finally {
      setSubmitting(false);
    }
  }

  // Update the login identifier and clear its displayed error.
  function handleIdentifierChange(event) {
    setIdentifier(event.target.value);

    if (error) {
      setError('');
    }
  }

  // Update the login password and clear its displayed error.
  function handlePasswordChange(event) {
    setPassword(event.target.value);

    if (error) {
      setError('');
    }
  }

  return (
    <main className="login-page">
      {/* Display the "NEXORA" section and its related actions. */}
      <section className="login-visual">
        <div className="login-overlay" />

        <div className="login-brand">
          <BrandLogo light />

          <p>NFC SYSTEM WITH PAYMENT</p>
        </div>

        <div className="login-tagline">
          <h2>Smart Access. Seamless Stays.</h2>

          <p>
            Modern NEXORA management with NFC access and cashless payment.
          </p>

          <div className="login-feature">
            <Waves size={18} />
            Secure NFC-enabled access
          </div>
        </div>
      </section>

      {/* Display the "Welcome Back" section and its related actions. */}
      <section className="login-form-panel">
        <div className="login-form-container">
          <Link to="/" className="login-back-link">
            <ArrowLeft size={18} aria-hidden="true" />
            Back to homepage
          </Link>

          <div className="login-heading">
            <h2>Welcome Back!</h2>

            <p>Sign in to your account</p>
          </div>

          {/* Collect the auth form fields and submit them through the handler above. */}
          <form onSubmit={handleSubmit} className="login-form">
            <label className="input-group">
              <span>Email or Username</span>

              <div className="input-wrapper">
                <Mail size={18} />

                <input
                  type="text"
                  value={identifier}
                  onChange={handleIdentifierChange}
                  placeholder="Email or Username"
                  autoComplete="username"
                  required
                />
              </div>
            </label>

            <label className="input-group">
              <span>Password</span>

              <div className="input-wrapper">
                <KeyRound size={18} />

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <div className="login-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />

                <span>Remember me</span>
              </label>

              <button type="button" className="text-button">
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="sign-in-button"
              disabled={submitting}
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {location.state?.registrationComplete && (
            <p role="status">Account created. Sign in to continue.</p>
          )}
          <div className="login-footer">
            New here? <Link to="/register">Create an account</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
