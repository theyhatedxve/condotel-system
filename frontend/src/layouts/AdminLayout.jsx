import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import LoadingScreen from '../features/auth/LoadingScreen';

import Sidebar from '../layouts/Sidebar';

import Topbar from '../layouts/Topbar';

import './layout.css';

// Combine administration navigation, top bar, and the selected management page.
export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <Sidebar />

      <div className="admin-main">
        <Topbar />

        <main className="admin-content">
          <Suspense fallback={<LoadingScreen inline title="Loading your workspace" description="Getting this page ready." />}><Outlet /></Suspense>
        </main>
      </div>
    </div>
  );
}
