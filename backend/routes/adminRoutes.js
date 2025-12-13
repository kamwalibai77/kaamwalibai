import express from "express";
import {
  addTeamMember,
  approveKYC,
  assignComplaint,
  blockAbusiveUser,
  deleteTeamMember,
  // Profile
  getAdminProfile,
  // Complaints
  getAllComplaints,
  getAllProviders,
  // Ratings & Reviews
  getAllRatings,
  // Full Data Access
  getAllUsers,
  // Audit Logs
  getAuditLogs,
  // Dashboard
  getDashboardMetrics,
  // KYC Management
  getKYCList,
  // Team Management
  getTeamMembers,
  rejectKYC,
  updateAdminProfile,
  updateComplaintStatus,
  updateRatingStatus,
  updateTeamMember,
} from "../controllers/adminController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

// All admin routes require authentication
router.use(authenticate);

// ==================== 1. DASHBOARD ====================
router.get(
  "/dashboard/metrics",
  requireRole(["superadmin"]),
  getDashboardMetrics
);

// ==================== 2. RATINGS & REVIEWS ====================
router.get("/ratings", requireRole(["superadmin"]), getAllRatings);
router.patch(
  "/ratings/:ratingId/status",
  requireRole(["superadmin"]),
  updateRatingStatus
);
router.post(
  "/users/:userId/block",
  requireRole(["superadmin"]),
  blockAbusiveUser
);

// ==================== 3. COMPLAINTS ====================
router.get(
  "/complaints",
  requireRole(["superadmin", "customerSuccess", "supportMaintenance"]),
  getAllComplaints
);
router.patch(
  "/complaints/:complaintId/assign",
  requireRole(["superadmin"]),
  assignComplaint
);
router.patch(
  "/complaints/:complaintId/status",
  requireRole(["superadmin", "supportMaintenance"]),
  updateComplaintStatus
);

// ==================== 4. TEAM MANAGEMENT ====================
router.get("/team", requireRole(["superadmin"]), getTeamMembers);
router.post("/team", requireRole(["superadmin"]), addTeamMember);
router.patch("/team/:memberId", requireRole(["superadmin"]), updateTeamMember);
router.delete("/team/:memberId", requireRole(["superadmin"]), deleteTeamMember);

// ==================== 5. KYC MANAGEMENT ====================
router.get("/kyc", requireRole(["superadmin", "customerSuccess"]), getKYCList);
router.patch(
  "/kyc/:userId/approve",
  requireRole(["superadmin", "customerSuccess"]),
  approveKYC
);
router.patch(
  "/kyc/:userId/reject",
  requireRole(["superadmin", "customerSuccess"]),
  rejectKYC
);

// ==================== 6. FULL DATA ACCESS ====================
router.get("/users", requireRole(["superadmin"]), getAllUsers);
router.get("/providers", requireRole(["superadmin"]), getAllProviders);

// ==================== 7. AUDIT LOGS ====================
router.get("/audit-logs", requireRole(["superadmin"]), getAuditLogs);

// ==================== 8. PROFILE ====================
// Profile should be accessible to any authenticated admin user
router.get("/profile", getAdminProfile);
router.put("/profile", updateAdminProfile);

export default router;
