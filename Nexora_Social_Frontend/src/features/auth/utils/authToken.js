const TOKEN_KEY = "accTkn";

// Cross-tab broadcast channel to synchronize auth state instantly across open tabs
let authChannel = null;
try {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    authChannel = new BroadcastChannel("nexora_auth_sync");
  }
} catch {
  authChannel = null;
}

export function getAuthToken() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return token && token !== "undefined" && token !== "null" && token.trim()
      ? token
      : null;
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token && token !== "undefined" && token !== "null") {
      localStorage.setItem(TOKEN_KEY, token);
      authChannel?.postMessage({ type: "TOKEN_SET", token });
    } else {
      localStorage.removeItem(TOKEN_KEY);
      authChannel?.postMessage({ type: "TOKEN_CLEAR" });
    }
  } catch {
    // Cookie-based sessions still work when browser storage is unavailable.
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    authChannel?.postMessage({ type: "TOKEN_CLEAR" });
  } catch {
    // Clearing in-memory auth state is still enough to sign out this tab.
  }
}

export function subscribeAuthSync(callback) {
  if (!authChannel) return () => {};
  const handler = (event) => {
    if (event?.data) callback(event.data);
  };
  authChannel.addEventListener("message", handler);
  return () => authChannel.removeEventListener("message", handler);
}
