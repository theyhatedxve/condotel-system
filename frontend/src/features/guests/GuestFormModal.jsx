import { useState } from 'react';

import { X } from 'lucide-react';

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

  return (
    <div className="modal-backdrop">
      {/* Group the related content and actions into a distinct page section. */}
      <section className="guest-modal">
        {/* Show this section's heading, context, and available actions. */}
        <header className="guest-modal-header">
          <div>
            <h2>{guest ? 'Edit Guest' : 'Add Guest'}</h2>

            <p>Manage guest contact and profile details.</p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>

        {/* Collect the guests form fields and submit them through the handler above. */}
        <form onSubmit={handleSubmit} className="guest-form">
          <div className="guest-form-grid">
            {guest && (
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
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
          <footer className="guest-modal-actions">
            <button
              type="button"
              className="secondary-button"
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
