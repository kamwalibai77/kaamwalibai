const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { User } = require("../models");

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // check if email exists
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ error: "User already exists" });

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user with role (default = user if not provided)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    res.json({ message: "User created successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, // include role
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Login successful", token, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.profile = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader)
      return res.status(403).json({ error: "No token provided" });
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};
