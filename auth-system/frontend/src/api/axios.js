import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue  = [];
const processQueue = (err, token = null) => { failedQueue.forEach((p) => err ? p.reject(err) : p.resolve(token)); failedQueue = []; };

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      if (isRefreshing) return new Promise((res, rej) => failedQueue.push({ resolve: res, reject: rej })).then((t) => { orig.headers.Authorization = `Bearer ${t}`; return api(orig); });
      orig._retry = true; isRefreshing = true;
      const rt = localStorage.getItem('refreshToken');
      if (!rt) { window.dispatchEvent(new Event('auth:logout')); isRefreshing = false; return Promise.reject(error); }
      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken: rt });
        localStorage.setItem('accessToken',  data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        processQueue(null, data.accessToken);
        orig.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(orig);
      } catch (e) {
        processQueue(e);
        localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken');
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(e);
      } finally { isRefreshing = false; }
    }
    return Promise.reject(error);
  }
);

export default api;
