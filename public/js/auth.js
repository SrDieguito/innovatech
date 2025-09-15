// public/js/auth.js (ESM)
const CACHE_KEY = '__edutech_user';
let __user = null;

export async function apiFetch(path, options = {}) {
  const opts = { 
    credentials: 'include', 
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  };
  return fetch(path, opts);
}

export async function getUser({ force = false } = {}) {
  // Return cached user if available and not forcing refresh
  if (!force && __user) return __user;
  
  try {
    // Try to get from localStorage cache if not forcing
    if (!force) {
      const cacheRaw = localStorage.getItem(CACHE_KEY);
      if (cacheRaw) {
        const { user, t } = JSON.parse(cacheRaw);
        // Cache is valid for 5 minutes
        if (Date.now() - (t || 0) < 5 * 60 * 1000) {
          __user = user;
          return __user;
        }
      }
    }

    // Fetch fresh data from server
    const res = await apiFetch('/api/auth/me', { method: 'GET' });
    
    if (!res.ok) {
      // Clear cache on auth failure
      __user = null;
      try { localStorage.removeItem(CACHE_KEY); } catch {}
      document.dispatchEvent(new CustomEvent('edutech:user-logout'));
      return null;
    }
    
    const data = await res.json();
    
    if (data.loggedIn && data.user) {
      __user = data.user;
      try { 
        localStorage.setItem(CACHE_KEY, JSON.stringify({ 
          user: __user, 
          t: Date.now() 
        })); 
      } catch {}
      document.dispatchEvent(new CustomEvent('edutech:user-ready', { detail: __user }));
      return __user;
    } else {
      __user = null;
      try { localStorage.removeItem(CACHE_KEY); } catch {}
      document.dispatchEvent(new CustomEvent('edutech:user-logout'));
      return null;
    }
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function requireUser({ redirectTo = '/views/login.html' } = {}) {
  const u = await getUser({ force: true });
  if (!u) {
    // Redirect to login if not authenticated
    window.location.href = redirectTo;
    return null;
  }
  return u;
}

export function currentUser() { 
  return __user; 
}

export function initials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() || '')
    .join('');
}

// Initialize user on load if possible
if (typeof window !== 'undefined') {
  getUser().catch(console.error);
}
