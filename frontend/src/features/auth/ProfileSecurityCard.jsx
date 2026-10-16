import { useState } from 'react';
import { Eye, EyeOff, KeyRound, LockKeyhole } from 'lucide-react';
import { changeMyPassword } from './authApi';
import { useAuth } from './useAuth';

export default function ProfileSecurityCard() {
  const { refreshUser } = useAuth();
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [visible, setVisible] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ error: true, text: 'New passwords do not match.' });
      return;
    }
    if (passwords.newPassword.length < 8) {
      setMessage({
        error: true,
        text: 'New password must be at least 8 characters.',
      });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await changeMyPassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setVisible({});
      await refreshUser();
      setMessage({ text: 'Password changed successfully.' });
    } catch (error) {
      const text =
        error.response?.data?.message || 'Unable to change password.';
      setMessage({
        error: true,
        text: Array.isArray(text) ? text.join(' ') : text,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className="profile-card profile-security-card"
      aria-labelledby="profile-security-title"
    >
      <div className="profile-section-heading">
        <span className="profile-section-icon">
          <LockKeyhole size={23} />
        </span>
        <div>
          <h2 id="profile-security-title">Security</h2>
          <p>Update your password to keep your account secure.</p>
        </div>
      </div>
      <form className="profile-security-form" onSubmit={handleSubmit}>
        {[
          ['currentPassword', 'Current Password', 'Enter current password'],
          ['newPassword', 'New Password', 'Enter new password'],
          ['confirmPassword', 'Confirm New Password', 'Confirm new password'],
        ].map(([name, label, placeholder]) => (
          <label className="profile-field" key={name}>
            <span>{label}</span>
            <span className="profile-input-shell">
              <LockKeyhole size={16} aria-hidden="true" />
              <input
                name={name}
                type={visible[name] ? 'text' : 'password'}
                value={passwords[name]}
                placeholder={placeholder}
                autoComplete={
                  name === 'currentPassword'
                    ? 'current-password'
                    : 'new-password'
                }
                required
                minLength={name === 'currentPassword' ? 1 : 8}
                maxLength={128}
                disabled={saving}
                onChange={(event) =>
                  setPasswords((current) => ({
                    ...current,
                    [name]: event.target.value,
                  }))
                }
              />
              <button
                type="button"
                className="profile-password-toggle"
                aria-label={`${visible[name] ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
                aria-pressed={Boolean(visible[name])}
                onClick={() =>
                  setVisible((current) => ({
                    ...current,
                    [name]: !current[name],
                  }))
                }
              >
                {visible[name] ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
        ))}
        {message && (
          <p
            className={`profile-feedback${message.error ? ' is-error' : ''}`}
            role={message.error ? 'alert' : 'status'}
          >
            {message.text}
          </p>
        )}
        <button
          type="submit"
          className="profile-outline-button"
          disabled={saving}
        >
          <KeyRound size={18} />
          {saving ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </section>
  );
}
