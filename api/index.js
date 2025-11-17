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
import debugRoutes from "./routes/debugRoutes.js";
import faqRoutes from "./routes/faqRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import paymentsRoutes from "./routes/payments.js";
import plansRoutes from "./routes/plans.js";
import profileRoutes from "./routes/profile.js";
import ratingRoutes from "./routes/ratingRoutes.js";
import serviceTypeRoutes from "./routes/serviceTypeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import userServicesRoutes from "./routes/userServicesRoutes.js";
import webhookRoutes from "./routes/webhook.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Quick request logger to help debug unreachable/Network Error issues from clients.
// This is temporary — it prints method, url and a subset of headers to the server
// console so you can confirm whether requests from the device or Expo reach
// the node process.
app.use((req, res, next) => {
  try {
    const safeHeaders = {
      host: req.headers.host,
      origin: req.headers.origin,
      authorization: req.headers.authorization,
      "content-type": req.headers["content-type"],
    };
    console.log("[REQ]", req.method, req.originalUrl, safeHeaders);
  } catch (e) {
    console.warn("[REQ] header log failed", e);
  }
  next();
});

// Middleware
// Enable CORS for requests from the app / device. By default cors() allows
// any origin, but for clarity we accept the Origin header and allow credentials.
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl) or any origin during dev.
      if (!origin || process.env.NODE_ENV !== "production")
        return callback(null, true);
      // In production you should check the origin against an allowlist.
      return callback(null, true);
    },
    credentials: true,
  })
);

// Set a safe Referrer-Policy header for all responses to avoid noisy browser
// console messages. This doesn't affect CORS but can reduce client-side warnings.
app.use((req, res, next) => {
  res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
  next();
});
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

    // Start server and bind to 0.0.0.0 so it's reachable on the LAN IP
    server.listen(PORT, "0.0.0.0", () => {
      const host = process.env.HOST || "0.0.0.0";
      console.log(
        `🚀 Server running with WebSocket on port ${PORT} (bound to ${host})`
      );
    });

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
