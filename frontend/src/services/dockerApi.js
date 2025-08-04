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

// Pure Docker API - NO DATABASE DEPENDENCIES WHATSOEVER
export const dockerAPI = {
  // Get all containers with FluxLabs labels
  getLabContainers: () => api.get('/docker/containers'),
  
  // Get specific container details
  getContainer: (containerId) => api.get(`/docker/containers/${containerId}`),
  
  // Get container logs
  getContainerLogs: (containerId) => api.get(`/docker/containers/${containerId}/logs`),
  
  // Get container stats
  getContainerStats: (containerId) => api.get(`/docker/containers/${containerId}/stats`),
  
  // Start container
  startContainer: (containerId) => api.post(`/docker/containers/${containerId}/start`),
  
  // Stop container
  stopContainer: (containerId) => api.post(`/docker/containers/${containerId}/stop`),
  
  // Remove container
  removeContainer: (containerId) => api.delete(`/docker/containers/${containerId}`),
  
  // Execute command in container
  execCommand: (containerId, command) => api.post(`/docker/containers/${containerId}/exec`, { command }),
  
  // Create new container
  createContainer: (config) => api.post('/docker/containers/create', config),
  
  // Get available images
  getImages: () => api.get('/docker/images'),
};

// Pure Docker-based lab API - NO DATABASE DEPENDENCIES
export const labAPI = {
  // Get user labs directly from Docker containers only
  getUserLabs: async (userId) => {
    try {
      // Get ONLY Docker containers with FluxLabs labels
      const dockerContainers = await dockerAPI.getLabContainers();
      
      // Transform Docker containers into lab format
      const labs = dockerContainers.data.map(container => {
        const containerName = container.Names?.[0]?.replace('/', '') || 'Unknown Lab';
        const containerLabels = container.Labels || {};
        
        return {
          id: container.Id, // Use container ID as lab ID
          container_id: container.Id,
          name: containerLabels['fluxlabs.name'] || containerName,
          template_id: containerLabels['fluxlabs.template'] || 'unknown',
          user_id: containerLabels['fluxlabs.user_id'] || userId,
          status: container.State.toLowerCase(),
          docker_status: container.Status,
          actual_status: container.State.toLowerCase(),
          ports: container.Ports || [],
          created_at: container.Created,
          started_at: container.State === 'running' ? container.State.StartedAt : null,
          is_docker_active: true,
          image: container.Image,
          // Generate display info from container data
          display_name: containerLabels['fluxlabs.display_name'] || containerName,
          description: containerLabels['fluxlabs.description'] || 'Docker Container Lab',
          created_by: containerLabels['fluxlabs.created_by'] || 'Unknown',
          duration_hours: parseInt(containerLabels['fluxlabs.duration_hours']) || 24,
          expires_at: containerLabels['fluxlabs.expires_at'] || null
        };
      });
      
      // Filter by user ID if provided (from container labels)
      const userLabs = userId ? labs.filter(lab => 
        lab.user_id === userId || !lab.user_id // Include containers without user_id
      ) : labs;
      
      return { data: userLabs };
    } catch (error) {
      console.error('Error fetching Docker containers:', error);
      return { data: [] }; // Return empty array instead of database fallback
    }
  },

  // Get specific lab from Docker container only
  getLab: async (containerId) => {
    try {
      const dockerContainer = await dockerAPI.getContainer(containerId);
      const container = dockerContainer.data;
      const containerLabels = container.Config?.Labels || {};
      
      return {
        data: {
          id: container.Id,
          container_id: container.Id,
          name: containerLabels['fluxlabs.name'] || container.Name?.replace('/', '') || 'Unknown Lab',
          template_id: containerLabels['fluxlabs.template'] || 'unknown',
          user_id: containerLabels['fluxlabs.user_id'] || 'unknown',
          status: container.State?.Status?.toLowerCase() || 'unknown',
          docker_status: container.State?.Status || 'Unknown',
          actual_status: container.State?.Status?.toLowerCase() || 'unknown',
          ports: container.NetworkSettings?.Ports || {},
          created_at: container.Created,
          started_at: container.State?.StartedAt,
          is_docker_active: true,
          ssh_info: getSshInfo(container),
          image: container.Config?.Image,
          display_name: containerLabels['fluxlabs.display_name'] || container.Name?.replace('/', ''),
          description: containerLabels['fluxlabs.description'] || 'Docker Container Lab',
          created_by: containerLabels['fluxlabs.created_by'] || 'Unknown'
        }
      };
    } catch (error) {
      throw error;
    }
  },

  // Create lab - Docker container only
  createLab: async (data) => {
    try {
      return await dockerAPI.createContainer({
        image: data.image || 'ubuntu:latest',
        name: data.name,
        labels: {
          'fluxlabs.name': data.name,
          'fluxlabs.template': data.template_id || 'custom',
          'fluxlabs.user_id': data.user_id,
          'fluxlabs.display_name': data.display_name || data.name,
          'fluxlabs.description': data.description || 'Docker Container Lab',
          'fluxlabs.created_by': data.created_by || 'FluxLabs',
          'fluxlabs.duration_hours': (data.duration_hours || 24).toString(),
          'fluxlabs.created_at': new Date().toISOString(),
          'fluxlabs.expires_at': new Date(Date.now() + (data.duration_hours || 24) * 60 * 60 * 1000).toISOString()
        }
      });
    } catch (error) {
      throw error;
    }
  },
  
  // Terminate lab - Docker only
  terminateLab: async (containerId) => {
    try {
      return await dockerAPI.removeContainer(containerId);
    } catch (error) {
      throw error;
    }
  },
  
  // Get templates - no database
  getTemplates: () => {
    return Promise.resolve({
      data: [
        { id: 'ubuntu', name: 'Ubuntu 22.04', image: 'ubuntu:22.04', description: 'Basic Ubuntu environment' },
        { id: 'python', name: 'Python 3.11', image: 'python:3.11', description: 'Python development environment' },
        { id: 'node', name: 'Node.js 18', image: 'node:18', description: 'Node.js development environment' }
      ]
    });
  }
};

// Extract SSH connection info from Docker container
function getSshInfo(container) {
  const ports = container.NetworkSettings?.Ports || {};
  const sshPort = ports['22/tcp'];
  
  if (sshPort && sshPort.length > 0) {
    return {
      host: 'localhost',
      port: sshPort[0].HostPort,
      command: `ssh root@localhost -p ${sshPort[0].HostPort}`
    };
  }
  
  return null;
}

// Container management API - Docker only
export const containerAPI = {
  startContainer: dockerAPI.startContainer,
  stopContainer: dockerAPI.stopContainer,
  removeContainer: dockerAPI.removeContainer,
  getContainerLogs: dockerAPI.getContainerLogs,
  getContainerStats: dockerAPI.getContainerStats,
  execCommand: dockerAPI.execCommand,
  getContainer: dockerAPI.getContainer,
  getLabContainers: dockerAPI.getLabContainers,
};

export default api;
