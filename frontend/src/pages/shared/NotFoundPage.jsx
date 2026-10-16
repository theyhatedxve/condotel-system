import { Link } from 'react-router-dom';

// Show the unknown-route page and its return action.
export default function NotFoundPage() {
  return (
    <main className="loading-screen">
      <h1>404</h1>

      <p>The page you're looking for does not exist.</p>

      <Link to="/">Go back</Link>
    </main>
  );
}
