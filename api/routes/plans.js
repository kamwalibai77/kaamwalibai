import express from "express";
import {
  createPlan,
  deletePlan,
  getPlans,
  updatePlan,
} from "../controllers/plansController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Public: GET /api/plans
router.get("/", getPlans);

// Admin: create/update/delete plans (protected)
router.post("/", authMiddleware, createPlan);
router.put("/:id", authMiddleware, updatePlan);
router.delete("/:id", authMiddleware, deletePlan);

export default router;
