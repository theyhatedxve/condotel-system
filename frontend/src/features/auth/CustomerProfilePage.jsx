import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardList, ShieldCheck } from 'lucide-react';
import CustomerHeader from '../home/CustomerHeader';
import ProfilePage from './ProfilePage';
import CustomerBookingOverview from './CustomerBookingOverview';
import './customer-profile.css';

// Customer presentation is separate; management keeps the default profile layout.
export default function CustomerProfilePage() {
  return (
    <div className="customer-profile">
      <a className="coast-skip" href="#customer-profile-main">
        Skip to profile
      </a>
      <CustomerHeader />
      <main id="customer-profile-main" className="customer-profile-main">
        <ProfilePage
          notificationsInSidebar
          overview={<CustomerBookingOverview />}
          bannerActions={
            <nav
              className="customer-profile-shortcuts"
              aria-label="Profile shortcuts"
            >
              {[
                [
                  CalendarDays,
                  '/rooms',
                  'Book Your Stay',
                  'Find your next coastal escape',
                ],
                [
                  ClipboardList,
                  '/my-bookings',
                  'Your Bookings',
                  'Keep track of your reservations',
                ],
                [
                  ShieldCheck,
                  '#profile-security-title',
                  'Stay Secure',
                  'Manage your account security',
                ],
              ].map(([Icon, to, label, description]) => (
                <Link
                  key={label}
                  to={to}
                  onClick={
                    to.startsWith('#')
                      ? (event) => {
                          event.preventDefault();
                          document
                            .getElementById('profile-security-title')
                            ?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'center',
                            });
                        }
                      : undefined
                  }
                >
                  <span className="profile-section-icon">
                    <Icon size={23} />
                  </span>
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                </Link>
              ))}
            </nav>
          }
        />
      </main>
      <footer className="customer-profile-footer">
        NEXORA · Smart Access. Seamless Stays.
      </footer>
    </div>
  );
}
