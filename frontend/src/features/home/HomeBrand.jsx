import { Link } from 'react-router-dom';
import { property } from './homeContent';
import BrandLogo from '../../components/BrandLogo';

// Render the shared property logo and name with the requested size/layout.
export default function HomeBrand() {
  return (
    <Link to="/" className="coast-brand" aria-label={`${property.name} home`}>
      <BrandLogo light />
    </Link>
  );
}
