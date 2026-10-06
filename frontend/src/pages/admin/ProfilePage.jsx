import {
  useEffect,
  useState,
} from 'react';

import {
  Save,
  UserRound,
} from 'lucide-react';

import {
  updateMyProfile,
} from '../../api/authApi';

import {
  useAuth,
} from '../../hooks/useAuth';

import '../../styles/profile.css';

export default function ProfilePage() {
  const {
    user,
    refreshUser,
  } = useAuth();

  const [
    form,
    setForm,
  ] = useState({
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
  });

  const [
    saving,
    setSaving,
  ] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      firstName:
        user.firstName ??
        '',

      lastName:
        user.lastName ??
        '',

      username:
        user.username ??
        '',

      phone:
        user.phone ??
        '',
    });
  }, [user]);

  function handleChange(
    event,
  ) {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (current) => ({
        ...current,
        [name]: value,
      }),
    );
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    setSaving(true);

    try {
      await updateMyProfile({
        firstName:
          form.firstName.trim(),

        lastName:
          form.lastName.trim(),

        username:
          form.username.trim() ||
          null,

        phone:
          form.phone.trim() ||
          null,
      });

      await refreshUser();

      window.alert(
        'Profile updated successfully.',
      );
    } catch (error) {
      const message =
        error.response?.data
          ?.message ||
        'Unable to update profile.';

      window.alert(
        Array.isArray(message)
          ? message.join(' ')
          : message,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="profile-page">
      <header className="profile-header">
        <div>
          <h1>
            My Profile
          </h1>

          <p>
            Manage your personal
            account information.
          </p>
        </div>
      </header>

      <form
        className="profile-card"
        onSubmit={
          handleSubmit
        }
      >
        <div className="profile-card-heading">
          <div className="profile-large-avatar">
            <UserRound
              size={28}
            />
          </div>

          <div>
            <strong>
              {user?.firstName}{' '}
              {user?.lastName}
            </strong>

            <span>
              {user?.role}
            </span>
          </div>
        </div>

        <div className="profile-form-grid">
          <label>
            First Name

            <input
              name="firstName"
              value={
                form.firstName
              }
              onChange={
                handleChange
              }
              required
            />
          </label>

          <label>
            Last Name

            <input
              name="lastName"
              value={
                form.lastName
              }
              onChange={
                handleChange
              }
              required
            />
          </label>

          <label>
            Username

            <input
              name="username"
              value={
                form.username
              }
              onChange={
                handleChange
              }
            />
          </label>

          <label>
            Phone

            <input
              name="phone"
              value={
                form.phone
              }
              onChange={
                handleChange
              }
            />
          </label>

          <label className="profile-full-field">
            Email

            <input
              value={
                user?.email ??
                ''
              }
              disabled
              readOnly
            />
          </label>

          <label>
            Role

            <input
              value={
                user?.role ??
                ''
              }
              disabled
              readOnly
            />
          </label>

          <label>
            Status

            <input
              value={
                user?.status ??
                ''
              }
              disabled
              readOnly
            />
          </label>
        </div>

        <div className="profile-actions">
          <button
            type="submit"
            disabled={saving}
          >
            <Save
              size={16}
            />

            {saving
              ? 'Saving...'
              : 'Save Profile'}
          </button>
        </div>
      </form>
    </section>
  );
}