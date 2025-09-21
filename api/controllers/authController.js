// backend/controllers/authController.js
import db from "../models/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const User = db.User;

export default {
  // Register
  register: async (req, res) => {
    try {
      const { name, phoneNumber, password, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { phoneNumber } });
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "Phone Number already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        name,
        phoneNumber,
        password: hashedPassword,
        role,
      });

      // Generate JWT
      const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.status(201).json({
        id: newUser.id,
        name: newUser.name,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        token, // ✅ send token
      });
    } catch (err) {
      console.error("Register Error:", err);
      res.status(500).json({ error: "Registration failed" });
    }
  },

  // Login
  login: async (req, res) => {
    try {
      const { phoneNumber, password } = req.body;

      const user = await User.findOne({ where: { phoneNumber } });
      if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      // Generate JWT
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.json({
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        token,
      });
    } catch (err) {
      console.error("Login Error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  },
};
