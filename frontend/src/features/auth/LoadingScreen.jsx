import BrandLogo from '../../components/BrandLogo';
import './loading-screen.css';

export default function LoadingScreen({
  inline = false,
  title = 'Loading NEXORA',
  description = 'Getting your page ready.',
}) {
  return (
    <div
      className={`loading-screen nexora-loading${inline ? ' is-inline' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="nexora-loading-content">
        {!inline && <BrandLogo />}
        <div className="loading-spinner" aria-hidden="true" />
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="nexora-loading-track" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
