import express from "express";
import {
  completeSignup,
  completeSignupBase64,
  completeSignupSimple,
  sendOtp,
  verifyOtp,
} from "../controllers/otpController.js";
import { upload } from "../middleware/multer.js";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/complete-signup", upload.single("profilePhoto"), completeSignup);
router.post("/complete-signup-simple", completeSignupSimple);
router.post(
  "/complete-signup-base64",
  express.json({ limit: "15mb" }),
  completeSignupBase64
);

// Simple unauthenticated ping for reachability checks from clients
router.get("/ping", (req, res) => {
  res.json({ ok: true, service: "auth", timestamp: new Date().toISOString() });
});

export default router;
