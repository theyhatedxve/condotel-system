import './brand-logo.css';

export default function BrandLogo({ light = false, className = '' }) {
  return (
    <img
      className={`nexora-logo${light ? ' nexora-logo-light' : ''} ${className}`}
      src="/nexora-logo.png"
      alt="NEXORA"
      width="180"
      height="90"
    />
  );
}
