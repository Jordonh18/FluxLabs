import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:43121';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password) => api.post('/auth/register', { email, password }),
  verify: () => api.post('/auth/verify'),
};

// User API
export const userAPI = {
  getProfile: (userId) => api.get(`/users/profile/${userId}`),
  createProfile: (userId, data) => api.post(`/users/profile/${userId}`, data),
  updateProfile: (userId, data) => api.put(`/users/profile/${userId}`, data),
  getSettings: (userId) => api.get(`/users/settings/${userId}`),
  updateSettings: (userId, data) => api.put(`/users/settings/${userId}`, data),
};

// Lab API
export const labAPI = {
  getUserLabs: (userId) => api.get(`/labs/user/${userId}`),
  getLab: (labId) => api.get(`/labs/${labId}`),
  createLab: (data) => api.post('/labs', data),
  extendLab: (labId, additionalHours) => api.post(`/labs/${labId}/extend`, { additional_hours: additionalHours }),
  terminateLab: (labId) => api.delete(`/labs/${labId}`),
  getTemplates: () => api.get('/labs/templates'),
};

// Container API
export const containerAPI = {
  getContainer: (containerId) => api.get(`/containers/${containerId}`),
  startContainer: (containerId) => api.post(`/containers/${containerId}/start`),
  stopContainer: (containerId) => api.post(`/containers/${containerId}/stop`),
  getImages: () => api.get('/containers/images'),
};

export default api;
