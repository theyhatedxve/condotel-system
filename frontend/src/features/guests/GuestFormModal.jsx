import { useState } from 'react';

import {
  Building2,
  Home,
  Mail,
  Map,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import './editGuest.css';

function GuestField({ label, icon: Icon, ...inputProps }) {
  return (
    <label>
      <span>{label}</span>
      <span className="guest-field-control">
        <Icon size={16} aria-hidden="true" />
        <input {...inputProps} />
      </span>
    </label>
  );
}

function GuestSectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="guest-edit-section-heading">
      <Icon size={22} aria-hidden="true" />
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

// Convert the selected record into editable form values, or supply the existing defaults
// for creation.
function createInitialForm(guest) {
  if (!guest) {
    return {
      email: '',
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    };
  }

  return {
    email: guest.email ?? '',

    username: guest.username ?? '',

    password: '',

    firstName: guest.firstName ?? '',

    lastName: guest.lastName ?? '',

    phone: guest.phone ?? '',

    address: guest.guestProfile?.address ?? '',

    city: guest.guestProfile?.city ?? '',

    province: guest.guestProfile?.province ?? '',

    postalCode: guest.guestProfile?.postalCode ?? '',

    emergencyContactName: guest.guestProfile?.emergencyContactName ?? '',

    emergencyContactPhone: guest.guestProfile?.emergencyContactPhone ?? '',
  };
}

export default function GuestFormModal({
  guest,
  isSubmitting,
  onClose,
  onSubmit,
}) {
  // Track local state and read any session or route values needed by this component.
  const [form, setForm] = useState(() => createInitialForm(guest));

  // Update one controlled form field while retaining the remaining field values.
  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // Prevent default form navigation and send the current guest fields to the parent save
  // handler.
  function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    const payload = {
      email: form.email,
      firstName: form.firstName,

      lastName: form.lastName,

      phone: form.phone,

      address: form.address,

      city: form.city,

      province: form.province,

      postalCode: form.postalCode,

      emergencyContactName: form.emergencyContactName,

      emergencyContactPhone: form.emergencyContactPhone,
    };

    // Password and username provisioning belongs to account creation.
    if (!guest) {
      payload.email = form.email;

      payload.username = form.username || undefined;

      payload.password = form.password;
    }

    onSubmit(payload);
  }

  if (guest) {
    const fullName =
      [guest.firstName, guest.lastName].filter(Boolean).join(' ') || 'Guest';
    const initials =
      [guest.firstName, guest.lastName]
        .filter(Boolean)
        .map((name) => name.charAt(0).toUpperCase())
        .join('') || 'G';
    const status = guest.status || 'INACTIVE';
    const field = (name, label, icon, props = {}) => (
      <GuestField
        key={name}
        label={label}
        icon={icon}
        value={form[name]}
        onChange={(event) => updateField(name, event.target.value)}
        {...props}
      />
    );
    return (
      <div className="guest-modal-backdrop">
        <section
          className="guest-modal guest-edit-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-modal-title"
        >
          <header className="guest-modal-header">
            <div>
              <span className="guest-modal-icon">
                <UserRound size={24} />
              </span>
              <h2 id="guest-modal-title">Edit Guest</h2>
              <p>Update guest profile and contact information.</p>
            </div>
            <button
              type="button"
              className="modal-close-button"
              aria-label="Close guest form"
              disabled={isSubmitting}
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </header>
          <form onSubmit={handleSubmit} className="guest-form guest-edit-form">
            <div className="guest-edit-body">
              <div className="guest-edit-summary">
                <span className="guest-edit-avatar" aria-hidden="true">
                  {initials}
                </span>
                <div className="guest-edit-summary-details">
                  <h3>{fullName}</h3>
                  <div>
                    <span>
                      <Mail size={15} aria-hidden="true" />
                      {guest.email}
                    </span>
                    <span>
                      <Phone size={15} aria-hidden="true" />
                      {guest.phone || 'No phone provided'}
                    </span>
                  </div>
                </div>
                <span className={`guest-active-badge ${status.toLowerCase()}`}>
                  <i aria-hidden="true" />
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </span>
              </div>
              <fieldset className="guest-form-fields" disabled={isSubmitting}>
                <section
                  className="guest-edit-section"
                  aria-label="Guest Account Access"
                >
                  <GuestSectionHeading
                    icon={ShieldCheck}
                    title="Guest Account Access"
                    description="View the guest’s current account details."
                  />
                  <div className="guest-form-grid">
                    <div className="guest-account-field">
                      <GuestField
                        label="Username"
                        icon={UserRound}
                        value={guest.username || 'Not set'}
                        readOnly
                      />
                      <p>The guest’s current login username.</p>
                    </div>
                    <div className="guest-account-field">
                      <GuestField
                        label="Account Email"
                        icon={Mail}
                        value={guest.email || ''}
                        readOnly
                      />
                      <p>Update this email under Personal Details.</p>
                    </div>
                  </div>
                </section>
                <section
                  className="guest-edit-section"
                  aria-label="Personal Details"
                >
                  <GuestSectionHeading
                    icon={UserRound}
                    title="Personal Details"
                    description="Basic information about the guest."
                  />
                  <div className="guest-form-grid">
                    {field('email', 'Email', Mail, {
                      type: 'email',
                      required: true,
                      maxLength: 255,
                    })}
                    {field('firstName', 'First Name', UserRound, {
                      required: true,
                      maxLength: 100,
                    })}
                    {field('lastName', 'Last Name', UserRound, {
                      required: true,
                      maxLength: 100,
                    })}
                    {field('phone', 'Phone', Phone, {
                      type: 'tel',
                      maxLength: 30,
                    })}
                  </div>
                </section>
                <section
                  className="guest-edit-section"
                  aria-label="Address Information"
                >
                  <GuestSectionHeading
                    icon={MapPin}
                    title="Address Information"
                    description="Guest’s address and location details."
                  />
                  <div className="guest-form-grid">
                    {field('city', 'City', Building2, { maxLength: 100 })}
                    {field('province', 'Province', Map, { maxLength: 100 })}
                    <div className="guest-edit-full-field">
                      {field('address', 'Address', Home, { maxLength: 255 })}
                    </div>
                  </div>
                </section>
              </fieldset>
            </div>
            <footer className="guest-modal-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={isSubmitting}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={isSubmitting}
              >
                <Save size={16} />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </footer>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="guest-modal-backdrop">
      {/* Group the related content and actions into a distinct page section. */}
      <section
        className="guest-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-modal-title"
      >
        {/* Show this section's heading, context, and available actions. */}
        <header className="guest-modal-header">
          <div>
            <span className="guest-modal-icon">
              <UserRound size={24} />
            </span>
            <h2 id="guest-modal-title">{guest ? 'Edit Guest' : 'Add Guest'}</h2>

            <p>Manage guest contact and profile details.</p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            aria-label="Close guest form"
            disabled={isSubmitting}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>

        {/* Collect the guests form fields and submit them through the handler above. */}
        <form onSubmit={handleSubmit} className="guest-form">
          <fieldset className="guest-form-fields" disabled={isSubmitting}>
            <div className="guest-form-grid">
              {guest && (
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField('email', event.target.value)
                    }
                    maxLength={255}
                    required
                  />
                </label>
              )}
              {!guest && (
                <>
                  <label>
                    <span>Email</span>

                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(event) =>
                        updateField('email', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>Username</span>

                    <input
                      value={form.username}
                      onChange={(event) =>
                        updateField('username', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>Temporary Password</span>

                    <input
                      type="password"
                      required
                      minLength="8"
                      value={form.password}
                      onChange={(event) =>
                        updateField('password', event.target.value)
                      }
                    />
                  </label>
                </>
              )}

              <label>
                <span>First Name</span>

                <input
                  required
                  value={form.firstName}
                  onChange={(event) =>
                    updateField('firstName', event.target.value)
                  }
                />
              </label>

              <label>
                <span>Last Name</span>

                <input
                  required
                  value={form.lastName}
                  onChange={(event) =>
                    updateField('lastName', event.target.value)
                  }
                />
              </label>

              <label>
                <span>Phone</span>

                <input
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                />
              </label>

              <label>
                <span>City</span>

                <input
                  value={form.city}
                  onChange={(event) => updateField('city', event.target.value)}
                />
              </label>

              <label>
                <span>Province</span>

                <input
                  value={form.province}
                  onChange={(event) =>
                    updateField('province', event.target.value)
                  }
                />
              </label>
            </div>

            <label>
              <span>Address</span>

              <input
                value={form.address}
                onChange={(event) => updateField('address', event.target.value)}
              />
            </label>

            {/* Show the property footer links and contact information. */}
          </fieldset>
          <footer className="guest-modal-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Guest'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
