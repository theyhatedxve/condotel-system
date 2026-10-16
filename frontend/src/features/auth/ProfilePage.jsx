import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  ChevronRight,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';

import { updateMyProfile } from './authApi';

import { useAuth } from './useAuth';

import './profile.css';
import ProfileSecurityCard from './ProfileSecurityCard';
import CustomerNotifications from '../notifications/CustomerNotifications';

// Render the profile page with its loading, error, and record/form states.
export default function ProfilePage() {
  // Track local state and read any session or route values needed by this component.
  const { user, refreshUser } = useAuth();

  const [form, setForm] = useState(() => ({
    email: user?.email ?? '',
    firstName: user?.firstName ?? '',

    lastName: user?.lastName ?? '',

    username: user?.username ?? '',

    phone: user?.phone ?? '',
  }));

  const [saving, setSaving] = useState(false);

  // Update the edited form field while retaining the other controlled form values.
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,

      [name]: value,
    }));
  }

  // Save profile edits and refresh the shared account state used elsewhere in the
  // interface.
  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    if (!form.firstName.trim() || !form.lastName.trim()) {
      window.alert('First name and last name are required.');

      return;
    }

    setSaving(true);

    try {
      const result = await updateMyProfile({
        email: form.email.trim(),
        firstName: form.firstName.trim(),

        lastName: form.lastName.trim(),

        username: form.username.trim() || null,

        phone: form.phone.trim() || null,
      });

      setForm({
        email: result.user.email,
        firstName: result.user.firstName ?? '',

        lastName: result.user.lastName ?? '',

        username: result.user.username ?? '',

        phone: result.user.phone ?? '',
      });

      await refreshUser();

      window.alert('Profile updated successfully.');
    } catch (error) {
      const message =
        error.response?.data?.message || 'Unable to update profile.';

      window.alert(Array.isArray(message) ? message.join(' ') : message);
    } finally {
      setSaving(false);
    }
  }

  const customer = user?.role === 'CUSTOMER';
  return (
    <section className="profile-page">
      <header className="profile-header">
        <div>
          <h1>My Profile</h1>
          <p>Manage your personal account information and security.</p>
        </div>
        <nav className="profile-breadcrumb" aria-label="Breadcrumb">
          <Link to={customer ? '/' : '/admin/dashboard'}>
            {customer ? 'Home' : 'Dashboard'}
          </Link>
          <ChevronRight size={15} aria-hidden="true" />
          <span aria-current="page">My Profile</span>
          {user?.role === 'CUSTOMER' && (
            <Link to="/my-bookings">My Bookings</Link>
          )}
        </nav>
      </header>
      <section className="profile-banner" aria-label="Your profile">
        <div className="profile-large-avatar" aria-hidden="true">
          {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="profile-banner-copy">
          <h2>
            {user?.firstName} {user?.lastName}
          </h2>
          <span className="profile-role-badge">{user?.role}</span>
          <p>Manage your personal account information and security.</p>
        </div>
      </section>
      <div className="profile-columns">
        <div className="profile-main-column">
          <section
            className="profile-card"
            aria-labelledby="profile-personal-title"
          >
            <div className="profile-section-heading">
              <span className="profile-section-icon">
                <UserRound size={24} />
              </span>
              <div>
                <h2 id="profile-personal-title">Personal Information</h2>
                <p>
                  Update your personal details for account and contact purposes.
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="profile-form-grid">
                {[
                  ['firstName', 'First Name', 'text', 'given-name', 80, true],
                  ['lastName', 'Last Name', 'text', 'family-name', 80, true],
                  ['username', 'Username', 'text', 'username', 80, false],
                  ['phone', 'Phone Number', 'tel', 'tel', 30, false],
                  ['email', 'Email Address', 'email', 'email', 255, true],
                ].map(
                  ([name, label, type, autoComplete, maxLength, required]) => (
                    <label
                      className={`profile-field${name === 'email' ? ' profile-full-field' : ''}`}
                      key={name}
                    >
                      <span>
                        {label}
                        {required && (
                          <span className="profile-required"> *</span>
                        )}
                      </span>
                      <span className="profile-input-shell">
                        {name === 'email' && (
                          <Mail size={17} aria-hidden="true" />
                        )}
                        {name === 'phone' && (
                          <Phone size={17} aria-hidden="true" />
                        )}
                        <input
                          type={type}
                          name={name}
                          value={form[name]}
                          onChange={handleChange}
                          autoComplete={autoComplete}
                          maxLength={maxLength}
                          required={required}
                          disabled={saving}
                        />
                      </span>
                    </label>
                  ),
                )}
              </div>
              <footer className="profile-actions">
                <button
                  type="button"
                  className="profile-cancel-button"
                  disabled={saving}
                  onClick={() =>
                    setForm({
                      email: user?.email ?? '',
                      firstName: user?.firstName ?? '',
                      lastName: user?.lastName ?? '',
                      username: user?.username ?? '',
                      phone: user?.phone ?? '',
                    })
                  }
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-save-button"
                  disabled={saving}
                >
                  <Save size={17} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </footer>
            </form>
          </section>
          {customer && <CustomerNotifications />}
        </div>
        <div className="profile-side-column">
          <section
            className="profile-card"
            aria-labelledby="profile-account-title"
          >
            <div className="profile-section-heading">
              <span className="profile-section-icon">
                <ShieldCheck size={24} />
              </span>
              <div>
                <h2 id="profile-account-title">Account Information</h2>
                <p>Your account role and status.</p>
              </div>
            </div>
            <dl className="profile-account-details">
              <div>
                <dt>
                  <span className="profile-account-icon">
                    <Users size={17} />
                  </span>
                  Role
                </dt>
                <dd className="profile-role-value">{user?.role ?? '—'}</dd>
              </div>
              <div>
                <dt>
                  <span className="profile-account-icon">
                    <span
                      className={`profile-status-dot${user?.status === 'ACTIVE' ? ' is-active' : ''}`}
                    />
                  </span>
                  Status
                </dt>
                <dd
                  className={`profile-status-value${user?.status === 'ACTIVE' ? ' is-active' : ''}`}
                >
                  {user?.status ?? '—'}
                </dd>
              </div>
            </dl>
          </section>
          <ProfileSecurityCard />
        </div>
      </div>
    </section>
  );
}
