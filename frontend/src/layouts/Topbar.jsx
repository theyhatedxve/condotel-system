import {
  Bell,
  ChevronDown,
  Search,
} from 'lucide-react';

import { useAuth } from
  '../hooks/useAuth';

export default function Topbar() {
  const { user } =
    useAuth();

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={17} />

        <input
          type="search"
          placeholder="Search..."
        />
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="topbar-icon-button"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        <button
          type="button"
          className="topbar-profile"
        >
          <div className="topbar-avatar">
            {user?.firstName
              ?.charAt(0)
              ?.toUpperCase() || 'A'}
          </div>

          <span>
            {user?.firstName ||
              'Admin'}
          </span>

          <ChevronDown size={15} />
        </button>
      </div>
    </header>
  );
}