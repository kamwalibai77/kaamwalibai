import express from "express";
import fs from "fs";
import cloudinary from "../config/cloudinary.js";
import { authMiddleware } from "../middleware/auth.js";
import { upload } from "../middleware/multer.js";
import db from "../models/index.js";

const router = express.Router();
const User = db.User;

/**
 * Update profile with photo
 */
router.put(
  "/update",
  authMiddleware,
  upload.single("profilePhoto"), // save to local first
  async (req, res) => {
    const transaction = await db.sequelize.transaction();
    let localFilePath;

    try {
        const userId = req.user.id;
        const {
          name,
          phoneNumber,
          address,
          gender,
          age,
          latitude,
          longitude,
          role,
        } = req.body;

        // Extra debug logs for profile update troubleshooting
        // Logs: who is updating, submitted fields (non-sensitive), and uploaded file info.
        console.log("[Profile Update] incoming:", {
          userId,
          body: { name, phoneNumber, address, gender, age, latitude, longitude, role },
          file: req.file ? { originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size, path: req.file.path } : null,
          timestamp: new Date().toISOString(),
        });

      // Enforce role immutability server-side: if the user already has a role,
      // do not allow it to be changed via this endpoint. Only allow setting
      // role when the existing role is empty/null.
      const existingUser = await User.findByPk(userId);
      let roleToSave = role;
      if (existingUser && existingUser.role) {
        // ignore role from request to prevent elevation or changes
        roleToSave = existingUser.role;
      }

      // Log decision about role to save (helps debug immutability issues)
      console.log("[Profile Update] role decision:", {
        requestedRole: role,
        existingRole: existingUser ? existingUser.role : null,
        roleToSave,
      });

      // save local path for cleanup
      localFilePath = req.file?.path;

      if (!phoneNumber || !address) {
        if (localFilePath && fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
        return res
          .status(400)
          .json({ success: false, message: "Number and Address required" });
      }

      // Save user to DB
      const [rowsUpdated, [updatedUser]] = await User.update(
        {
          name,
          phoneNumber,
          address,
          gender,
          age,
          latitude,
          longitude,
          role: roleToSave,
        },
        {
          where: { id: userId },
          returning: true,
          transaction,
        }
      );

      if (rowsUpdated === 0) {
        if (localFilePath && fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
        await transaction.rollback();
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Upload to Cloudinary if file present
      let cloudinaryUrl = null;
      if (localFilePath) {
        if (
          !process.env.CLOUDINARY_API_KEY ||
          !process.env.CLOUDINARY_API_SECRET
        ) {
          // Cloudinary not configured — cleanup and error
          if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
          await transaction.rollback();
          return res
            .status(500)
            .json({ error: "Cloudinary not configured on server" });
        }

        const uploadRes = await cloudinary.uploader.upload(localFilePath, {
          folder: "maid-service",
        });
        cloudinaryUrl = uploadRes.secure_url;

        updatedUser.profilePhoto = cloudinaryUrl;
        await updatedUser.save({ transaction });

        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
      }

      await transaction.commit();

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (err) {
      console.error("Profile Update Error:", err);

      await transaction.rollback();

      if (localFilePath && fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }

      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

/**
 * Subscribe / Start free trial
 */
router.put("/subscribe", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rowsUpdated, [updatedUser]] = await User.update(
      { isSubscribed: true, trialCount: 3 },
      {
        where: { id: userId },
        returning: true,
      }
    );

    if (rowsUpdated === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Subscription activated (Free Trial)",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Subscription Error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// adhar code  Dummy Aadhaar data
const dummyData = {
  999999990019: { name: "Mohit Shankarrao Pote", status: "Success" },
  999999990020: { name: "Abhijeet Rahul Kuttarmare", status: "Success" },
};

// Endpoint to verify Aadhaar
router.post("/verify-aadhaar", (req, res) => {
  const { aadhaar } = req.body;
  const result = dummyData[aadhaar] || { name: "", status: "Failure" };
  res.json(result);
});

// Submit KYC with Aadhaar front/back images and consent
router.post(
  "/submit-kyc",
  authMiddleware,
  upload.fields([
    { name: "kycFront", maxCount: 1 },
    { name: "kycBack", maxCount: 1 },
  ]),
  async (req, res) => {
    const userId = req.user.id;
    const { aadhaarNumber, panCardNumber, consentText } = req.body;

    // Basic validation
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Aadhaar" });
    }

    try {
      const user = await User.findByPk(userId);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      // Upload files to Cloudinary if present
      let frontUrl = null;
      let backUrl = null;

      if (req.files && req.files.kycFront && req.files.kycFront[0]) {
        const localPath = req.files.kycFront[0].path;
        const uploadRes = await cloudinary.uploader.upload(localPath, {
          folder: "maid-service/kyc",
        });
        frontUrl = uploadRes.secure_url;
      }

      if (req.files && req.files.kycBack && req.files.kycBack[0]) {
        const localPath = req.files.kycBack[0].path;
        const uploadRes = await cloudinary.uploader.upload(localPath, {
          folder: "maid-service/kyc",
        });
        backUrl = uploadRes.secure_url;
      }

      // Update user kyc fields
      user.aaadharNumber = aadhaarNumber;
      user.panCardNumber = panCardNumber || user.panCardNumber;
      user.kycFrontUrl = frontUrl || user.kycFrontUrl;
      user.kycBackUrl = backUrl || user.kycBackUrl;
      user.kycConsent = consentText || user.kycConsent;
      user.kycStatus = "pending";
      user.kycSubmittedAt = new Date();

      await user.save();

      // Emit socket notification could be added here

      res.json({ success: true, status: user.kycStatus, user });
    } catch (err) {
      console.error("Submit KYC Error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

//////////////////////////////////////
// ✅ MapMyIndia Autosuggest API
//////////////////////////////////////
// ✅ MapMyIndia / LocationIQ Autosuggest API
router.get("/maps/suggest", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: "Query is required" });

    // Using fetch instead of axios
    const url = `https://us1.locationiq.com/v1/autocomplete.php?key=pk.263dd6c4a3d225906a300d90564caf1c&q=${encodeURIComponent(
      query + ", India"
    )}&format=json&limit=5`;

    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.text().catch(() => "<no body>");
      console.error("LocationIQ non-OK response:", response.status, body);
      return res.status(502).json({
        error: "Location provider returned an error",
        status: response.status,
      });
    }

    const data = await response.json();

    const suggestedLocations = (Array.isArray(data) ? data : []).map(
      (item) => ({
        placeName: item.display_name,
        placeAddress: item.display_name,
        lat: item.lat,
        lng: item.lon,
      })
    );

    return res.json({ suggestedLocations });
  } catch (err) {
    console.error("LocationIQ API Error:", err && err.stack ? err.stack : err);
    return res
      .status(500)
      .json({ error: "Failed to fetch location suggestions" });
  }
});

export default router;
