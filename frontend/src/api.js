import axios from 'axios';

const isLocalhost =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API = axios.create({
  baseURL: isLocalhost
    ? 'http://localhost:5000/api'
    : 'https://digital-labour-marketplace-1qhz.vercel.app/api',
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;