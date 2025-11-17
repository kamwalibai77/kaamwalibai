import express from "express";
import fs from "fs";
import cloudinary, { uploadFile } from "../config/cloudinary.js";
import { authMiddleware } from "../middleware/auth.js";
import { upload } from "../middleware/multer.js";
import db from "../models/index.js";
import { ioServer } from "../sockets/socket.js";

const router = express.Router();
const User = db.User;

// Lightweight tools for production debugging without file uploads.
// - GET /tools/ping: quick health info (Cloudinary configured, AUTO_VERIFY flag)
// - PUT /tools/test-profile-update: JSON-only profile save to verify DB/auth
router.get("/tools/ping", (req, res) => {
  try {
    res.json({
      ok: true,
      cloudinaryConfigured: !!(
        process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
      ),
      autoVerifyKyc:
        String(process.env.AUTO_VERIFY_KYC || "").toLowerCase() === "true",
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("/tools/ping error:", e);
    res.status(500).json({ ok: false, error: "server error" });
  }
});

// JSON-only profile update (no multipart) for testing production DB/auth
router.put("/tools/test-profile-update", authMiddleware, async (req, res) => {
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

    console.log("[Test Profile Update] incoming:", {
      userId,
      body: req.body,
      timestamp: new Date().toISOString(),
    });

    if (!phoneNumber || !address) {
      return res
        .status(400)
        .json({ success: false, message: "Number and Address required" });
    }

    const existingUser = await User.findByPk(userId);
    if (!existingUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    let roleToSave = role;
    if (existingUser && existingUser.role) roleToSave = existingUser.role;

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
      { where: { id: userId }, returning: true }
    );

    if (rowsUpdated === 0)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({
      success: true,
      message: "Test profile saved",
      user: updatedUser,
    });
  } catch (err) {
    console.error(
      "Test profile update error:",
      err && err.stack ? err.stack : err
    );
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Update profile with photo
 */
router.put(
  "/update",
  authMiddleware,
  upload.single("profilePhoto"), // save to local first
  async (req, res) => {
    // Temporary debug: log incoming headers so failing requests can be diagnosed
    try {
      console.log("[Profile Update] headers:", req.headers);
      console.log("[Profile Update] req.file:", req.file);
    } catch (e) {
      console.warn("Failed logging headers/file for profile update:", e);
    }
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
        body: {
          name,
          phoneNumber,
          address,
          gender,
          age,
          latitude,
          longitude,
          role,
        },
        file: req.file
          ? {
              originalname: req.file.originalname,
              mimetype: req.file.mimetype,
              size: req.file.size,
              path: req.file.path,
            }
          : null,
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
        // Attempt upload but do NOT fail the whole update if Cloudinary is
        // not configured or upload fails — production may choose to disable
        // Cloudinary and we still want profile field updates to succeed.
        try {
          if (
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
          ) {
            console.warn(
              "Cloudinary not configured; skipping profile photo upload"
            );
          } else {
            const uploadRes = await cloudinary.uploader.upload(localFilePath, {
              folder: "maid-service",
            });
            cloudinaryUrl = uploadRes.secure_url;
            if (cloudinaryUrl) {
              updatedUser.profilePhoto = cloudinaryUrl;
              await updatedUser.save({ transaction });
            }
          }
        } catch (uploadErr) {
          console.error(
            "Profile photo upload failed, but continuing update:",
            uploadErr && uploadErr.stack ? uploadErr.stack : uploadErr
          );
        } finally {
          // always try to remove the local temp file
          try {
            if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
          } catch (e) {
            console.warn(
              "Failed to delete profile temp file:",
              localFilePath,
              e
            );
          }
        }
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

/**
 * Upload profile photo via base64 JSON payload
 * POST /upload-photo-base64
 * Body: { profilePhotoBase64: 'data:image/jpeg;base64,...' }
 */
router.post(
  "/upload-photo-base64",
  authMiddleware,
  express.json({ limit: "15mb" }),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { profilePhotoBase64, image } = req.body || {};
      const dataUri = profilePhotoBase64 || image;

      if (!dataUri || typeof dataUri !== "string") {
        return res
          .status(400)
          .json({ success: false, message: "No image provided" });
      }

      // If Cloudinary is not configured, return helpful message
      if (
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
      ) {
        console.warn("Cloudinary not configured; cannot upload base64 image");
        return res
          .status(503)
          .json({
            success: false,
            message: "Cloudinary not configured on server",
          });
      }

      // Upload the data URI directly to Cloudinary
      let uploadRes;
      try {
        uploadRes = await cloudinary.uploader.upload(dataUri, {
          folder: "maid-service",
        });
      } catch (uploadErr) {
        console.error("Base64 upload to Cloudinary failed:", uploadErr);
        return res
          .status(502)
          .json({ success: false, message: "Cloudinary upload failed" });
      }

      const secureUrl = uploadRes?.secure_url || null;
      if (!secureUrl) {
        return res
          .status(500)
          .json({ success: false, message: "Upload did not return a URL" });
      }

      // Persist to DB
      const [rowsUpdated, [updatedUser]] = await User.update(
        { profilePhoto: secureUrl },
        { where: { id: userId }, returning: true }
      );

      if (rowsUpdated === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      return res.json({ success: true, user: updatedUser });
    } catch (err) {
      console.error(
        "/upload-photo-base64 error:",
        err && err.stack ? err.stack : err
      );
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Lightweight Cloudinary connectivity test for production troubleshooting
router.get("/tools/test-cloudinary", async (req, res) => {
  try {
    // If Cloudinary not configured, return helpful message
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.json({
        ok: false,
        message: "Cloudinary not configured in env",
      });
    }

    // Try a harmless API call: list a small number of uploaded resources
    try {
      const list = await cloudinary.api.resources({ max_results: 1 });
      return res.json({
        ok: true,
        connected: true,
        sample: list.resources?.length || 0,
      });
    } catch (apiErr) {
      console.error(
        "Cloudinary API test failed:",
        apiErr && apiErr.stack ? apiErr.stack : apiErr
      );
      return res
        .status(502)
        .json({
          ok: false,
          connected: false,
          error: apiErr.message || String(apiErr),
        });
    }
  } catch (err) {
    console.error(
      "/tools/test-cloudinary error:",
      err && err.stack ? err.stack : err
    );
    res.status(500).json({ ok: false, error: "server error" });
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

    // Debug log incoming KYC submission for troubleshooting
    console.log(
      "[KYC Submit] userId:",
      userId,
      "body:",
      req.body,
      "files:",
      req.files
    );

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

      // === Step 1: persist KYC details to DB (mark pending or verified depending on config)
      user.aaadharNumber = aadhaarNumber;
      user.panCardNumber = panCardNumber || user.panCardNumber;
      user.kycConsent = consentText || user.kycConsent;

      const autoVerify =
        String(process.env.AUTO_VERIFY_KYC || "").toLowerCase() === "true";
      const now = new Date();
      if (autoVerify) {
        user.kycStatus = "verified";
        user.kycSubmittedAt = now;
        user.kycVerifiedAt = now;
        console.log(
          `[KYC] Auto-verified user ${userId} at ${now.toISOString()}`
        );
      } else {
        user.kycStatus = "pending";
        user.kycSubmittedAt = now;
        // preserve existing verifiedAt if already verified
        user.kycVerifiedAt = user.kycVerifiedAt || null;
        console.log(
          `[KYC] Submission received for user ${userId}, marked pending review at ${now.toISOString()}`
        );
      }

      await user.save();

      // === Step 2: Upload files to Cloudinary (after DB record updated)
      // We'll attempt uploads and update the DB with resulting URLs. Local
      // temporary files will be deleted whether upload succeeds or fails.
      const uploaded = { front: null, back: null };
      const localPathsToCleanup = [];

      try {
        if (req.files && req.files.kycFront && req.files.kycFront[0]) {
          const localPath = req.files.kycFront[0].path;
          localPathsToCleanup.push(localPath);
          if (
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
          ) {
            throw new Error("Cloudinary not configured on server");
          }
          const uploadRes = await uploadFile(localPath, {
            folder: "maid-service/kyc",
          });
          uploaded.front = uploadRes.secure_url;
        }

        if (req.files && req.files.kycBack && req.files.kycBack[0]) {
          const localPath = req.files.kycBack[0].path;
          localPathsToCleanup.push(localPath);
          const uploadRes = await uploadFile(localPath, {
            folder: "maid-service/kyc",
          });
          uploaded.back = uploadRes.secure_url;
        }

        // If uploads produced URLs, persist them to user record
        if (uploaded.front) user.kycFrontUrl = uploaded.front;
        if (uploaded.back) user.kycBackUrl = uploaded.back;
        await user.save();

        // Emit socket notification if user became verified (useful for client realtime)
        try {
          if (user.kycStatus === "verified" && ioServer) {
            ioServer.to(String(userId)).emit("kycVerified", {
              userId,
              status: "verified",
              user,
            });
          }
        } catch (emitErr) {
          console.warn("Failed to emit kycVerified socket event:", emitErr);
        }
      } catch (uploadErr) {
        // log the upload error, persist partial results if any, and continue
        console.error(
          "KYC upload error:",
          uploadErr && uploadErr.stack ? uploadErr.stack : uploadErr
        );
        // ensure any partial URLs are saved
        if (uploaded.front) user.kycFrontUrl = uploaded.front;
        if (uploaded.back) user.kycBackUrl = uploaded.back;
        await user
          .save()
          .catch((e) => console.error("Failed saving partial KYC urls:", e));
      } finally {
        // Delete local temp files regardless of upload success/failure
        for (const p of localPathsToCleanup) {
          try {
            if (p && fs.existsSync(p)) fs.unlinkSync(p);
          } catch (e) {
            console.warn("Failed to delete temp file:", p, e);
          }
        }
      }

      // Respond with current user status (may be pending if uploads failed)
      res.json({ success: true, status: user.kycStatus, user });
    } catch (err) {
      console.error("Submit KYC Error:", err && err.stack ? err.stack : err);

      // Attempt to cleanup any uploaded local files in case of early failure
      try {
        if (req.files) {
          const allFiles = [].concat(
            req.files.kycFront || [],
            req.files.kycBack || []
          );
          for (const f of allFiles) {
            const p = f.path;
            if (p && fs.existsSync(p)) {
              try {
                fs.unlinkSync(p);
              } catch (e) {
                console.warn("Failed to delete temp file in catch:", p, e);
              }
            }
          }
        }
      } catch (cleanupErr) {
        console.warn("Error during KYC cleanup:", cleanupErr);
      }

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

/**
 * Retry KYC upload endpoint
 * Accepts multipart files (kycFront, kycBack) and uploads them to Cloudinary,
 * updating the User record with resulting URLs. Useful when initial DB save
 * succeeded but file upload failed and client wants to retry.
 */
router.post(
  "/retry-kyc-upload",
  authMiddleware,
  upload.fields([
    { name: "kycFront", maxCount: 1 },
    { name: "kycBack", maxCount: 1 },
  ]),
  async (req, res) => {
    const userId = req.user.id;

    try {
      const user = await User.findByPk(userId);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      const uploaded = { front: null, back: null };
      const localPathsToCleanup = [];

      try {
        if (req.files && req.files.kycFront && req.files.kycFront[0]) {
          const localPath = req.files.kycFront[0].path;
          localPathsToCleanup.push(localPath);
          if (
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
          ) {
            throw new Error("Cloudinary not configured on server");
          }
          const uploadRes = await uploadFile(localPath, {
            folder: "maid-service/kyc",
          });
          uploaded.front = uploadRes.secure_url;
        }

        if (req.files && req.files.kycBack && req.files.kycBack[0]) {
          const localPath = req.files.kycBack[0].path;
          localPathsToCleanup.push(localPath);
          const uploadRes = await uploadFile(localPath, {
            folder: "maid-service/kyc",
          });
          uploaded.back = uploadRes.secure_url;
        }

        if (uploaded.front) user.kycFrontUrl = uploaded.front;
        if (uploaded.back) user.kycBackUrl = uploaded.back;

        // Optionally auto-verify on retry if configured
        const autoVerify =
          String(process.env.AUTO_VERIFY_KYC || "").toLowerCase() === "true";
        if (autoVerify) {
          user.kycStatus = "verified";
          user.kycVerifiedAt = new Date();
        }

        await user.save();

        // Emit socket notification if verified
        try {
          if (user.kycStatus === "verified" && ioServer) {
            ioServer
              .to(String(userId))
              .emit("kycVerified", { userId, status: "verified", user });
          }
        } catch (emitErr) {
          console.warn("Failed to emit kycVerified on retry:", emitErr);
        }

        res.json({ success: true, user, uploaded });
      } catch (uploadErr) {
        console.error(
          "Retry KYC upload error:",
          uploadErr && uploadErr.stack ? uploadErr.stack : uploadErr
        );
        return res
          .status(500)
          .json({ success: false, message: "Upload failed" });
      } finally {
        // cleanup local files
        for (const p of localPathsToCleanup) {
          try {
            if (p && fs.existsSync(p)) fs.unlinkSync(p);
          } catch (e) {
            console.warn("Failed to delete temp file after retry:", p, e);
          }
        }
      }
    } catch (err) {
      console.error(
        "Retry KYC overall error:",
        err && err.stack ? err.stack : err
      );
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

/**
 * Admin endpoint to mark a user's KYC as verified.
 * PUT /admin/verify-kyc/:id
 */
router.put("/admin/verify-kyc/:id", authMiddleware, async (req, res) => {
  try {
    const callerRole = req.user?.role || "";
    const allowed = ["admin", "superadmin"];
    if (!allowed.includes(String(callerRole).toLowerCase())) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const targetId = req.params.id;
    const user = await User.findByPk(targetId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    user.kycStatus = "verified";
    user.kycVerifiedAt = new Date();
    await user.save();

    // Emit socket notification to the user
    try {
      if (ioServer) {
        ioServer.to(String(targetId)).emit("kycVerified", {
          userId: targetId,
          status: "verified",
          user,
        });
      }
    } catch (emitErr) {
      console.warn("Failed to emit kycVerified from admin endpoint:", emitErr);
    }

    return res.json({ success: true, message: "User KYC verified", user });
  } catch (err) {
    console.error(
      "Admin verify KYC error:",
      err && err.stack ? err.stack : err
    );
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
