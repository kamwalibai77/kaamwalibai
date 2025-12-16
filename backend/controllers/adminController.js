import { Op } from "sequelize";
import db from "../models/index.js";

const {
  User,
  Rating,
  Report,
  BlockedUser,
  ServiceType,
  UserService,
  ContactLog,
  Plan,
  AuditLog,
} = db;

// ==================== 1. DASHBOARD METRICS ====================
export const getDashboardMetrics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Total counts
    const totalProviders = await User.count({
      where: { role: "ServiceProvider" },
    });

    const totalCustomers = await User.count({
      where: { role: "user" },
    });

    // KYC stats
    const verifiedProviders = await User.count({
      where: { role: "ServiceProvider", kycStatus: "verified" },
    });

    const kycPending = await User.count({
      where: { role: "ServiceProvider", kycStatus: "pending" },
    });

    const kycRejected = await User.count({
      where: { role: "ServiceProvider", kycStatus: "rejected" },
    });

    // New registrations
    const dailyRegistrations = await User.count({
      where: {
        role: "ServiceProvider",
        createdAt: { [Op.gte]: today },
      },
    });

    const weeklyRegistrations = await User.count({
      where: {
        role: "ServiceProvider",
        createdAt: { [Op.gte]: weekAgo },
      },
    });

    const monthlyRegistrations = await User.count({
      where: {
        role: "ServiceProvider",
        createdAt: { [Op.gte]: monthAgo },
      },
    });

    // Active vs Inactive (has services vs no services)
    const providersWithServices = await UserService.count({
      distinct: true,
      col: "providerId",
    });

    const activeProviders = providersWithServices;
    const inactiveProviders = totalProviders - activeProviders;

    // Recent provider signups
    const recentSignups = await User.findAll({
      where: { role: "ServiceProvider" },
      order: [["createdAt", "DESC"]],
      limit: 10,
      attributes: [
        "id",
        "name",
        "phoneNumber",
        "kycStatus",
        "createdAt",
        "profilePhoto",
      ],
    });

    res.json({
      ok: true,
      metrics: {
        totalProviders,
        totalCustomers,
        verifiedProviders,
        kycPending,
        kycRejected,
        dailyRegistrations,
        weeklyRegistrations,
        monthlyRegistrations,
        activeProviders,
        inactiveProviders,
      },
      recentSignups,
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard metrics" });
  }
};

// ==================== 2. RATINGS & REVIEWS MANAGEMENT ====================
export const getAllRatings = async (req, res) => {
  try {
    const { filter, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    // Filter options
    if (filter === "reported") {
      // Get IDs of ratings that have been reported
      const reportedRatings = await Report.findAll({
        attributes: ["targetId"],
        where: { targetType: "rating" },
      });
      const reportedIds = reportedRatings.map((r) => r.targetId);
      whereClause.id = { [Op.in]: reportedIds };
    }

    const ratings = await Rating.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "rater",
          attributes: ["id", "name", "phoneNumber", "profilePhoto"],
        },
        {
          model: User,
          as: "ratee",
          attributes: ["id", "name", "phoneNumber", "profilePhoto", "role"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      ok: true,
      ratings: ratings.rows,
      total: ratings.count,
      page: parseInt(page),
      totalPages: Math.ceil(ratings.count / limit),
    });
  } catch (error) {
    console.error("Get ratings error:", error);
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
};

export const updateRatingStatus = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { action } = req.body; // 'hide', 'approve', 'delete'

    const rating = await Rating.findByPk(ratingId);
    if (!rating) {
      return res.status(404).json({ error: "Rating not found" });
    }

    if (action === "delete") {
      await rating.destroy();
    } else if (action === "hide") {
      await rating.update({ isHidden: true });
    } else if (action === "approve") {
      await rating.update({ isHidden: false });
    }

    // Log audit
    await createAuditLog(
      req.user.id,
      "rating_management",
      `${action} rating ${ratingId}`,
      { ratingId, action }
    );

    res.json({ ok: true, message: `Rating ${action}d successfully` });
  } catch (error) {
    console.error("Update rating error:", error);
    res.status(500).json({ error: "Failed to update rating" });
  }
};

export const blockAbusiveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Create blocked user entry
    await BlockedUser.create({
      userId,
      blockedBy: req.user.id,
      reason,
    });

    // Log audit
    await createAuditLog(
      req.user.id,
      "user_management",
      `Blocked user ${userId}`,
      { userId, reason }
    );

    res.json({ ok: true, message: "User blocked successfully" });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ error: "Failed to block user" });
  }
};

