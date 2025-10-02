import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import db from "./models/index.js";
import { initSocket } from "./sockets/socket.js";
import ngrok from "@ngrok/ngrok";

// Routes
import authRoutes from "./routes/authRoutes.js";
import availabilityRoutes from "./routes/availabilityTimeRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import profileRoutes from "./routes/profile.js";
import serviceTypeRoutes from "./routes/serviceTypeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import userServicesRoutes from "./routes/userServicesRoutes.js";
import paymentsRoutes from "./routes/payments.js";
import webhookRoutes from "./routes/webhook.js";

// Socket handler

dotenv.config();

const app = express();

// Middleware
app.use(cors());

// Mount webhook early so its raw body middleware can access the raw request
// before other body parsers (like express.json) consume the stream.
app.use("/api/webhook", webhookRoutes);

app.use(express.json());

// REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/service-types", serviceTypeRoutes);
app.use("/api/service-provider", userServicesRoutes);
app.use("/api/service-provider/availability", availabilityRoutes);
app.use("/api/payments", paymentsRoutes);

// Test route
app.get("/", (req, res) => res.send("Server running"));

// Create HTTP server
const server = http.createServer(app);

// init socket
initSocket(server);

// Sync DB & Start server
const PORT = process.env.PORT || 5000;
db.sequelize.sync().then(() => {
  server.listen(PORT, () =>
    console.log(`🚀 Server running with WebSocket on port ${PORT}`)
  );
});

const listener = await ngrok.forward({
  addr: 5000,
  authtoken_from_env: true,
});

// Output ngrok url to console
console.log(`Ingress established at: ${listener.url()}`);
