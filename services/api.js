// API service for making HTTP requests to backend
const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.VITE_API_URL || '/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // HTTP methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Authentication endpoints
  auth = {
    login: (credentials) => this.post('/auth/login', credentials),
    register: (userData) => this.post('/auth/register', userData),
    logout: () => this.post('/auth/logout'),
  };

  // User endpoints
  users = {
    getAll: () => this.get('/users'),
    getById: (id) => this.get(`/users/${id}`),
    update: (id, data) => this.put(`/users/${id}`, data),
    delete: (id) => this.delete(`/users/${id}`),
  };

  // Data endpoints
  data = {
    getAll: () => this.get('/data'),
    create: (data) => this.post('/data', data),
    update: (id, data) => this.put(`/data/${id}`, data),
    delete: (id) => this.delete(`/data/${id}`),
  };
}

export default new ApiService();