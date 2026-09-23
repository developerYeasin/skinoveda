import api from './client';

export const authApi = {
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  updateProfile: (data) => api.put('/auth/profile', data).then((r) => r.data),
  changePassword: (data) => api.put('/auth/change-password', data).then((r) => r.data),
};

export const categoryApi = {
  list: () => api.get('/categories').then((r) => r.data),
  get: (slug) => api.get(`/categories/${slug}`).then((r) => r.data),
  create: (d) => api.post('/categories', d).then((r) => r.data),
  update: (id, d) => api.put(`/categories/${id}`, d).then((r) => r.data),
  remove: (id) => api.delete(`/categories/${id}`).then((r) => r.data),
  groups: (id) => api.get(`/categories/${id}/groups`).then((r) => r.data),
  addGroup: (id, d) => api.post(`/categories/${id}/groups`, d).then((r) => r.data),
};

export const serviceApi = {
  catalog: () => api.get('/services/catalog').then((r) => r.data),
  featured: (limit = 12) => api.get('/services/featured', { params: { limit } }).then((r) => r.data),
  list: (params) => api.get('/services', { params }).then((r) => r.data),
  get: (slug) => api.get(`/services/${slug}`).then((r) => r.data),
  create: (d) => api.post('/services', d).then((r) => r.data),
  update: (id, d) => api.put(`/services/${id}`, d).then((r) => r.data),
  remove: (id) => api.delete(`/services/${id}`).then((r) => r.data),
};

export const appointmentApi = {
  book: (d) => api.post('/appointments', d).then((r) => r.data),
  list: (params) => api.get('/appointments', { params }).then((r) => r.data),
  track: (code) => api.get(`/appointments/track/${code}`).then((r) => r.data),
  update: (id, d) => api.put(`/appointments/${id}`, d).then((r) => r.data),
  remove: (id) => api.delete(`/appointments/${id}`).then((r) => r.data),
};

export const teamApi = {
  list: (params) => api.get('/team', { params }).then((r) => r.data),
  get: (id) => api.get(`/team/${id}`).then((r) => r.data),
  create: (d) => api.post('/team', d).then((r) => r.data),
  update: (id, d) => api.put(`/team/${id}`, d).then((r) => r.data),
  remove: (id) => api.delete(`/team/${id}`).then((r) => r.data),
};

export const galleryApi = {
  list: (params) => api.get('/gallery', { params }).then((r) => r.data),
  create: (d) => api.post('/gallery', d).then((r) => r.data),
  update: (id, d) => api.put(`/gallery/${id}`, d).then((r) => r.data),
  remove: (id) => api.delete(`/gallery/${id}`).then((r) => r.data),
};

export const blogApi = {
  list: (params) => api.get('/blogs', { params }).then((r) => r.data),
  all: () => api.get('/blogs/admin/all').then((r) => r.data),
  get: (slug) => api.get(`/blogs/${slug}`).then((r) => r.data),
  create: (d) => api.post('/blogs', d).then((r) => r.data),
  update: (id, d) => api.put(`/blogs/${id}`, d).then((r) => r.data),
  remove: (id) => api.delete(`/blogs/${id}`).then((r) => r.data),
};

export const testimonialApi = {
  list: (params) => api.get('/testimonials', { params }).then((r) => r.data),
  create: (d) => api.post('/testimonials', d).then((r) => r.data),
  update: (id, d) => api.put(`/testimonials/${id}`, d).then((r) => r.data),
  remove: (id) => api.delete(`/testimonials/${id}`).then((r) => r.data),
};

export const contactApi = {
  send: (d) => api.post('/contact', d).then((r) => r.data),
  list: (params) => api.get('/contact', { params }).then((r) => r.data),
  update: (id, d) => api.put(`/contact/${id}`, d).then((r) => r.data),
  remove: (id) => api.delete(`/contact/${id}`).then((r) => r.data),
};

export const subscriberApi = {
  subscribe: (email) => api.post('/subscribers', { email }).then((r) => r.data),
  list: () => api.get('/subscribers').then((r) => r.data),
  remove: (id) => api.delete(`/subscribers/${id}`).then((r) => r.data),
};

export const settingApi = {
  public: () => api.get('/settings/public').then((r) => r.data),
  tracking: () => api.get('/settings/tracking').then((r) => r.data),
  all: () => api.get('/settings').then((r) => r.data),
  save: (settings, group) => api.put('/settings', { settings, group }).then((r) => r.data),
};

export const analyticsApi = {
  overview: (params) => api.get('/analytics/overview', { params }).then((r) => r.data),
  realtime: () => api.get('/analytics/realtime').then((r) => r.data),
  events: (params) => api.get('/analytics/events', { params }).then((r) => r.data),
};

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats').then((r) => r.data),
};

export const uploadApi = {
  file: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  },
};
