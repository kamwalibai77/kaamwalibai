import express from "express";
import db from "./models/index.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Example route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start server
const startServer = async () => {
  try {
    // Connect & sync DB
    await db.sequelize.authenticate();
    console.log("✅ Database connected");

    // Sync models (optional: force: true only for dev)
    await db.sequelize.sync({ alter: true });
    console.log("✅ Database synced");

    // Start Express
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // 🌟 Local ngrok only (for testing)
    if (process.env.NODE_ENV !== "production" && process.env.NGROK === "true") {
      const ngrok = await import("ngrok");
      const url = await ngrok.connect({
        addr: PORT,
        authtoken: process.env.NGROK_AUTHTOKEN, // optional
      });
      console.log(`🔗 ngrok tunnel running at ${url}`);
    }
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
