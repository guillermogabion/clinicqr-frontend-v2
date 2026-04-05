import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLoginPage = window.location.pathname === '/login';

    if (error.response?.status === 401 && !isLoginPage) {
      // Only clear storage and redirect if we aren't already on the login page
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Always reject so the calling function (AuthContext) can catch it
    return Promise.reject(error);
  }
);

export default api;
