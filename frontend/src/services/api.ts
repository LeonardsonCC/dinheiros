import axios from 'axios';

// Using relative URL to leverage Vite's proxy
// Note: The /api prefix is handled by Vite's proxy configuration
const API_URL = '';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access (e.g., redirect to login)
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Categorization Rules API
export const categorizationRulesApi = {
  list: () => api.get('/api/categorization-rules'),
  get: (id: number) => api.get(`/api/categorization-rules/${id}`),
  create: (data: { name: string; type: string; value: string; transaction_type: string; category_dst: number; active?: boolean }) => 
    api.post('/api/categorization-rules', data),
  update: (id: number, data: { name?: string; type?: string; value?: string; transaction_type?: string; category_dst?: number; active?: boolean }) => 
    api.put(`/api/categorization-rules/${id}`, data),
  delete: (id: number) => api.delete(`/api/categorization-rules/${id}`),
};

// Categories API
export const categoriesApi = {
  list: () => api.get('/api/categories'),
  create: (data: { name: string; type: string }) => api.post('/api/categories', data),
  update: (id: string, data: { name: string; type: string }) => api.put(`/api/categories/${id}`, data),
  delete: (id: string) => api.delete(`/api/categories/${id}`),
};
