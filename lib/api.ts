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

export default API;
