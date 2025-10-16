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
import faqRoutes from "./routes/faqRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import paymentsRoutes from "./routes/payments.js";
import plansRoutes from "./routes/plans.js";
import profileRoutes from "./routes/profile.js";
import serviceTypeRoutes from "./routes/serviceTypeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import userServicesRoutes from "./routes/userServicesRoutes.js";
import webhookRoutes from "./routes/webhook.js";
import ratingRoutes from "./routes/ratingRoutes.js";
import debugRoutes from "./routes/debugRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use("/api/webhook", webhookRoutes); // must be before express.json
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
app.use("/api/rating", ratingRoutes);
// Dev-only debug routes
if (process.env.NODE_ENV !== "production") {
  app.use("/api/_debug", debugRoutes);
}
app.use("/api/faqs", faqRoutes);
app.use("/api/plans", plansRoutes);

// Test route
app.get("/", (req, res) => res.send("Server running"));

// Create HTTP server & init WebSocket
const server = http.createServer(app);
initSocket(server);

// Function to start server
const startServer = async () => {
  try {
    // Sync DB
    await db.sequelize.sync();
    console.log("✅ Database synced");

    // Start server
    server.listen(PORT, () =>
      console.log(`🚀 Server running with WebSocket on port ${PORT}`)
    );

    // Periodic cleanup: remove expired OTPs
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
        console.error("[otp cleanup] error:", e && e.stack ? e.stack : e);
      }
    }, cleanupIntervalMs);

    // 🌟 Start ngrok only for local dev if enabled
    if (process.env.NODE_ENV !== "production" && process.env.NGROK === "true") {
      const ngrok = await import("@ngrok/ngrok");
      const url = await ngrok.connect({
        addr: PORT,
        authtoken_from_env: true,
      });
      console.log(`🔗 ngrok tunnel running at: ${url.url()}`);
    }
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

// Start everything
startServer();
