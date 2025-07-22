import axios from 'axios';

const api = axios.create({
  baseURL: 'https://jcrw8tg1-3000.brs.devtunnels.ms',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor simplificado
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de resposta simplificado
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

export default api;
