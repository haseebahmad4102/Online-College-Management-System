import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  // sessionStorage (not localStorage) so each browser tab keeps its own signed-in
  // role — logging in as a different role in another tab must not hijack this one.
  const token = sessionStorage.getItem('ocms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Expired/invalid session → back to the login page instead of pages hanging on stale data.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute = err.config?.url?.startsWith('/auth/');
    if (err.response?.status === 401 && sessionStorage.getItem('ocms_token') && !isAuthRoute) {
      sessionStorage.removeItem('ocms_token');
      window.location.href = '/login';
    } else if (!isAuthRoute) {
      // Surface failures globally so pages without their own .catch never fail silently.
      const message = err.response?.data?.message || `Request failed (${err.response?.status || 'network error'}).`;
      window.dispatchEvent(new CustomEvent('api-error', { detail: message }));
    }
    return Promise.reject(err);
  }
);

export default api;
