const { User } = require("../models");

exports.updateProfile = async (req, res) => {
  try {
    const { userId, mobile, address, gender, age, adhar, pan } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    await user.update({ mobile, address, gender, age, adhar, pan });

    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
