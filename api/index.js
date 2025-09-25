import cors from "cors";
import dotenv from "dotenv";
import express from "express";

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
app.use("/api/chat", chatRoutes);

import availabilityRoutes from "./routes/availabilityTimeRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import serviceTypeRoutes from "./routes/serviceTypeRoutes.js";
import userServicesRoutes from "./routes/userServicesRoutes.js";

app.use("/api/service-types", serviceTypeRoutes);
app.use("/api/service-provider", userServicesRoutes);
app.use("/api/service-provider/availability", availabilityRoutes);

// Test route
app.get("/", (req, res) => res.send("Server running"));

console.log("All the routes: ", app.stack);
// Sync database and start server
const PORT = process.env.PORT || 5000;
db.sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
