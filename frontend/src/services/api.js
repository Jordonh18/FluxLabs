import axios from 'axios';

const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://10.0.0.10:43121';

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

// Simple Docker-only lab API - Direct endpoints, no database
export const labAPI = {
  // Get all labs for a user (Docker containers with user label)
  getUserLabs: (userId) => api.get(`/labs?user_id=${userId}`),
  
  // Get specific lab by container ID
  getLab: (containerId) => api.get(`/lab/${containerId}`),
  
  // Create lab (creates Docker container with user label)
  createLab: (data) => api.post('/create-lab', {
    ...data,
    user_id: data.user_id // Ensure user_id is included for labeling
  }),
  
  // Delete lab (removes Docker container)
  deleteLab: (containerId) => api.delete(`/delete-lab/${containerId}`),
  
  // Get templates
  getTemplates: () => api.get('/templates'),
  
  // For backward compatibility, map terminateLab to deleteLab
  terminateLab: (containerId) => api.delete(`/delete-lab/${containerId}`)
};

// Simple Docker container controls - all use the new easy endpoints
export const dockerAPI = {
  // Start container
  startContainer: (containerId) => api.post(`/lab/${containerId}/start`),
  
  // Stop container
  stopContainer: (containerId) => api.post(`/lab/${containerId}/stop`),
  
  // Remove container (same as delete lab)
  removeContainer: (containerId) => api.delete(`/delete-lab/${containerId}`),
  
  // Get container logs
  getContainerLogs: (containerId) => api.get(`/lab/${containerId}/logs`),
  
  // Get container stats
  getContainerStats: (containerId) => api.get(`/lab/${containerId}/stats`),
  
  // Execute command in container
  execCommand: (containerId, command) => api.post(`/lab/${containerId}/exec`, { command }),
  
  // Restart container
  restartContainer: (containerId) => api.post(`/lab/${containerId}/restart`),
  
  // Get container processes
  getContainerProcesses: (containerId) => api.get(`/lab/${containerId}/processes`),
};

export default api;
