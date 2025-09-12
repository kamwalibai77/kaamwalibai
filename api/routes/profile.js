import express from "express";
import cloudinary, { cloudinaryOptions } from "../config/cloudinary.js";
import { authMiddleware } from "../middleware/auth.js"; // JWT middleware
import upload from "../middleware/multer.js";
import db from "../models/index.js"; // your user model

const router = express.Router();

// ✅ Update profile
router.put(
  "/update",
  authMiddleware,
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "aadharPhoto", maxCount: 1 },
    { name: "panPhoto", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userId = req.user.id;

      // form data
      const { mobile, address, gender, age, isSubscribed } = req.body;

      let profilePhotoUrl = null;
      let aadharPhotoUrl = null;
      let panPhotoUrl = null;

      // ✅ Upload to Cloudinary if new file exists
      if (req.files.profilePhoto) {
        const result = await cloudinary.uploader.upload(
          req.files.profilePhoto[0].path,
          { ...cloudinaryOptions, folder: "maid-service/profiles" }
        );
        profilePhotoUrl = result.secure_url;
      }

      if (req.files.aadharPhoto) {
        const result = await cloudinary.uploader.upload(
          req.files.aadharPhoto[0].path,
          { ...cloudinaryOptions, folder: "maid-service/aadhar" }
        );
        aadharPhotoUrl = result.secure_url;
      }

      if (req.files.panPhoto) {
        const result = await cloudinary.uploader.upload(
          req.files.panPhoto[0].path,
          { ...cloudinaryOptions, folder: "maid-service/pan" }
        );
        panPhotoUrl = result.secure_url;
      }

      // ✅ Update DB
      const updatedUser = await db.User.findByIdAndUpdate(
        userId,
        {
          mobile,
          address,
          gender,
          age,
          isSubscribed: isSubscribed === "true", // flag
          ...(profilePhotoUrl && { profilePhoto: profilePhotoUrl }),
          ...(aadharPhotoUrl && { aadharPhoto: aadharPhotoUrl }),
          ...(panPhotoUrl && { panPhoto: panPhotoUrl }),
        },
        { new: true }
      );

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

export default router;