// ==================== 3. COMPLAINTS & SUPPORT MODULE ====================
export const getAllComplaints = async (req, res) => {
  try {
    const { status, assignedTo, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (assignedTo) whereClause.assignedTo = assignedTo;

    const complaints = await Report.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "reporter",
          attributes: ["id", "name", "phoneNumber", "profilePhoto"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["id", "name", "phoneNumber"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Get status counts
    const statusCounts = {
      total: await Report.count(),
      open: await Report.count({ where: { status: "open" } }),
      inProgress: await Report.count({ where: { status: "in-progress" } }),
      closed: await Report.count({ where: { status: "closed" } }),
    };

    res.json({
      ok: true,
      complaints: complaints.rows,
      total: complaints.count,
      statusCounts,
      page: parseInt(page),
      totalPages: Math.ceil(complaints.count / limit),
    });
  } catch (error) {
    console.error("Get complaints error:", error);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
};

export const assignComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { assignedTo } = req.body;

    const complaint = await Report.findByPk(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    await complaint.update({
      assignedTo,
      status: "in-progress",
    });

    // Log audit
    await createAuditLog(
      req.user.id,
      "complaint_management",
      `Assigned complaint ${complaintId} to user ${assignedTo}`,
      { complaintId, assignedTo }
    );

    res.json({ ok: true, message: "Complaint assigned successfully" });
  } catch (error) {
    console.error("Assign complaint error:", error);
    res.status(500).json({ error: "Failed to assign complaint" });
  }
};

export const updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, resolution } = req.body;

    const complaint = await Report.findByPk(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    await complaint.update({
      status,
      resolution,
      resolvedAt: status === "closed" ? new Date() : null,
    });

    // Log audit
    await createAuditLog(
      req.user.id,
      "complaint_management",
      `Updated complaint ${complaintId} status to ${status}`,
      { complaintId, status, resolution }
    );

    res.json({ ok: true, message: "Complaint status updated" });
  } catch (error) {
    console.error("Update complaint error:", error);
    res.status(500).json({ error: "Failed to update complaint" });
  }
};

// ==================== 4. TEAM MANAGEMENT ====================
export const getTeamMembers = async (req, res) => {
  try {
    const teamMembers = await User.findAll({
      where: {
        role: {
          [Op.in]: ["superadmin", "customerSuccess", "supportMaintenance"],
        },
      },
      attributes: [
        "id",
        "name",
        "phoneNumber",
        "role",
        "createdAt",
        "profilePhoto",
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ ok: true, teamMembers });
  } catch (error) {
    console.error("Get team members error:", error);
    res.status(500).json({ error: "Failed to fetch team members" });
  }
};

export const addTeamMember = async (req, res) => {
  try {
    const { name, phoneNumber, role } = req.body;

    if (!["customerSuccess", "supportMaintenance"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check if user exists
    const existing = await User.findOne({ where: { phoneNumber } });
    if (existing) {
      return res
        .status(400)
        .json({ error: "User with this phone number already exists" });
    }

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash("admin@123", 10);

    const teamMember = await User.create({
      name,
      phoneNumber,
      role,
      password: hashedPassword,
      kycStatus: "verified",
      gender: "other",
    });

    // Log audit
    await createAuditLog(
      req.user.id,
      "team_management",
      `Added team member ${name}`,
      { teamMemberId: teamMember.id, role }
    );

    res.json({ ok: true, teamMember });
  } catch (error) {
    console.error("Add team member error:", error);
    res.status(500).json({ error: "Failed to add team member" });
  }
};

export const updateTeamMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { name, role, isActive } = req.body;

    const member = await User.findByPk(memberId);
    if (!member) {
      return res.status(404).json({ error: "Team member not found" });
    }

    await member.update({ name, role, isActive });

    // Log audit
    await createAuditLog(
      req.user.id,
      "team_management",
      `Updated team member ${memberId}`,
      { memberId, updates: { name, role, isActive } }
    );

    res.json({ ok: true, message: "Team member updated successfully" });
  } catch (error) {
    console.error("Update team member error:", error);
    res.status(500).json({ error: "Failed to update team member" });
  }
};

export const deleteTeamMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await User.findByPk(memberId);
    if (!member) {
      return res.status(404).json({ error: "Team member not found" });
    }

    // Prevent deleting superadmin
    if (member.role === "superadmin") {
      return res.status(403).json({ error: "Cannot delete superadmin" });
    }

    await member.destroy();

    // Log audit
    await createAuditLog(
      req.user.id,
      "team_management",
      `Deleted team member ${memberId}`,
      { memberId, name: member.name }
    );

    res.json({ ok: true, message: "Team member deleted successfully" });
  } catch (error) {
    console.error("Delete team member error:", error);
    res.status(500).json({ error: "Failed to delete team member" });
  }
};

