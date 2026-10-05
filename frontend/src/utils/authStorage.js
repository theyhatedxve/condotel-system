const TOKEN_KEY = 'condotel_access_token';

export function saveAccessToken(token, rememberMe = false) {
  clearAccessToken();

  if (rememberMe) {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }

  sessionStorage.setItem(TOKEN_KEY, token);
}

export function getAccessToken() {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(TOKEN_KEY)
  );
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}