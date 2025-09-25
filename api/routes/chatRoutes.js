import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import db from "../models/index.js";

const router = express.Router();
const Message = db.Message;
const User = db.User;
const Sequelize = db.Sequelize;

// ✅ Send a message
router.post("/send", authMiddleware, async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.id;

    if (!message || !receiverId) {
      return res
        .status(400)
        .json({ success: false, error: "Message & Receiver required" });
    }

    const newMessage = await Message.create({ senderId, receiverId, message });
    res.json({ success: true, message: newMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ✅ Get all chats for current user with unread counts
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await Message.findAll({
      where: {
        [Sequelize.Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name", "profilePhoto"],
        },
        {
          model: User,
          as: "receiver",
          attributes: ["id", "name", "profilePhoto"],
        },
      ],
    });

    const chatMap = {};
    messages.forEach((msg) => {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!chatMap[otherUser.id]) {
        chatMap[otherUser.id] = {
          id: otherUser.id,
          name: otherUser.name,
          profilePhoto: otherUser.profilePhoto,
          lastMessage: msg.message,
          updatedAt: msg.createdAt,
          unreadCount: msg.receiverId === userId && !msg.read ? 1 : 0,
        };
      } else {
        if (msg.receiverId === userId && !msg.read) {
          chatMap[otherUser.id].unreadCount += 1;
        }
      }
    });

    const chatList = Object.values(chatMap);

    res.json({ success: true, chats: chatList });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ✅ Get chat history between two users
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.userId;

    const messages = await Message.findAll({
      where: {
        [Sequelize.Op.or]: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      order: [["createdAt", "ASC"]],
    });

    res.json({ success: true, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ✅ Mark messages as read
// Mark messages as read when opening a chat
router.put("/read/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.userId;

    await Message.update(
      { read: true },
      {
        where: {
          senderId: otherUserId,
          receiverId: userId,
          read: false,
        },
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ✅ Edit a message
router.put("/:messageId", authMiddleware, async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const { message } = req.body;
    const userId = req.user.id;

    const msg = await Message.findByPk(messageId);

    if (!msg)
      return res
        .status(404)
        .json({ success: false, error: "Message not found" });
    if (msg.senderId !== userId)
      return res.status(403).json({ success: false, error: "Not authorized" });

    msg.message = message || msg.message;
    await msg.save();

    res.json({ success: true, message: msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ✅ Delete a message
router.delete("/:messageId", authMiddleware, async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user.id;

    const msg = await Message.findByPk(messageId);

    if (!msg)
      return res
        .status(404)
        .json({ success: false, error: "Message not found" });
    if (msg.senderId !== userId)
      return res.status(403).json({ success: false, error: "Not authorized" });

    await msg.destroy();
    res.json({ success: true, message: "Message deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
