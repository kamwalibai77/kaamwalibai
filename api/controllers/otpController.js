import jwt from "jsonwebtoken";
import db from "../models/index.js";

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

    // Attempt to send OTP via SMS gateway. By default we assume 2factor.in API
    // Format: https://2factor.in/API/V1/{API_KEY}/SMS/{MOBILE}/{OTP}
    // You can override provider/key via env: SMS_GATEWAY_PROVIDER and SMS_GATEWAY_KEY
    const apiKey =
      process.env.SMS_GATEWAY_KEY || "a2411f6e-a794-11f0-b922-0200cd936042";
    const provider = (
      process.env.SMS_GATEWAY_PROVIDER || "2factor"
    ).toLowerCase();

    const phoneDigits = String(phone).replace(/\D/g, "");
    let providerResponse = null;
    try {
      // Allow explicit 'twilio' provider or automatic use when TWILIO_AUTH_TOKEN is set
      const twilioToken =
        process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_SECRET;
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioFrom = process.env.TWILIO_FROM;

      if (provider === "twilio" || (twilioToken && twilioSid && twilioFrom)) {
        if (!twilioSid || !twilioToken || !twilioFrom) {
          console.warn(
            "[otp] Twilio configured but missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_FROM"
          );
        } else {
          const toNumber = phoneDigits.startsWith("+")
            ? phoneDigits
            : `+${phoneDigits}`;
          const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
          const params = new URLSearchParams();
          params.append("To", toNumber);
          params.append("From", twilioFrom);
          params.append("Body", `Your OTP is ${otp}`);
          const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString(
            "base64"
          );
          const r = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
          });
          try {
            providerResponse = await r.json();
          } catch (e) {
            providerResponse = { status: r.status };
          }
          console.log("[otp] twilio provider response:", providerResponse);
        }
      } else if (provider === "2factor") {
        const smsUrl = `https://2factor.in/API/V1/${apiKey}/SMS/${phoneDigits}/${otp}`;
        // Node 18+ has global fetch; wrap in try/catch
        const r = await fetch(smsUrl);
        try {
          providerResponse = await r.json();
        } catch (e) {
          providerResponse = { status: r.status };
        }
        console.log("[otp] sms provider response:", providerResponse);
      } else {
        // Generic POST interface (if you set SMS_GATEWAY_PROVIDER to 'generic')
        const url = process.env.SMS_GATEWAY_URL;
        if (url) {
          const r = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey, phone: phoneDigits, otp }),
          });
          try {
            providerResponse = await r.json();
          } catch (e) {
            providerResponse = { status: r.status };
          }
        } else {
          console.warn("[otp] No SMS_GATEWAY_URL set for generic provider");
        }
      }
    } catch (err) {
      console.warn("[otp] Failed to send OTP via SMS gateway:", err);
    }

    // Log OTP to server console for local dev (still kept for debugging)
    console.log(`[otp] sent OTP for ${phone}: ${otp} (stored in DB otp_plain)`);

    const responsePayload = {
      ok: true,
      expiresInMinutes: OTP_EXPIRY_MIN,
      cooldownSecs,
      otp,
    };
    if (process.env.DEBUG_OTP === "true")
      responsePayload.providerResponse = providerResponse;
    return res.json(responsePayload);
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
        {
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          role: user.role,
        },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "30d" }
      );
      return res.json({ ok: true, token, user, isNewUser: false });
    }

    // New phone: consume OTP and issue a temporary token containing phone only.
    await record.update({ used: true });
    const tempToken = jwt.sign(
      { phone: String(phone), isNewUser: true },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "30m" }
    );
    // Return token but do NOT create a permanent user yet. Client should redirect to profile edit
    // and call /auth/complete-signup to create the user.
    return res.json({
      ok: true,
      token: tempToken,
      user: null,
      isNewUser: true,
    });
  } catch (err) {
    console.error("verifyOtp error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ error: "Failed to verify OTP" });
  }
};

export const completeSignup = async (req, res) => {
  try {
    // Expect Authorization: Bearer <tempToken>
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer "))
      return res.status(401).json({ error: "Missing token" });
    const token = auth.split(" ")[1];
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || "secret");
    } catch (e) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    if (!payload || !payload.phone || !payload.isNewUser)
      return res.status(400).json({ error: "Invalid signup token" });

    // Normalize role helper
    const normalizeRole = (r) => {
      if (!r) return null;
      const v = String(r).toLowerCase();
      if (
        v === "serviceprovider" ||
        v === "service_provider" ||
        v === "provider"
      )
        return "ServiceProvider";
      if (v === "admin" || v === "superadmin") return "superadmin";
      return "user";
    };

    // If multipart/form-data, fields are in req.body and file in req.file
    const { name, role, address, gender, age, latitude, longitude } = req.body;

    // Role is optional for a minimal signup flow. If not provided, default to
    // a regular 'user'. This lets the mobile client create an account with
    // just a phone number and continue onboarding later.
    const roleToSave = normalizeRole(role) || "user";

    // Create the user record
    const newUser = await User.create({
      name: name || `User_${Date.now()}`,
      phoneNumber: String(payload.phone),
      password: "",
      role: roleToSave,
      address: address || null,
      gender: gender || null,
      age: age ? Number(age) : null,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
    });

    // If a profile photo was uploaded, and middleware saved req.file.path, handle cloudinary upload here
    if (req.file && req.file.path) {
      try {
        const uploadRes = await import("../config/cloudinary.js");
        const cloud = uploadRes.default || uploadRes;
        const upl = await cloud.uploader.upload(req.file.path, {
          folder: "maid-service",
        });
        newUser.profilePhoto = upl.secure_url;
        await newUser.save();
      } catch (e) {
        console.warn("Failed to upload profile photo during signup:", e);
      }
    }

    // Issue permanent JWT
    const authToken = jwt.sign(
      {
        id: newUser.id,
        name: newUser.name,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "30d" }
    );

    return res.json({ ok: true, token: authToken, user: newUser });
  } catch (err) {
    console.error("completeSignup error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ error: "Failed to complete signup" });
  }
};

// JSON-only variant of completeSignup for clients that cannot send multipart
// payloads reliably. Creates the user from the phone number present in the
// temporary token. Does not attempt to process uploaded files.
export const completeSignupSimple = async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer "))
      return res.status(401).json({ error: "Missing token" });
    const token = auth.split(" ")[1];
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || "secret");
    } catch (e) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    if (!payload || !payload.phone || !payload.isNewUser)
      return res.status(400).json({ error: "Invalid signup token" });

    const normalizeRole = (r) => {
      if (!r) return null;
      const v = String(r).toLowerCase();
      if (
        v === "serviceprovider" ||
        v === "service_provider" ||
        v === "provider"
      )
        return "ServiceProvider";
      if (v === "admin" || v === "superadmin") return "superadmin";
      return "user";
    };

    const { name, role, address, gender, age, latitude, longitude } = req.body || {};
    const roleToSave = normalizeRole(role) || "user";

    const newUser = await User.create({
      name: name || `User_${Date.now()}`,
      phoneNumber: String(payload.phone),
      password: "",
      role: roleToSave,
      address: address || null,
      gender: gender || null,
      age: age ? Number(age) : null,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
    });

    const authToken = jwt.sign(
      {
        id: newUser.id,
        name: newUser.name,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "30d" }
    );

    return res.json({ ok: true, token: authToken, user: newUser });
  } catch (err) {
    console.error("completeSignupSimple error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ error: "Failed to complete signup" });
  }
};

export default { sendOtp, verifyOtp };
