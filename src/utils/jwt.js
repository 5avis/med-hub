/**
 * Decodes a base64url-encoded JWT token and returns the parsed payload.
 * Returns null if the token is invalid or parsing fails.
 * 
 * @param {string} token - The JWT token to decode.
 * @returns {object|null} The decoded JSON payload or null.
 */
export function decodeJWT(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    
    const jsonPayload = decodeURIComponent(
      window.atob(base64 + padding)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

/**
 * Checks if the decoded token has expired.
 * 
 * @param {object} decodedToken - The decoded token object.
 * @returns {boolean} True if the token has expired or is invalid, false otherwise.
 */
export function isTokenExpired(decodedToken) {
  if (!decodedToken || !decodedToken.exp) return true;
  const currentTime = Math.floor(Date.now() / 1000);
  return decodedToken.exp < currentTime;
}
