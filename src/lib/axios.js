import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:"https://mgy-chitchat-backend.vercel.app/api",
  withCredentials: true,
});
