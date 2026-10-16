// Show the shared loading indicator while authentication or protected-page state is
// resolving.
export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />

      <p>Loading Condotel System...</p>
    </div>
  );
}
