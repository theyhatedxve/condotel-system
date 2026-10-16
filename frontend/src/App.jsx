import AppRoutes from './routes/AppRoutes';
import { Suspense } from 'react';
import LoadingScreen from './features/auth/LoadingScreen';
import PageLoadBoundary from './components/PageLoadBoundary';

// Render the application route tree.
function App() {
  return <PageLoadBoundary><Suspense fallback={<LoadingScreen />}><AppRoutes /></Suspense></PageLoadBoundary>;
}

export default App;
