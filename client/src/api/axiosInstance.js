import axios from "axios";

// Create an Axios instance
const API = axios.create({
  baseURL: "http://localhost:5000/api/auth",
   // ← Change if your backend runs on another port
});

// Optional: Add request interceptor for token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // get token from localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
