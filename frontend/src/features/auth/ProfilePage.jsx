import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Save, UserRound } from 'lucide-react';

import { updateMyProfile } from './authApi';

import { useAuth } from './useAuth';

import './profile.css';
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

  return (
    /* Display the "My Profile" section and its related actions. */
    <section className="profile-page">
      {/* Show this section's heading, context, and available actions. */}
      <header className="profile-header">
        <h1>My Profile</h1>

        <p>Manage your personal account information.</p>
        {user?.role === 'CUSTOMER' && (
          <>
            <Link to="/">Back to Homepage</Link>
            {' · '}
            <Link to="/change-password">Change Password</Link>
          </>
        )}
      </header>

      {/* Collect the auth form fields and submit them through the handler above. */}
      <form className="profile-card" onSubmit={handleSubmit}>
        <div className="profile-card-heading">
          <div className="profile-large-avatar">
            <UserRound size={28} />
          </div>

          <div>
            <strong>
              {user?.firstName} {user?.lastName}
            </strong>

            <span>{user?.role}</span>
          </div>
        </div>

        <div className="profile-form-grid">
          <label>
            First Name
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              maxLength={80}
              required
            />
          </label>

          <label>
            Last Name
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              maxLength={80}
              required
            />
          </label>

          <label>
            Username
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              maxLength={80}
            />
          </label>

          <label>
            Phone
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              maxLength={30}
            />
          </label>

          <label className="profile-full-field">
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              maxLength={255}
              required
            />
          </label>

          <label>
            Role
            <input type="text" value={user?.role ?? ''} disabled readOnly />
          </label>

          <label>
            Status
            <input type="text" value={user?.status ?? ''} disabled readOnly />
          </label>
        </div>

        <div className="profile-actions">
          <button type="submit" disabled={saving}>
            <Save size={16} />

            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
      {user?.role === 'CUSTOMER' && <CustomerNotifications />}
    </section>
  );
}
