import express from "express";
import db from "../models/index.js";

const router = express.Router();

// Get blocked records between two users
router.get("/block-status/:a/:b", async (req, res) => {
  try {
    const a = parseInt(req.params.a, 10);
    const b = parseInt(req.params.b, 10);
    const Op = db.Sequelize.Op;
    const rows = await db.BlockedUser.findAll({
      where: {
        [Op.or]: [
          { userId: a, targetId: b },
          { userId: b, targetId: a },
        ],
      },
    });
    res.json({ success: true, count: rows.length, rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get message count between two users
router.get("/messages-count/:a/:b", async (req, res) => {
  try {
    const a = parseInt(req.params.a, 10);
    const b = parseInt(req.params.b, 10);
    const Op = db.Sequelize.Op;
    const cnt = await db.Message.count({
      where: {
        [Op.or]: [
          { senderId: a, receiverId: b },
          { senderId: b, receiverId: a },
        ],
      },
    });
    res.json({ success: true, count: cnt });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get blocked list for a user
router.get("/blocked-list/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const rows = await db.BlockedUser.findAll({ where: { userId: id } });
    res.json({ success: true, rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
