import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "https://dulcet-melba-cd9bf0.netlify.app/api" : "/api",
  withCredentials: true,
});
