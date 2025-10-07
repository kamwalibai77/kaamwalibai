import db from "../models/index.js";
import jwt from "jsonwebtoken";

const Otp = db.Otp;
const User = db.User;

const OTP_LENGTH = 6;
const OTP_EXPIRY_MIN = 5; // minutes
const MAX_ATTEMPTS = 5;

function generateOtp() {
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body || {};
    if (!phone) return res.status(400).json({ error: "phone is required" });

    // Rate limiting / cooldown checks
    const cooldownSecs = Number(process.env.OTP_COOLDOWN_SECS || 60);
    const dailyLimit = Number(process.env.OTP_DAILY_LIMIT || 10);

    const now = new Date();
    const cooldownWindow = new Date(now.getTime() - cooldownSecs * 1000);
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const recentCount = await Otp.count({
      where: {
        phone: String(phone),
        createdAt: { [db.Sequelize.Op.gte]: cooldownWindow },
      },
    });
    if (recentCount > 0) {
      return res.status(429).json({
        error: `Too many requests. Please wait ${cooldownSecs} seconds before retrying.`,
      });
    }

    const todayCount = await Otp.count({
      where: {
        phone: String(phone),
        createdAt: { [db.Sequelize.Op.gte]: dayStart },
      },
    });
    if (todayCount >= dailyLimit) {
      return res.status(429).json({
        error: `Daily OTP limit reached (${dailyLimit}). Try again tomorrow.`,
      });
    }

    const otp = generateOtp();
    const expires_at = new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000);

    // store plain OTP (dev behavior - ensure this is not used in production)
    await Otp.create({
      phone: String(phone),
      otp_hash: otp,
      expires_at,
      otp_plain: otp,
    });

    // Log OTP to server console for local dev (no SMS provider configured)
    console.log(`[otp] sent OTP for ${phone}: ${otp} (stored in DB otp_plain)`);

    return res.json({
      ok: true,
      expiresInMinutes: OTP_EXPIRY_MIN,
      cooldownSecs,
    });
  } catch (err) {
    console.error("sendOtp error:", err);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, role } = req.body || {};
    if (!phone || !otp)
      return res.status(400).json({ error: "phone and otp required" });

    // find latest unused OTP for phone
    const record = await Otp.findOne({
      where: { phone: String(phone), used: false },
      order: [["createdAt", "DESC"]],
    });

    if (!record)
      return res
        .status(400)
        .json({ error: "No OTP requested for this number" });
    if (record.attempts >= MAX_ATTEMPTS)
      return res.status(400).json({ error: "Too many attempts" });
    if (new Date() > new Date(record.expires_at))
      return res.status(400).json({ error: "OTP expired" });

    await record.update({ attempts: record.attempts + 1 });

    let valid = false;
    if (record.otp_plain) {
      valid = String(otp) === String(record.otp_plain);
    } else if (record.otp_hash) {
      const bcrypt = await import("bcryptjs");
      valid = await bcrypt.compare(String(otp), record.otp_hash);
    }
    if (!valid) return res.status(400).json({ error: "Invalid OTP" });

    // Check if user exists
    let user = await User.findOne({ where: { phoneNumber: String(phone) } });
    if (user) {
      // consume OTP and login
      await record.update({ used: true });
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "30d" }
      );
      return res.json({ ok: true, token, user, isNewUser: false });
    }

    // user does not exist → ask for role if not provided
    if (!role) {
      return res.json({ ok: true, needsRole: true });
    }

    // create user with provided role
    user = await User.create({
      name: `User_${Date.now()}`,
      phoneNumber: String(phone),
      password: "",
      role: role === "provider" ? "ServiceProvider" : "user",
    });

    await record.update({ used: true });
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "30d" }
    );
    return res.json({ ok: true, token, user, isNewUser: true });
  } catch (err) {
    console.error("verifyOtp error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ error: "Failed to verify OTP" });
  }
};

export default { sendOtp, verifyOtp };
