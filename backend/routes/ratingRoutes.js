import express from "express";
import * as controller from "../controllers/ratingController.js";
import * as userActionController from "../controllers/userActionController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/rate", authMiddleware, controller.createRating);
router.get("/avg/:id", controller.getAverage);
router.post("/block", authMiddleware, userActionController.blockUser);
router.post("/report", authMiddleware, userActionController.reportUser);

export default router;
