import { Link } from 'react-router-dom';

// Explain that the signed-in account cannot access the requested route.
export default function UnauthorizedPage() {
  return (
    <main className="loading-screen">
      <h1>403</h1>

      <p>You do not have permission to access this page.</p>

      <Link to="/">Return to application</Link>
    </main>
  );
}
