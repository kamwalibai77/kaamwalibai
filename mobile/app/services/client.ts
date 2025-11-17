// app/services/client.js
import axios from "axios";
import { API_BASE_URL } from "../utills/config";

const client = axios.create({
  baseURL: API_BASE_URL.replace(/\/api$/, ""), // client expects base without /api
  timeout: 10000,
});

export default client;
