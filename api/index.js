import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// FIX: relative path from index.js to routes folder
import authRoutes from "./routes/authRoutes.js";

import db from "./models/index.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Test route
app.get("/", (req, res) => res.send("Server running"));

// Sync database and start server
const PORT = process.env.PORT || 5000;
db.sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
