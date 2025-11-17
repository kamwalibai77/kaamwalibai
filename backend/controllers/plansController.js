// api/controllers/plansController.js
// Simple controller to return plans. Currently returns static plans but can be
// extended to persist plans in DB.
import db from "../models/index.js";

export const getPlans = async (req, res) => {
  try {
    const Plan = db.Plan;
    const all = await Plan.findAll({ order: [["price", "ASC"]] });
    res.json(all);
  } catch (err) {
    console.error("getPlans error:", err && err.stack ? err.stack : err);
    res.status(500).json({ error: "Failed to load plans" });
  }
};

export const createPlan = async (req, res) => {
  try {
    const {
      name,
      price,
      currency = "INR",
      contacts,
      duration,
      type,
    } = req.body;
    const Plan = db.Plan;
    const p = await Plan.create({
      name,
      price,
      currency,
      contacts,
      duration,
      type,
    });
    res.json({ success: true, plan: p });
  } catch (err) {
    console.error("createPlan error:", err && err.stack ? err.stack : err);
    res.status(500).json({ error: "Failed to create plan" });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, currency, contacts, duration, type } = req.body;
    const Plan = db.Plan;
    const p = await Plan.findByPk(id);
    if (!p) return res.status(404).json({ error: "Plan not found" });
    await p.update({ name, price, currency, contacts, duration, type });
    res.json({ success: true, plan: p });
  } catch (err) {
    console.error("updatePlan error:", err && err.stack ? err.stack : err);
    res.status(500).json({ error: "Failed to update plan" });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const Plan = db.Plan;
    const p = await Plan.findByPk(id);
    if (!p) return res.status(404).json({ error: "Plan not found" });
    await p.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error("deletePlan error:", err && err.stack ? err.stack : err);
    res.status(500).json({ error: "Failed to delete plan" });
  }
};
