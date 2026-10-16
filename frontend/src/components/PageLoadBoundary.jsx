import { Component } from 'react';
import { CircleAlert } from 'lucide-react';
import '../features/auth/loading-screen.css';

// A failed page download should offer recovery instead of leaving a blank screen.
export default class PageLoadBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return (
      <main className="loading-screen nexora-loading page-load-error" role="alert">
        <div className="nexora-loading-content">
          <CircleAlert size={36} aria-hidden="true" />
          <h2>This page couldn’t load</h2>
          <p>Please check your connection and try again.</p>
          <button type="button" onClick={() => window.location.reload()}>Reload page</button>
          <a href="/">Back to home</a>
        </div>
      </main>
    );
    return this.props.children;
  }
}
