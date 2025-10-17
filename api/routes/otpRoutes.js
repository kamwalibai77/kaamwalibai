import express from "express";
import { sendOtp, verifyOtp, completeSignup } from "../controllers/otpController.js";
import { upload } from "../middleware/multer.js";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/complete-signup", upload.single("profilePhoto"), completeSignup);

export default router;
