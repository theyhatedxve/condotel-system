import {
  useState,
} from 'react';

import {
  KeyRound,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  changeMyPassword,
} from '../../api/authApi';

import {
  useAuth,
} from '../../hooks/useAuth';

import '../../styles/profile.css';

function getHomeRoute(
  role,
) {
  if (
    role === 'ADMIN' ||
    role === 'STAFF'
  ) {
    return '/admin/dashboard';
  }

  return '/customer/home';
}

export default function ChangePasswordPage() {
  const {
    user,
    refreshUser,
  } = useAuth();

  const navigate =
    useNavigate();

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState('');

  const [
    newPassword,
    setNewPassword,
  ] = useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    saving,
    setSaving,
  ] = useState(false);

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    if (
      newPassword !==
      confirmPassword
    ) {
      window.alert(
        'New passwords do not match.',
      );

      return;
    }

    setSaving(true);

    try {
      await changeMyPassword({
        currentPassword,
        newPassword,
      });

      const updatedUser =
        await refreshUser();

      window.alert(
        'Password changed successfully.',
      );

      navigate(
        getHomeRoute(
          updatedUser.role,
        ),
        {
          replace: true,
        },
      );
    } catch (error) {
      const message =
        error.response?.data
          ?.message ||
        'Unable to change password.';

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
    <main className="change-password-page">
      <form
        className="change-password-card"
        onSubmit={
          handleSubmit
        }
      >
        <div className="change-password-icon">
          <KeyRound
            size={28}
          />
        </div>

        <h1>
          Change Password
        </h1>

        <p>
          {user?.mustChangePassword
            ? 'You must choose a new password before continuing.'
            : 'Update your account password.'}
        </p>

        <label>
          Current Password

          <input
            type="password"
            value={
              currentPassword
            }
            onChange={(
              event,
            ) =>
              setCurrentPassword(
                event.target
                  .value,
              )
            }
            autoComplete="current-password"
            required
          />
        </label>

        <label>
          New Password

          <input
            type="password"
            value={
              newPassword
            }
            onChange={(
              event,
            ) =>
              setNewPassword(
                event.target
                  .value,
              )
            }
            minLength={8}
            autoComplete="new-password"
            required
          />
        </label>

        <label>
          Confirm New Password

          <input
            type="password"
            value={
              confirmPassword
            }
            onChange={(
              event,
            ) =>
              setConfirmPassword(
                event.target
                  .value,
              )
            }
            minLength={8}
            autoComplete="new-password"
            required
          />
        </label>

        <button
          type="submit"
          disabled={saving}
        >
          {saving
            ? 'Changing...'
            : 'Change Password'}
        </button>
      </form>
    </main>
  );
}