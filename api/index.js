import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import db from "./models/index.js";
import { initSocket } from "./sockets/socket.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import availabilityRoutes from "./routes/availabilityTimeRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import profileRoutes from "./routes/profile.js";
import serviceTypeRoutes from "./routes/serviceTypeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import userServicesRoutes from "./routes/userServicesRoutes.js";
import Subscription from "./models/subscription.js";

// Socket handler

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/service-types", serviceTypeRoutes);
app.use("/api/service-provider", userServicesRoutes);
app.use("/api/service-provider/availability", availabilityRoutes);

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
