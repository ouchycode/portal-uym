import { useAuth } from "@/store/auth";
import axios from "axios";

const API = axios.create({
  baseURL: "https://mahasiswa.lms.uym.ac.id",
});

API.interceptors.request.use((config) => {
  const token = useAuth.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers["college-id"] = "041105";

  return config;
});

API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      useAuth.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default API;
