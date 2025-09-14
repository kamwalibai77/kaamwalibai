import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Routes
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profile.js"; // ✅ import profile routes
import userRoutes from "./routes/userRoutes.js";

import db from "./models/index.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes); // ✅ mount profile routes
app.use("/api/users", userRoutes);

// Test route
app.get("/", (req, res) => res.send("Server running"));

// Sync database and start server
const PORT = process.env.PORT || 5000;
db.sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
