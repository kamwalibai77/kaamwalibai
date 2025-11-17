import db from "../models/index.js";
import { ioServer } from "../sockets/socket.js";

const BlockedUser = db.BlockedUser;
const Report = db.Report;
const Message = db.Message;
const Sequelize = db.Sequelize;

export const blockUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { targetId } = req.body || {};
    const targetIdNum = targetId ? parseInt(String(targetId), 10) : null;
    if (!userId || !targetIdNum) {
      console.warn("blockUser: missing fields", {
        userId: req.user,
        body: req.body,
      });
      return res
        .status(400)
        .json({ error: "Missing fields: userId or targetId" });
    }
    const record = await BlockedUser.create({ userId, targetId: targetIdNum });
    // notify both users via websocket so clients can update chat list
    try {
      if (ioServer) {
        ioServer
          .to(String(userId))
          .emit("userBlocked", { userId, targetId: targetIdNum });
        ioServer
          .to(String(targetIdNum))
          .emit("userBlocked", { userId, targetId: targetIdNum });
      }
    } catch (e) {
      console.warn("Failed to emit userBlocked event", e);
    }
    // Remove all messages between these users so chat list is cleared
    try {
      const Op = Sequelize.Op;
      await Message.destroy({
        where: {
          [Op.or]: [
            { senderId: userId, receiverId: targetIdNum },
            { senderId: targetIdNum, receiverId: userId },
          ],
        },
      });
      console.log("Deleted messages between", userId, "and", targetIdNum);
    } catch (e) {
      console.warn("Failed to delete messages on block", e);
    }
    return res
      .status(200)
      .json({ success: true, record, message: "User blocked" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const reportUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { targetId, reason } = req.body || {};
    const targetIdNum = targetId ? parseInt(String(targetId), 10) : null;
    if (!userId || !targetIdNum) {
      console.warn("reportUser: missing fields", {
        userId: req.user,
        body: req.body,
      });
      return res
        .status(400)
        .json({ error: "Missing fields: userId or targetId" });
    }
    const record = await Report.create({
      reporterId: userId,
      targetId: targetIdNum,
      reason,
    });
    try {
      if (ioServer) {
        ioServer
          .to(String(userId))
          .emit("userReported", { reporterId: userId, targetId: targetIdNum });
        ioServer
          .to(String(targetIdNum))
          .emit("userReported", { reporterId: userId, targetId: targetIdNum });
      }
    } catch (e) {
      console.warn("Failed to emit userReported event", e);
    }
    // Optionally remove messages on report as well
    try {
      const Op = Sequelize.Op;
      await Message.destroy({
        where: {
          [Op.or]: [
            { senderId: userId, receiverId: targetIdNum },
            { senderId: targetIdNum, receiverId: userId },
          ],
        },
      });
      console.log(
        "Deleted messages between (report)",
        userId,
        "and",
        targetIdNum
      );
    } catch (e) {
      console.warn("Failed to delete messages on report", e);
    }
    return res
      .status(200)
      .json({ success: true, record, message: "User reported" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export default { blockUser, reportUser };
