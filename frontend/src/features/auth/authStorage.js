const TOKEN_KEY = 'condotel_access_token';

// Store the token in the selected session/persistent storage and remove the previous
// storage choice.
export function saveAccessToken(token, rememberMe = false) {
  // Remove the previous storage choice so an old persistent token cannot override this login.
  clearAccessToken();

  if (rememberMe) {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }

  sessionStorage.setItem(TOKEN_KEY, token);
}

// Read the persistent token first, falling back to session storage.
export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

// Remove both token storage choices during logout or an invalid restored session.
export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}
