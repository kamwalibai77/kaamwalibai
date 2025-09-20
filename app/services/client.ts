// app/services/client.js
import axios from "axios";

const API_BASE_URL = "http://localhost:5000"; // replace with your backend URL

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export default client;
