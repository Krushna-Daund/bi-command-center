import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || '/api'}`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// A utility to clean up empty filters before sending
export const getFilteredData = async (endpoint, filters) => {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v != null && v !== '')
  );
  
  const response = await api.get(endpoint, { params: cleanFilters });
  return response.data;
};

export default api;
