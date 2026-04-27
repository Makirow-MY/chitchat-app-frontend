import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "https://mgy-chitchat-backend-keep.vercel.app/api" : "/api",
  withCredentials: true,
});
