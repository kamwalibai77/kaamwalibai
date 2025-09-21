import express from "express";
import fs from "fs";
import cloudinary from "../config/cloudinary.js";
import { upload } from "../middleware/multer.js";
import { authMiddleware } from "../middleware/auth.js";
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
      const { name, phoneNumber, address, gender, age } = req.body;

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
        { name, phoneNumber, address, gender, age },
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
        const uploadRes = await cloudinary.uploader.upload(localFilePath, {
          folder: "maid-service",
        });
        cloudinaryUrl = uploadRes.secure_url;

        updatedUser.profilePhoto = cloudinaryUrl;
        await updatedUser.save({ transaction });

        fs.unlinkSync(localFilePath);
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

    // update isSubscribed + trial count (3 connections)
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

export default router;
