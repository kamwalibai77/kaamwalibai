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
        { name, phoneNumber, address, gender, age, latitude, longitude, role },
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

router.post("/submit-kyc", (req, res) => {
  const { aadhaarNumber, panCardNumber } = req.body;
  const result = dummyData[aadhaar] || { name: "", status: "Failure" };
  res.json(result);
});

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
