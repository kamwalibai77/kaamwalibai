import db from "../models/index.js";
import { authMiddleware } from "../middleware/auth.js";

const User = db.User;

// ✅ Update Profile
export const updateProfile = async (req, res) => {
  try {
    const { address, gender, age, adhar, pan } = req.body;
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    await user.update({ address, gender, age, adhar, pan });
    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get logged-in user
export const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ✅ Subscribe user
export const subscribeUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    user.isSubscribed = true;
    await user.save();

    res.json({ success: true, message: "User subscribed successfully", user });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};
