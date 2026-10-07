import { useState } from 'react';

import { Save, UserRound } from 'lucide-react';

import { updateMyProfile } from './authApi';

import { useAuth } from './useAuth';

import './profile.css';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [form, setForm] = useState(() => ({
    firstName: user?.firstName ?? '',

    lastName: user?.lastName ?? '',

    username: user?.username ?? '',

    phone: user?.phone ?? '',
  }));

  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,

      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim()) {
      window.alert('First name and last name are required.');

      return;
    }

    setSaving(true);

    try {
      const result = await updateMyProfile({
        firstName: form.firstName.trim(),

        lastName: form.lastName.trim(),

        username: form.username.trim() || null,

        phone: form.phone.trim() || null,
      });

      setForm({
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
    <section className="profile-page">
      <header className="profile-header">
        <h1>My Profile</h1>

        <p>Manage your personal account information.</p>
      </header>

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
            <input type="email" value={user?.email ?? ''} disabled readOnly />
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
    </section>
  );
}
