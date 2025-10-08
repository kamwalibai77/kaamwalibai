import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import db from "./models/index.js";
import { initSocket } from "./sockets/socket.js";
import ngrok from "@ngrok/ngrok";

// Routes
import authRoutes from "./routes/authRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import availabilityRoutes from "./routes/availabilityTimeRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import serviceTypeRoutes from "./routes/serviceTypeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import userServicesRoutes from "./routes/userServicesRoutes.js";
import paymentsRoutes from "./routes/payments.js";
import webhookRoutes from "./routes/webhook.js";
import faqRoutes from "./routes/faq.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use("/api/webhook", webhookRoutes); // raw body first
app.use(express.json());

// REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth", otpRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/service-types", serviceTypeRoutes);
app.use("/api/service-provider", userServicesRoutes);
app.use("/api/service-provider/availability", availabilityRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/faqs", faqRoutes);

// Test route
app.get("/", (req, res) => res.send("Server running"));

// Create HTTP server
const server = http.createServer(app);

// Initialize socket
initSocket(server);

async function startServer() {
  try {
    await db.sequelize.sync();

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running with WebSocket on port ${PORT}`);
    });

    // OTP cleanup
    const cleanupIntervalMs = Number(
      process.env.OTP_CLEANUP_INTERVAL_MS || 60 * 60 * 1000
    );
    setInterval(async () => {
      try {
        const Op = db.Sequelize.Op;
        const now = new Date();
        const deleted = await db.Otp.destroy({
          where: { expires_at: { [Op.lt]: now } },
        });
        if (deleted)
          console.log(`[otp cleanup] removed ${deleted} expired OTP records`);
      } catch (e) {
        console.error("[otp cleanup] error:", e.stack || e);
      }
    }, cleanupIntervalMs);

    // Only start ngrok in development
    if (process.env.NODE_ENV === "development") {
      const listener = await ngrok.forward({
        addr: PORT,
        authtoken_from_env: true,
      });
      console.log(`🛠️ Development tunnel established at: ${listener.url()}`);
    }
  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
}

startServer();
