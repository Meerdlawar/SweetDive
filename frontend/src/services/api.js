import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
  register: (data) => api.post('/auth/register/', data),
  getCurrentUser: () => api.get('/auth/me/'),
};

// Customers API
export const customersAPI = {
  getAll: (params) => api.get('/customers/', { params }),
  getById: (id) => api.get(`/customers/${id}/`),
  create: (data) => api.post('/customers/', data),
  update: (id, data) => api.put(`/customers/${id}/`, data),
  delete: (id) => api.delete(`/customers/${id}/`),
  getSimpleList: () => api.get('/customers/list_simple/'),
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products/', { params }),
  getById: (id) => api.get(`/products/${id}/`),
  create: (data) => api.post('/products/', data),
  update: (id, data) => api.put(`/products/${id}/`, data),
  delete: (id) => api.delete(`/products/${id}/`),
  getSimpleList: () => api.get('/products/list_simple/'),
  getTypes: () => api.get('/products/types/'),
  getSuitabilities: () => api.get('/products/suitabilities/'),
};

// Orders API
export const ordersAPI = {
  getAll: (params) => api.get('/orders/', { params }),
  getById: (id) => api.get(`/orders/${id}/`),
  create: (data) => api.post('/orders/', data),
  update: (id, data) => api.put(`/orders/${id}/`, data),
  delete: (id) => api.delete(`/orders/${id}/`),
  getProducts: (id) => api.get(`/orders/${id}/products/`),
  addProduct: (id, data) => api.post(`/orders/${id}/add_product/`, data),
  removeProduct: (id, data) => api.post(`/orders/${id}/remove_product/`, data),
  getPaymentMethods: () => api.get('/orders/payment_methods/'),
  getStatuses: () => api.get('/orders/statuses/'),
};

// Allergens API
export const allergensAPI = {
  getAll: () => api.get('/allergens/'),
  getById: (id) => api.get(`/allergens/${id}/`),
  create: (data) => api.post('/allergens/', data),
  update: (id, data) => api.put(`/allergens/${id}/`, data),
  delete: (id) => api.delete(`/allergens/${id}/`),
  getTypes: () => api.get('/allergens/types/'),
  getAllInfo: () => api.get('/allergens/all_info/'),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats/'),
};

export default api;
