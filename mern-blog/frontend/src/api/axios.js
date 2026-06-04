// ─────────────────────────────────────────────────────────────
//  api/axios.js
//  A configured axios instance shared across the whole app.
//
//  WHY not just use plain fetch()?
//  Axios lets us set up "interceptors" — functions that run automatically
//  before every request goes out or after every response comes back.
//  We use them for two things:
//    1. REQUEST interceptor: attach the JWT from localStorage so we never
//       have to type "Authorization: Bearer ..." in every API call.
//    2. RESPONSE interceptor: if any request gets a 401 (token expired),
//       silently call /api/auth/refresh to get a new access token, then
//       retry the original request — all without the user ever seeing
//       a logged-out state. This is called "silent refresh".
// ─────────────────────────────────────────────────────────────
import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Vite's proxy forwards /api → http://localhost:5000/api
});

// ── REQUEST interceptor ──────────────────────────────────────
// Runs before every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── RESPONSE interceptor ────────────────────────────────────
// Runs after every response (success or error) comes back.
let isRefreshing = false; // guard: don't trigger multiple simultaneous refreshes
let failedQueue = [];     // requests that arrived while a refresh was in progress

// Resolve or reject all queued requests once we know the new token.
const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response, // pass successful responses through unchanged
  async (error) => {
    const original = error.config;

    // Only attempt a refresh for 401 errors, and only once per request
    // (_retry flag prevents infinite loops if refresh itself returns 401).
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Another request is already refreshing. Queue this one until done.
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        // No refresh token — user must log in again.
        localStorage.removeItem('accessToken');
        window.dispatchEvent(new Event('auth:logout'));
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        // Call refresh WITHOUT the interceptor (use plain axios to avoid loops).
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original); // retry the original request
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
