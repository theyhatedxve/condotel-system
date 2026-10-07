import { useEffect, useState } from 'react';

import {
  Building2,
  Clock3,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
} from 'lucide-react';

import { getSettings, updateSettings } from './settingsApi';

import { useAuth } from '../auth/useAuth';

import './settings.css';

const initialForm = {
  propertyName: '',
  propertyAddress: '',
  propertyCity: '',
  propertyProvince: '',
  postalCode: '',
  contactEmail: '',
  contactPhone: '',
  checkInTime: '14:00',
  checkOutTime: '12:00',
  currency: 'PHP',
  timezone: 'Asia/Manila',
};

function mapSettingsToForm(settings) {
  return {
    propertyName: settings.propertyName ?? '',

    propertyAddress: settings.propertyAddress ?? '',

    propertyCity: settings.propertyCity ?? '',

    propertyProvince: settings.propertyProvince ?? '',

    postalCode: settings.postalCode ?? '',

    contactEmail: settings.contactEmail ?? '',

    contactPhone: settings.contactPhone ?? '',

    checkInTime: settings.checkInTime ?? '14:00',

    checkOutTime: settings.checkOutTime ?? '12:00',

    currency: settings.currency ?? 'PHP',

    timezone: settings.timezone ?? 'Asia/Manila',
  };
}

export default function SettingsPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';

  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getSettings()
      .then((result) => {
        if (cancelled) {
          return;
        }

        setForm(mapSettingsToForm(result));

        setUpdatedAt(result.updatedAt ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          window.alert('Unable to load settings.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,

      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isAdmin) {
      return;
    }

    if (!form.propertyName.trim()) {
      window.alert('Property name is required.');

      return;
    }

    setSaving(true);

    try {
      // Currency and timezone are displayed but omitted because they are not editable settings.
      const result = await updateSettings({
        propertyName: form.propertyName.trim(),

        propertyAddress: form.propertyAddress.trim() || null,

        propertyCity: form.propertyCity.trim() || null,

        propertyProvince: form.propertyProvince.trim() || null,

        postalCode: form.postalCode.trim() || null,

        contactEmail: form.contactEmail.trim() || null,

        contactPhone: form.contactPhone.trim() || null,

        checkInTime: form.checkInTime,

        checkOutTime: form.checkOutTime,
      });

      setForm(mapSettingsToForm(result));

      setUpdatedAt(result.updatedAt ?? null);

      window.alert('Settings saved successfully.');
    } catch (error) {
      const message =
        error.response?.data?.message || 'Unable to save settings.';

      window.alert(Array.isArray(message) ? message.join(' ') : message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="settings-page">
        <div className="settings-loading">Loading settings...</div>
      </section>
    );
  }

  return (
    <section className="settings-page">
      <header className="settings-header">
        <div>
          <h1>Settings</h1>

          <p>Manage condotel information and operational preferences.</p>
        </div>

        <div className="settings-access-badge">
          <ShieldCheck size={16} />

          {isAdmin ? 'Administrator' : 'Read Only'}
        </div>
      </header>

      {!isAdmin && (
        <div className="settings-readonly-notice">
          You can view these settings, but only administrators can make changes.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="settings-grid">
          <article className="settings-card">
            <div className="settings-card-header">
              <Building2 size={20} />

              <div>
                <h2>Property Information</h2>

                <p>Basic information about the condotel.</p>
              </div>
            </div>

            <div className="settings-form-grid">
              <label className="settings-field settings-field-full">
                Property Name
                <input
                  type="text"
                  name="propertyName"
                  value={form.propertyName}
                  onChange={handleChange}
                  disabled={!isAdmin}
                  maxLength={120}
                  required
                />
              </label>

              <label className="settings-field settings-field-full">
                <span>
                  <MapPin size={14} />
                  Street Address
                </span>

                <input
                  type="text"
                  name="propertyAddress"
                  value={form.propertyAddress}
                  onChange={handleChange}
                  disabled={!isAdmin}
                  maxLength={250}
                />
              </label>

              <label className="settings-field">
                City
                <input
                  type="text"
                  name="propertyCity"
                  value={form.propertyCity}
                  onChange={handleChange}
                  disabled={!isAdmin}
                />
              </label>

              <label className="settings-field">
                Province
                <input
                  type="text"
                  name="propertyProvince"
                  value={form.propertyProvince}
                  onChange={handleChange}
                  disabled={!isAdmin}
                />
              </label>

              <label className="settings-field">
                Postal Code
                <input
                  type="text"
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  disabled={!isAdmin}
                />
              </label>
            </div>
          </article>

          <article className="settings-card">
            <div className="settings-card-header">
              <Mail size={20} />

              <div>
                <h2>Contact Information</h2>

                <p>Contact details used by the property.</p>
              </div>
            </div>

            <div className="settings-form-grid">
              <label className="settings-field">
                <span>
                  <Mail size={14} />
                  Email
                </span>

                <input
                  type="email"
                  name="contactEmail"
                  value={form.contactEmail}
                  onChange={handleChange}
                  disabled={!isAdmin}
                />
              </label>

              <label className="settings-field">
                <span>
                  <Phone size={14} />
                  Phone
                </span>

                <input
                  type="text"
                  name="contactPhone"
                  value={form.contactPhone}
                  onChange={handleChange}
                  disabled={!isAdmin}
                />
              </label>
            </div>
          </article>

          <article className="settings-card">
            <div className="settings-card-header">
              <Clock3 size={20} />

              <div>
                <h2>Stay Schedule</h2>

                <p>Standard check-in and check-out times.</p>
              </div>
            </div>

            <div className="settings-form-grid">
              <label className="settings-field">
                Check-in Time
                <input
                  type="time"
                  name="checkInTime"
                  value={form.checkInTime}
                  onChange={handleChange}
                  disabled={!isAdmin}
                  required
                />
              </label>

              <label className="settings-field">
                Check-out Time
                <input
                  type="time"
                  name="checkOutTime"
                  value={form.checkOutTime}
                  onChange={handleChange}
                  disabled={!isAdmin}
                  required
                />
              </label>
            </div>

            <p className="settings-helper-text">
              These values are stored now and will also be used by the later
              check-in/check-out workflow.
            </p>
          </article>

          <article className="settings-card">
            <div className="settings-card-header">
              <LockKeyhole size={20} />

              <div>
                <h2>System & Security</h2>

                <p>System-managed security configuration.</p>
              </div>
            </div>

            <div className="settings-form-grid">
              <label className="settings-field">
                Currency
                <input type="text" value={form.currency} disabled readOnly />
              </label>

              <label className="settings-field">
                Timezone
                <input type="text" value={form.timezone} disabled readOnly />
              </label>
            </div>

            <div className="settings-security-note">
              <ShieldCheck size={18} />

              <div>
                <strong>Sensitive credentials are protected.</strong>

                <p>
                  PayMongo secret keys, webhook secrets, JWT secrets, database
                  credentials, and future AES keys are managed only by the
                  backend and are never displayed on this page.
                </p>
              </div>
            </div>
          </article>
        </div>

        <div className="settings-footer">
          <div>
            {updatedAt && (
              <span>
                Last updated:{' '}
                {new Intl.DateTimeFormat('en-PH', {
                  dateStyle: 'medium',

                  timeStyle: 'short',
                }).format(new Date(updatedAt))}
              </span>
            )}
          </div>

          {isAdmin && (
            <button
              type="submit"
              className="settings-save-button"
              disabled={saving}
            >
              <Save size={16} />

              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