// ==================== 5. KYC APPROVAL MANAGEMENT ====================
export const getKYCList = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      role: "ServiceProvider",
      kycSubmittedAt: { [Op.ne]: null }, // Only show submitted KYCs
    };
    if (status) whereClause.kycStatus = status;

    const providers = await User.findAndCountAll({
      where: whereClause,
      attributes: [
        "id",
        "name",
        "phoneNumber",
        "profilePhoto",
        "kycStatus",
        "kycFrontUrl",
        "kycBackUrl",
        "kycSubmittedAt",
        "kycVerifiedAt",
        "createdAt",
        "aaadharNumber",
        "panCardNumber",
        "address",
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      ok: true,
      providers: providers.rows,
      total: providers.count,
      page: parseInt(page),
      totalPages: Math.ceil(providers.count / limit),
    });
  } catch (error) {
    console.error("Get KYC list error:", error);
    res.status(500).json({ error: "Failed to fetch KYC list" });
  }
};

export const approveKYC = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await user.update({
      kycStatus: "verified",
      kycVerifiedAt: new Date(),
    });

    // Log audit
    await createAuditLog(
      req.user.id,
      "kyc_management",
      `Approved KYC for user ${userId}`,
      { userId, userName: user.name }
    );

    res.json({ ok: true, message: "KYC approved successfully" });
  } catch (error) {
    console.error("Approve KYC error:", error);
    res.status(500).json({ error: "Failed to approve KYC" });
  }
};

export const rejectKYC = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await user.update({
      kycStatus: "rejected",
      kycRejectionReason: reason,
    });

    // Log audit
    await createAuditLog(
      req.user.id,
      "kyc_management",
      `Rejected KYC for user ${userId}`,
      { userId, userName: user.name, reason }
    );

    res.json({ ok: true, message: "KYC rejected successfully" });
  } catch (error) {
    console.error("Reject KYC error:", error);
    res.status(500).json({ error: "Failed to reject KYC" });
  }
};

// ==================== 6. FULL DATA ACCESS ====================
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const users = await User.findAndCountAll({
      where: { role: "user" },
      attributes: [
        "id",
        "name",
        "phoneNumber",
        "profilePhoto",
        "role",
        "createdAt",
        "address",
        "latitude",
        "longitude",
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      ok: true,
      users: users.rows,
      total: users.count,
      page: parseInt(page),
      totalPages: Math.ceil(users.count / limit),
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const getAllProviders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const providers = await User.findAndCountAll({
      where: { role: "ServiceProvider" },
      attributes: [
        "id",
        "name",
        "phoneNumber",
        "profilePhoto",
        "kycStatus",
        "createdAt",
        "address",
      ],
      include: [
        {
          model: UserService,
          as: "services",
          attributes: ["id", "amount", "rateType"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      ok: true,
      providers: providers.rows,
      total: providers.count,
      page: parseInt(page),
      totalPages: Math.ceil(providers.count / limit),
    });
  } catch (error) {
    console.error("Get providers error:", error);
    res.status(500).json({ error: "Failed to fetch providers" });
  }
};

// ==================== 7. AUDIT LOG ====================
const createAuditLog = async (userId, action, description, metadata) => {
  try {
    await AuditLog.create({
      userId,
      action,
      description,
      metadata,
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (action) whereClause.action = action;
    if (userId) whereClause.userId = userId;

    const logs = await AuditLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "phoneNumber", "role"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      ok: true,
      logs: logs.rows,
      total: logs.count,
      page: parseInt(page),
      totalPages: Math.ceil(logs.count / limit),
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
};
// ==================== 8. ADMIN PROFILE ====================
export const getAdminProfile = async (req, res) => {
  try {
    console.log("Get admin profile - User ID:", req.user?.id);
    console.log("Get admin profile - User object:", req.user);

    const userId = req.user.id; // From auth middleware

    const admin = await User.findByPk(userId, {
      attributes: ["id", "name", "phoneNumber", "role", "createdAt"],
    });

    console.log("Found admin:", admin?.toJSON());

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json(admin);
  } catch (error) {
    console.error("Get admin profile error:", error);
    console.error("Error stack:", error.stack);
    res
      .status(500)
      .json({ error: "Failed to fetch profile", details: error.message });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { name, phoneNumber } = req.body;

    const admin = await User.findByPk(userId);

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Update allowed fields
    if (name !== undefined) admin.name = name;
    if (phoneNumber !== undefined) admin.phoneNumber = phoneNumber;

    await admin.save();

    // Create audit log
    await createAuditLog(userId, "PROFILE_UPDATE", "Updated own profile", {
      name,
      phoneNumber,
    });

    res.json({
      ok: true,
      message: "Profile updated successfully",
      admin: {
        id: admin.id,
        name: admin.name,
        phoneNumber: admin.phoneNumber,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Update admin profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};
