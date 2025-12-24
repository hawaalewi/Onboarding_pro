import axios from "axios";

// Create an Axios instance for user routes
const userAPI = axios.create({
  baseURL: "http://localhost:5000/api/user",
});

// Add request interceptor for token
userAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default userAPI;





