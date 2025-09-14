import express from "express";
import fs from "fs";
import cloudinary from "../config/cloudinary.js";
import { upload } from "../middleware/multer.js";
import { authMiddleware } from "../middleware/auth.js";
import db from "../models/index.js";

const router = express.Router();
const User = db.User;

router.put(
  "/update",
  authMiddleware,
  upload.single("profilePhoto"), // save to local first
  async (req, res) => {
    const transaction = await db.sequelize.transaction();
    let localFilePath;

    try {
      const userId = req.user.id;
      const { mobile, address, gender, age } = req.body;

      // save local path for cleanup
      localFilePath = req.file?.path;

      // ✅ Example eligibility check
      if (!mobile || !address) {
        if (localFilePath && fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath); // delete local file if not eligible
        }
        return res
          .status(400)
          .json({ success: false, message: "Mobile and Address required" });
      }

      // ✅ Save user to DB first
      const [rowsUpdated, [updatedUser]] = await User.update(
        { mobile, address, gender, age },
        {
          where: { id: userId },
          returning: true,
          transaction,
        }
      );

      if (rowsUpdated === 0) {
        if (localFilePath && fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath); // delete unused file
        }
        await transaction.rollback();
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // ✅ Upload to Cloudinary after DB success
      let cloudinaryUrl = null;
      if (localFilePath) {
        const uploadRes = await cloudinary.uploader.upload(localFilePath, {
          folder: "maid-service",
        });
        cloudinaryUrl = uploadRes.secure_url;

        // update user with Cloudinary URL
        updatedUser.profilePhoto = cloudinaryUrl;
        await updatedUser.save({ transaction });

        // remove local file
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

      // rollback if something fails
      await transaction.rollback();

      if (localFilePath && fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath); // cleanup
      }

      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

export default router;
