/* Shared Aither service configuration. Keep credentials/tokens out of this launcher. */
(() => {
  const API = 'https://aitherbackendnew.onrender.com';
  window.AitherBackend = {
    url: API,
    request(path, options = {}) {
      return fetch(API + path, {
        ...options,
        credentials: 'include',
        headers: { Accept: 'application/json', ...(options.headers || {}) },
        cache: 'no-store'
      });
    },
    health() { return this.request('/api/health'); }
  };
})();
