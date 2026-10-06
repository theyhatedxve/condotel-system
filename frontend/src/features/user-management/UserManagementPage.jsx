import {
  useEffect,
  useState,
} from 'react';

import {
  KeyRound,
  Search,
  UserCog,
  X,
} from 'lucide-react';

import {
  getManagedUsers,
  resetManagedUserPassword,
  updateManagedUser,
} from './userManagementApi';

import {
  useAuth,
} from '../auth/useAuth';

import './user-management.css';

function formatDateTime(
  value,
) {
  if (!value) {
    return 'Never';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'en-PH',
    {
      dateStyle:
        'medium',

      timeStyle:
        'short',
    },
  ).format(date);
}

export default function UserManagementPage() {
  const {
    user:
      currentUser,
  } = useAuth();

  const [
    users,
    setUsers,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    roleFilter,
    setRoleFilter,
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('');

  const [
    editingUser,
    setEditingUser,
  ] = useState(null);

  const [
    editForm,
    setEditForm,
  ] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    role: 'CUSTOMER',
    status: 'ACTIVE',
  });

  const [
    resetUser,
    setResetUser,
  ] = useState(null);

  const [
    newPassword,
    setNewPassword,
  ] = useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    savingUser,
    setSavingUser,
  ] = useState(false);

  const [
    resettingPassword,
    setResettingPassword,
  ] = useState(false);

  async function loadUsers() {
    setLoading(true);

    try {
      const result =
        await getManagedUsers();

      setUsers(
        Array.isArray(result)
          ? result
          : [],
      );
    } catch {
      window.alert(
        'Unable to load users.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled =
      false;

    getManagedUsers()
      .then((result) => {
        if (!cancelled) {
          setUsers(
            Array.isArray(result)
              ? result
              : [],
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          window.alert(
            'Unable to load users.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(
            false,
          );
        }
      });

    return () => {
      cancelled =
        true;
    };
  }, []);

  const normalizedSearch =
    search
      .trim()
      .toLowerCase();

  const filteredUsers =
    users.filter(
      (user) => {
        const searchable =
          [
            user.firstName,
            user.lastName,
            user.email,
            user.username,
            user.phone,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        const matchesSearch =
          !normalizedSearch ||
          searchable.includes(
            normalizedSearch,
          );

        const matchesRole =
          !roleFilter ||
          user.role ===
            roleFilter;

        const matchesStatus =
          !statusFilter ||
          user.status ===
            statusFilter;

        return (
          matchesSearch &&
          matchesRole &&
          matchesStatus
        );
      },
    );

  const totalStaff =
    users.filter(
      (user) =>
        user.role ===
        'STAFF',
    ).length;

  const totalCustomers =
    users.filter(
      (user) =>
        user.role ===
        'CUSTOMER',
    ).length;

  const totalSuspended =
    users.filter(
      (user) =>
        user.status ===
        'SUSPENDED',
    ).length;

  function openEdit(
    user,
  ) {
    setEditingUser(
      user,
    );

    setEditForm({
      firstName:
        user.firstName,

      lastName:
        user.lastName,

      email:
        user.email,

      username:
        user.username ??
        '',

      phone:
        user.phone ??
        '',

      role:
        user.role,

      status:
        user.status,
    });
  }

  function closeEdit() {
    if (savingUser) {
      return;
    }

    setEditingUser(
      null,
    );
  }

  function openResetPassword(
    user,
  ) {
    setResetUser(
      user,
    );

    setNewPassword('');

    setConfirmPassword('');
  }

  function closeResetPassword() {
    if (
      resettingPassword
    ) {
      return;
    }

    setResetUser(null);

    setNewPassword('');

    setConfirmPassword('');
  }

  async function handleEditSubmit(
    event,
  ) {
    event.preventDefault();

    if (!editingUser) {
      return;
    }

    if (
      !editForm.firstName
        .trim() ||
      !editForm.lastName
        .trim()
    ) {
      window.alert(
        'First name and last name are required.',
      );

      return;
    }

    const canManageRoleAndStatus =
      editingUser.id !==
        currentUser?.id &&
      editingUser.role !==
        'ADMIN';

    setSavingUser(true);

    try {
      await updateManagedUser(
        editingUser.id,
        {
          firstName:
            editForm.firstName
              .trim(),

          lastName:
            editForm.lastName
              .trim(),

          email:
            editForm.email
              .trim(),

          username:
            editForm.username
              .trim() ||
            null,

          phone:
            editForm.phone
              .trim() ||
            null,

          ...(canManageRoleAndStatus
            ? {
                role:
                  editForm.role,

                status:
                  editForm.status,
              }
            : {}),
        },
      );

      setEditingUser(null);

      await loadUsers();

      window.alert(
        'User account updated successfully.',
      );
    } catch (error) {
      const message =
        error.response?.data
          ?.message ||
        'Unable to update user.';

      window.alert(
        Array.isArray(
          message,
        )
          ? message.join(
              ' ',
            )
          : message,
      );
    } finally {
      setSavingUser(false);
    }
  }

  async function handleResetPassword(
    event,
  ) {
    event.preventDefault();

    if (!resetUser) {
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      window.alert(
        'Passwords do not match.',
      );

      return;
    }

    if (
      newPassword.length <
      8
    ) {
      window.alert(
        'Temporary password must be at least 8 characters.',
      );

      return;
    }

    setResettingPassword(
      true,
    );

    try {
      await resetManagedUserPassword(
        resetUser.id,
        newPassword,
      );

      setResetUser(null);

      setNewPassword('');

      setConfirmPassword('');

      await loadUsers();

      window.alert(
        'Password reset successfully. The user must change it at the next login.',
      );
    } catch (error) {
      const message =
        error.response?.data
          ?.message ||
        'Unable to reset password.';

      window.alert(
        Array.isArray(
          message,
        )
          ? message.join(
              ' ',
            )
          : message,
      );
    } finally {
      setResettingPassword(
        false,
      );
    }
  }

  return (
    <section className="user-management-page">
      <header className="user-management-header">
        <h1>
          User Management
        </h1>

        <p>
          Manage Staff and Customer
          accounts.
        </p>
      </header>

      <div className="user-management-summary">
        <article>
          <span>
            Total Users
          </span>

          <strong>
            {users.length}
          </strong>
        </article>

        <article>
          <span>
            Staff
          </span>

          <strong>
            {totalStaff}
          </strong>
        </article>

        <article>
          <span>
            Customers
          </span>

          <strong>
            {totalCustomers}
          </strong>
        </article>

        <article>
          <span>
            Suspended
          </span>

          <strong>
            {totalSuspended}
          </strong>
        </article>
      </div>

      <div className="user-management-toolbar">
        <div className="user-management-search">
          <Search
            size={17}
          />

          <input
            type="search"
            value={search}
            placeholder="Search name, email, username, or phone..."
            onChange={(
              event,
            ) =>
              setSearch(
                event.target
                  .value,
              )
            }
          />
        </div>

        <select
          value={
            roleFilter
          }
          onChange={(
            event,
          ) =>
            setRoleFilter(
              event.target
                .value,
            )
          }
        >
          <option value="">
            All Roles
          </option>

          <option value="ADMIN">
            Admin
          </option>

          <option value="STAFF">
            Staff
          </option>

          <option value="CUSTOMER">
            Customer
          </option>
        </select>

        <select
          value={
            statusFilter
          }
          onChange={(
            event,
          ) =>
            setStatusFilter(
              event.target
                .value,
            )
          }
        >
          <option value="">
            All Statuses
          </option>

          <option value="ACTIVE">
            Active
          </option>

          <option value="INACTIVE">
            Inactive
          </option>

          <option value="SUSPENDED">
            Suspended
          </option>
        </select>
      </div>

      {loading ? (
        <div className="user-management-empty">
          Loading users...
        </div>
      ) : (
        <div className="user-management-table-wrapper">
          <table className="user-management-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>

                <th>
                  Password
                </th>

                <th>
                  Last Login
                </th>

                <th>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="user-management-no-results"
                  >
                    No users match your
                    filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(
                  (user) => (
                    <tr
                      key={
                        user.id
                      }
                    >
                      <td>
                        <strong>
                          {
                            user.firstName
                          }{' '}
                          {
                            user.lastName
                          }
                        </strong>

                        <small>
                          {
                            user.email
                          }
                        </small>
                      </td>

                      <td>
                        {
                          user.username ??
                          '—'
                        }
                      </td>

                      <td>
                        {user.role}
                      </td>

                      <td>
                        <span
                          className={`managed-user-status ${user.status.toLowerCase()}`}
                        >
                          {
                            user.status
                          }
                        </span>
                      </td>

                      <td>
                        {user.mustChangePassword
                          ? 'Change required'
                          : 'Normal'}
                      </td>

                      <td>
                        {formatDateTime(
                          user.lastLoginAt,
                        )}
                      </td>

                      <td>
                        <div className="managed-user-actions">
                          <button
                            type="button"
                            onClick={() =>
                              openEdit(
                                user,
                              )
                            }
                          >
                            <UserCog
                              size={14}
                            />

                            Edit
                          </button>

                          {user.role !==
                            'ADMIN' && (
                            <button
                              type="button"
                              onClick={() =>
                                openResetPassword(
                                  user,
                                )
                              }
                            >
                              <KeyRound
                                size={14}
                              />

                              Reset
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {editingUser && (
        <div className="managed-user-modal-backdrop">
          <form
            className="managed-user-modal"
            onSubmit={
              handleEditSubmit
            }
          >
            <header>
              <h2>
                Edit Account
              </h2>

              <button
                type="button"
                aria-label="Close edit user"
                onClick={
                  closeEdit
                }
              >
                <X
                  size={18}
                />
              </button>
            </header>

            <div className="managed-user-form-grid">
              <label>
                First Name

                <input
                  type="text"
                  value={
                    editForm.firstName
                  }
                  maxLength={80}
                  onChange={(
                    event,
                  ) =>
                    setEditForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        firstName:
                          event.target
                            .value,
                      }),
                    )
                  }
                  required
                />
              </label>

              <label>
                Last Name

                <input
                  type="text"
                  value={
                    editForm.lastName
                  }
                  maxLength={80}
                  onChange={(
                    event,
                  ) =>
                    setEditForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        lastName:
                          event.target
                            .value,
                      }),
                    )
                  }
                  required
                />
              </label>

              <label>
                Email

                <input
                  type="email"
                  value={
                    editForm.email
                  }
                  maxLength={160}
                  onChange={(
                    event,
                  ) =>
                    setEditForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        email:
                          event.target
                            .value,
                      }),
                    )
                  }
                  required
                />
              </label>

              <label>
                Username

                <input
                  type="text"
                  value={
                    editForm.username
                  }
                  maxLength={80}
                  onChange={(
                    event,
                  ) =>
                    setEditForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        username:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                Phone

                <input
                  type="text"
                  value={
                    editForm.phone
                  }
                  maxLength={30}
                  onChange={(
                    event,
                  ) =>
                    setEditForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        phone:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                Role

                <select
                  value={
                    editForm.role
                  }
                  disabled={
                    editingUser.id ===
                      currentUser?.id ||
                    editingUser.role ===
                      'ADMIN'
                  }
                  onChange={(
                    event,
                  ) =>
                    setEditForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        role:
                          event.target
                            .value,
                      }),
                    )
                  }
                >
                  {editingUser.role ===
                    'ADMIN' && (
                    <option value="ADMIN">
                      Admin
                    </option>
                  )}

                  <option value="STAFF">
                    Staff
                  </option>

                  <option value="CUSTOMER">
                    Customer
                  </option>
                </select>
              </label>

              <label>
                Status

                <select
                  value={
                    editForm.status
                  }
                  disabled={
                    editingUser.id ===
                      currentUser?.id ||
                    editingUser.role ===
                      'ADMIN'
                  }
                  onChange={(
                    event,
                  ) =>
                    setEditForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        status:
                          event.target
                            .value,
                      }),
                    )
                  }
                >
                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="INACTIVE">
                    Inactive
                  </option>

                  <option value="SUSPENDED">
                    Suspended
                  </option>
                </select>
              </label>
            </div>

            {editingUser.role ===
              'ADMIN' && (
              <p className="managed-user-admin-note">
                Administrator role and
                status are protected.
              </p>
            )}

            <footer>
              <button
                type="button"
                onClick={
                  closeEdit
                }
                disabled={
                  savingUser
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  savingUser
                }
              >
                {savingUser
                  ? 'Saving...'
                  : 'Save Changes'}
              </button>
            </footer>
          </form>
        </div>
      )}

      {resetUser && (
        <div className="managed-user-modal-backdrop">
          <form
            className="managed-user-modal managed-user-reset-modal"
            onSubmit={
              handleResetPassword
            }
          >
            <header>
              <h2>
                Reset Password
              </h2>

              <button
                type="button"
                aria-label="Close reset password"
                onClick={
                  closeResetPassword
                }
              >
                <X
                  size={18}
                />
              </button>
            </header>

            <p>
              Reset password for{' '}
              <strong>
                {
                  resetUser.firstName
                }{' '}
                {
                  resetUser.lastName
                }
              </strong>
              .
            </p>

            <label>
              Temporary Password

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
                maxLength={128}
                autoComplete="new-password"
                required
              />
            </label>

            <label>
              Confirm Temporary Password

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
                maxLength={128}
                autoComplete="new-password"
                required
              />
            </label>

            <small>
              The temporary password is
              stored only as an Argon2id
              hash. The user must change
              it on their next login.
            </small>

            <footer>
              <button
                type="button"
                onClick={
                  closeResetPassword
                }
                disabled={
                  resettingPassword
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  resettingPassword
                }
              >
                {resettingPassword
                  ? 'Resetting...'
                  : 'Reset Password'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </section>
  );
}