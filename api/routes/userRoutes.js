import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import db from "../models/index.js";

const User = db.User;
const router = express.Router();

// ✅ Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ✅ Get user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ✅ Update user by ID
router.put("/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    await user.update(req.body);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

// ✅ Get logged-in user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// routes/users.js
// routes/users.js
router.put("/subscribe", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Make sure this column exists
    user.isSubscribed = true;

    await user.save({ fields: ["isSubscribed"] });

    res.json({ success: true, message: "Subscribed!", user });
  } catch (err) {
    console.error("Subscribe route full error:", err);
    res
      .status(500)
      .json({ error: "Failed to update user", details: err.message });
  }
});

// POST /api/users/me/subscriptions
// body: { planId, paymentId, amount, currency, duration }
router.post("/me/subscriptions", authMiddleware, async (req, res) => {
  try {
    const {
      planId,
      paymentId,
      amount = 0,
      currency = "INR",
      duration,
    } = req.body || {};
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const Subscription = db.Subscription;
    if (!paymentId)
      return res.status(400).json({ error: "paymentId required" });

    // Derive numberOfContacts from Plan if available (robust lookup)
    let numberOfContacts = null;
    try {
      const Plan = db.Plan;
      let planRecord = null;
      if (planId) {
        const maybeNum = Number(planId);
        if (!Number.isNaN(maybeNum)) planRecord = await Plan.findByPk(maybeNum);
        if (!planRecord)
          planRecord = await Plan.findOne({ where: { id: planId } });
        if (!planRecord)
          planRecord = await Plan.findOne({ where: { name: planId } });
        if (!planRecord)
          planRecord = await Plan.findOne({ where: { duration: planId } });
      }
      if (planRecord && typeof planRecord.contacts !== "undefined") {
        numberOfContacts = planRecord.contacts;
      }
    } catch (e) {
      console.warn("Failed to lookup Plan for numberOfContacts:", e);
    }

    const values = {
      user_id: String(user.id),
      plan_id: String(planId || duration || "manual"),
      payment_id: String(paymentId),
      amount: Number(amount) || 0,
      currency: String(currency || "INR"),
      numberOfContacts: numberOfContacts,
      start_date: new Date(),
      status: "active",
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    console.log("[userRoutes] creating subscription values:", {
      userId: user.id,
      planId,
      numberOfContacts,
    });

    const [record, created] = await Subscription.findOrCreate({
      where: { payment_id: String(paymentId) },
      defaults: values,
    });
    if (!created) await record.update(values);

    console.log("[userRoutes] subscription saved:", {
      id: record.id,
      payment_id: record.payment_id,
      plan_id: record.plan_id,
      numberOfContacts: record.numberOfContacts,
      created,
    });

    user.isSubscribed = true;
    await user.save({ fields: ["isSubscribed"] });

    res.json({ success: true, subscription: record });
  } catch (err) {
    console.error(
      "/me/subscriptions error:",
      err && err.stack ? err.stack : err
    );
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

export default router;
