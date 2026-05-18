import axios from 'axios';
import { useAuthStore } from '../store/index.js';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Inject JWT token into every request
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-logout on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register:    (name, email, password) => apiClient.post('/auth/register', { name, email, password }),
  login:       (email, password)       => apiClient.post('/auth/login',    { email, password }),
  googleLogin: (credential)            => apiClient.post('/auth/google',   { credential }).then(r => r.data),
};

export const productsAPI = {
  getAll:  ()             => apiClient.get('/products'),
  getById: (id)           => apiClient.get(`/products/${id}`),
  create:  (product)      => apiClient.post('/products', product),
  update:  (id, product)  => apiClient.patch(`/products/${id}`, product),
  delete:  (id)           => apiClient.delete(`/products/${id}`),
};

export const ordersAPI = {
  create:      (order)    => apiClient.post('/orders', order),
  getAll:      ()         => apiClient.get('/orders'),
  getById:     (id)       => apiClient.get(`/orders/${id}`),
  updateOrder: (id, data) => apiClient.patch(`/orders/${id}`, data),
  delete:      (id)       => apiClient.delete(`/orders/${id}`),
};

export const paymentAPI = {
  stkPush:       (phone, amount, orderId) => apiClient.post('/mpesa/stk-push', { phone, amount, orderId }),
  getStatus:     (checkoutId)             => apiClient.get(`/mpesa/status/${checkoutId}`),
  paybillConfirm:(orderId, phone, amount) => apiClient.post('/mpesa/paybill-confirm', { orderId, phone, amount }),
};

export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export default apiClient;
