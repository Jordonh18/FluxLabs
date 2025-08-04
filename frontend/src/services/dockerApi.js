import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://10.0.0.10:43121';

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

// Docker service for real-time container information
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
};

// Enhanced lab API that combines database and Docker data
export const labAPI = {
  // Get user labs with real-time Docker status
  getUserLabs: async (userId) => {
    try {
      // Get both database labs and Docker containers
      const [dbLabs, dockerContainers] = await Promise.all([
        api.get(`/labs/user/${userId}`),
        dockerAPI.getLabContainers()
      ]);
      
      // Create a map of container IDs to Docker data
      const containerMap = new Map();
      dockerContainers.data.forEach(container => {
        containerMap.set(container.Id, container);
      });
      
      // Merge database and Docker data, prioritizing Docker reality
      const mergedLabs = dbLabs.data.map(lab => {
        const dockerContainer = containerMap.get(lab.container_id);
        
        if (dockerContainer) {
          // Container exists in Docker - use Docker status
          return {
            ...lab,
            status: dockerContainer.State.toLowerCase(),
            docker_status: dockerContainer.Status,
            actual_status: dockerContainer.State.toLowerCase(),
            ports: dockerContainer.Ports || [],
            created_at: dockerContainer.Created,
            started_at: dockerContainer.State === 'running' ? dockerContainer.StartedAt : null,
            is_docker_active: true
          };
        } else {
          // Container doesn't exist in Docker anymore
          return {
            ...lab,
            status: 'terminated',
            actual_status: 'not_found',
            is_docker_active: false,
            docker_status: 'Container not found'
          };
        }
      });
      
      // Filter out terminated labs that are older than 1 hour
      const activeOrRecentLabs = mergedLabs.filter(lab => {
        if (lab.is_docker_active) return true;
        
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const updatedAt = new Date(lab.updated_at || lab.created_at);
        return updatedAt > oneHourAgo;
      });
      
      return { data: activeOrRecentLabs };
    } catch (error) {
      console.error('Error fetching labs with Docker status:', error);
      // Fallback to database only
      return api.get(`/labs/user/${userId}`);
    }
  },

  // Get specific lab with Docker status
  getLab: async (labId) => {
    try {
      const lab = await api.get(`/labs/${labId}`);
      
      if (lab.data.container_id) {
        try {
          const dockerContainer = await dockerAPI.getContainer(lab.data.container_id);
          return {
            data: {
              ...lab.data,
              status: dockerContainer.data.State.Status.toLowerCase(),
              docker_status: dockerContainer.data.Status,
              actual_status: dockerContainer.data.State.Status.toLowerCase(),
              ports: dockerContainer.data.NetworkSettings?.Ports || {},
              is_docker_active: true,
              ssh_info: getSshInfo(dockerContainer.data)
            }
          };
        } catch (dockerError) {
          console.warn('Container not found in Docker:', dockerError);
          return {
            data: {
              ...lab.data,
              status: 'terminated',
              actual_status: 'not_found',
              is_docker_active: false,
              docker_status: 'Container not found'
            }
          };
        }
      }
      
      return lab;
    } catch (error) {
      throw error;
    }
  },

  // Create lab
  createLab: (labData) => api.post('/labs', labData),
  
  // Terminate lab (both database and Docker)
  terminateLab: async (labId) => {
    try {
      // Get lab details first
      const lab = await api.get(`/labs/${labId}`);
      
      // Remove from Docker if container exists
      if (lab.data.container_id) {
        try {
          await dockerAPI.removeContainer(lab.data.container_id);
        } catch (dockerError) {
          console.warn('Container already removed or not found:', dockerError);
        }
      }
      
      // Update database
      return api.delete(`/labs/${labId}`);
    } catch (error) {
      throw error;
    }
  },
  
  // Extend lab
  extendLab: (labId, hours) => api.post(`/labs/${labId}/extend`, { hours }),
  
  // Get templates
  getTemplates: () => api.get('/templates'),
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

// Container management API
export const containerAPI = {
  startContainer: dockerAPI.startContainer,
  stopContainer: dockerAPI.stopContainer,
  removeContainer: dockerAPI.removeContainer,
  getContainerLogs: dockerAPI.getContainerLogs,
  getContainerStats: dockerAPI.getContainerStats,
  execCommand: dockerAPI.execCommand,
};

export default api;
