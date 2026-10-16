import { useState } from 'react';
import { X } from 'lucide-react';
import apiClient from '../../services/apiClient';

export default function ManagedAccountActions({ onSaved }) {
  const [mode, setMode] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  function close() {
    if (!busy) {
      setMode(null);
      setError('');
    }
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    let payload;
    try {
      if (mode === 'import') {
        if (data.accounts.length > 100000)
          throw new Error('Import file is too large.');
        const users = JSON.parse(data.accounts);
        if (!Array.isArray(users) || users.length < 1 || users.length > 50)
          throw new Error('Enter a JSON array of 1 to 50 accounts.');
        payload = { users };
      } else {
        payload = data;
        if (!payload.username) delete payload.username;
        if (!payload.phone) delete payload.phone;
      }
      setBusy(true);
      await apiClient.post(
        mode === 'import' ? '/admin/users/import' : '/admin/users',
        payload,
      );
      setMode(null);
      await onSaved();
    } catch (failure) {
      const message =
        failure.response?.data?.message ||
        failure.message ||
        'Unable to save accounts.';
      setError(Array.isArray(message) ? message.join(' ') : message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="managed-account-actions">
        <button
          type="button"
          onClick={() => {
            setError('');
            setMode('create');
          }}
        >
          Add Account
        </button>
        <button
          type="button"
          onClick={() => {
            setError('');
            setMode('import');
          }}
        >
          Import Accounts
        </button>
      </div>
      {mode && (
        <div className="managed-user-modal-backdrop">
          <form
            className="managed-user-modal"
            onSubmit={submit}
            role="dialog"
            aria-modal="true"
            aria-label={mode === 'import' ? 'Import Accounts' : 'Add Account'}
          >
            <header>
              <h2>{mode === 'import' ? 'Import Accounts' : 'Add Account'}</h2>
              <button
                type="button"
                onClick={close}
                disabled={busy}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </header>
            <p>
              Provisioned accounts must change their temporary password on first
              sign-in.
            </p>
            {mode === 'import' ? (
              <label>
                Accounts (JSON array, maximum 50)
                <textarea
                  name="accounts"
                  rows={10}
                  maxLength={100000}
                  required
                  disabled={busy}
                  placeholder={
                    '[{"firstName":"Juan","lastName":"Cruz","email":"juan@example.test","password":"temporary-password","role":"CUSTOMER"}]'
                  }
                />
              </label>
            ) : (
              <div className="managed-user-form-grid">
                {[
                  ['firstName', 'First Name', 'text'],
                  ['lastName', 'Last Name', 'text'],
                  ['email', 'Email', 'email'],
                  ['username', 'Username (optional)', 'text'],
                  ['phone', 'Phone (optional)', 'tel'],
                  ['password', 'Temporary Password', 'password'],
                ].map(([name, label, type]) => (
                  <label key={name}>
                    {label}
                    <input
                      name={name}
                      type={type}
                      required={!['username', 'phone'].includes(name)}
                      minLength={name === 'password' ? 8 : undefined}
                      maxLength={
                        name === 'password' ? 128 : name === 'email' ? 255 : 100
                      }
                      autoComplete={
                        name === 'password' ? 'new-password' : 'off'
                      }
                      disabled={busy}
                    />
                  </label>
                ))}
                <label>
                  Role
                  <select name="role" defaultValue="CUSTOMER" disabled={busy}>
                    <option>CUSTOMER</option>
                    <option>STAFF</option>
                    <option>ADMIN</option>
                  </select>
                </label>
              </div>
            )}
            {error && (
              <p role="alert" className="login-error">
                {error}
              </p>
            )}
            <footer>
              <button type="button" onClick={close} disabled={busy}>
                Cancel
              </button>
              <button disabled={busy}>
                {busy
                  ? 'Saving…'
                  : mode === 'import'
                    ? 'Import Accounts'
                    : 'Create Account'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </>
  );
}
