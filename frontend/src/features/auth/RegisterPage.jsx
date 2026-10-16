import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import apiClient from '../../services/apiClient';
import './auth.css';

// Render the register page with its loading, error, and record/form states.
export default function RegisterPage() {
  // Track local state and read any session or route values needed by this component.
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Submit a customer registration and return to login with the existing success notice.
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form);
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    delete data.confirmPassword;
    if (!data.username) delete data.username;
    if (!data.phone) delete data.phone;
    setBusy(true);
    setError('');
    try {
      await apiClient.post('/auth/register', data);
      navigate('/login', {
        replace: true,
        state: { registrationComplete: true },
      });
    } catch (failure) {
      const message =
        failure.response?.data?.message || 'Unable to create your account.';
      setError(Array.isArray(message) ? message.join(' ') : message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      {/* Display the "Create Your Account" section and its related actions. */}
      <section className="login-form-panel">
        <div className="login-form-container">
          <Link className="login-back-link" to="/">
            <ArrowLeft size={16} /> Back to homepage
          </Link>
          <div className="login-heading">
            <Building2 size={30} />
            <h2>Create Your Account</h2>
            <p>Book your next coastal stay.</p>
          </div>
          {/* Collect the auth form fields and submit them through the handler above. */}
          <form className="login-form" onSubmit={submit}>
            {[
              ['firstName', 'First Name', 'text', 'given-name', 100],
              ['lastName', 'Last Name', 'text', 'family-name', 100],
              ['email', 'Email Address', 'email', 'email', 255],
              ['username', 'Username (optional)', 'text', 'username', 30],
              ['phone', 'Phone (optional)', 'tel', 'tel', 30],
              ['password', 'Password', 'password', 'new-password', 128],
              [
                'confirmPassword',
                'Confirm Password',
                'password',
                'new-password',
                128,
              ],
            ].map(([name, label, type, autoComplete, maxLength]) => (
              <label className="input-group" key={name}>
                {label}
                <div className="input-wrapper">
                  <input
                    name={name}
                    type={type}
                    autoComplete={autoComplete}
                    maxLength={maxLength}
                    minLength={
                      type === 'password'
                        ? 8
                        : name === 'username'
                          ? 3
                          : undefined
                    }
                    required={!['phone', 'username'].includes(name)}
                    disabled={busy}
                  />
                </div>
              </label>
            ))}
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}
            <button className="sign-in-button" disabled={busy}>
              {busy ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>
          <div className="login-footer">
            Already registered? <Link to="/login">Sign In</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
