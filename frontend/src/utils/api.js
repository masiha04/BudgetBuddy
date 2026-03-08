import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bb_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
