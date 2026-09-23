import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || '/api';
export const ASSET_URL = import.meta.env.VITE_ASSET_URL || '';

const api = axios.create({ baseURL: API_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skv_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && location.pathname.startsWith('/admin')) {
      localStorage.removeItem('skv_token');
      localStorage.removeItem('skv_user');
      if (!location.pathname.includes('/admin/login')) location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

/** Turns a stored path into a full URL. */
export const assetUrl = (p) => {
  if (!p) return '';
  if (/^https?:\/\//.test(p)) return p;
  return `${ASSET_URL}${p.startsWith('/') ? '' : '/'}${p}`;
};

export const apiError = (e) =>
  e?.response?.data?.message || e?.message || 'Something went wrong. Please try again.';

export default api;
