import {
  useState,
} from 'react';

import {
  X,
} from 'lucide-react';

function createInitialForm(
  guest,
) {
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
    email:
      guest.email ?? '',

    username:
      guest.username ?? '',

    password: '',

    firstName:
      guest.firstName ?? '',

    lastName:
      guest.lastName ?? '',

    phone:
      guest.phone ?? '',

    address:
      guest.guestProfile
        ?.address ?? '',

    city:
      guest.guestProfile
        ?.city ?? '',

    province:
      guest.guestProfile
        ?.province ?? '',

    postalCode:
      guest.guestProfile
        ?.postalCode ?? '',

    emergencyContactName:
      guest.guestProfile
        ?.emergencyContactName ??
      '',

    emergencyContactPhone:
      guest.guestProfile
        ?.emergencyContactPhone ??
      '',
  };
}

export default function GuestFormModal({
  guest,
  isSubmitting,
  onClose,
  onSubmit,
}) {
  const [form, setForm] =
    useState(
      () =>
        createInitialForm(
          guest,
        ),
    );

  function updateField(
    field,
    value,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      firstName:
        form.firstName,

      lastName:
        form.lastName,

      phone:
        form.phone,

      address:
        form.address,

      city:
        form.city,

      province:
        form.province,

      postalCode:
        form.postalCode,

      emergencyContactName:
        form.emergencyContactName,

      emergencyContactPhone:
        form.emergencyContactPhone,
    };

    // Account credentials belong to creation; the guest edit endpoint accepts profile fields only.
    if (!guest) {
      payload.email =
        form.email;

      payload.username =
        form.username ||
        undefined;

      payload.password =
        form.password;
    }

    onSubmit(payload);
  }

  return (
    <div className="modal-backdrop">
      <section className="guest-modal">
        <header className="guest-modal-header">
          <div>
            <h2>
              {guest
                ? 'Edit Guest'
                : 'Add Guest'}
            </h2>

            <p>
              Manage guest contact
              and profile details.
            </p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="guest-form"
        >
          <div className="guest-form-grid">
            {!guest && (
              <>
                <label>
                  <span>Email</span>

                  <input
                    type="email"
                    required
                    value={
                      form.email
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'email',
                        event
                          .target
                          .value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Username
                  </span>

                  <input
                    value={
                      form.username
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'username',
                        event
                          .target
                          .value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Temporary Password
                  </span>

                  <input
                    type="password"
                    required
                    minLength="8"
                    value={
                      form.password
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'password',
                        event
                          .target
                          .value,
                      )
                    }
                  />
                </label>
              </>
            )}

            <label>
              <span>
                First Name
              </span>

              <input
                required
                value={
                  form.firstName
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    'firstName',
                    event
                      .target
                      .value,
                  )
                }
              />
            </label>

            <label>
              <span>
                Last Name
              </span>

              <input
                required
                value={
                  form.lastName
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    'lastName',
                    event
                      .target
                      .value,
                  )
                }
              />
            </label>

            <label>
              <span>Phone</span>

              <input
                value={
                  form.phone
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    'phone',
                    event
                      .target
                      .value,
                  )
                }
              />
            </label>

            <label>
              <span>City</span>

              <input
                value={
                  form.city
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    'city',
                    event
                      .target
                      .value,
                  )
                }
              />
            </label>

            <label>
              <span>
                Province
              </span>

              <input
                value={
                  form.province
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    'province',
                    event
                      .target
                      .value,
                  )
                }
              />
            </label>
          </div>

          <label>
            <span>Address</span>

            <input
              value={
                form.address
              }
              onChange={(
                event,
              ) =>
                updateField(
                  'address',
                  event
                    .target
                    .value,
                )
              }
            />
          </label>

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
              disabled={
                isSubmitting
              }
            >
              {isSubmitting
                ? 'Saving...'
                : 'Save Guest'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}