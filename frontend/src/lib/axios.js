import axios from "axios";

// Use environment variable for API URL (works in both dev and production)
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies with the request
});









//http://localhost:5001/api