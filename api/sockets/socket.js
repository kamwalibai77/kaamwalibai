// api/sockets/socket.js
import { Server } from "socket.io";

export let onlineUsers = {};
export let ioServer = null;

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // expose io instance so other modules can emit events
  ioServer = io;

  io.on("connection", (socket) => {
    console.log("🔗 New client connected:", socket.id);

    // Register user
    socket.on("register", (userId) => {
      const uid = String(userId);
      onlineUsers[uid] = socket.id;
      socket.join(uid);
      console.log("✅ User registered:", uid, "socketId:", socket.id);
    });

    // Send message (check block status)
    socket.on("sendMessage", async (data) => {
      try {
        const { receiverId, senderId } = data;
        const rid = String(receiverId);
        const sid = String(senderId);
        console.log("📩 Message from", sid, "to", rid, "-----", data);

        // Check BlockedUser table — if either user has blocked the other, reject
        try {
          const db = await import("../models/index.js");
          const BlockedUser = db.default.BlockedUser;
          const Sequelize = db.default.Sequelize;
          const Op = Sequelize.Op;

          const blocked = await BlockedUser.findOne({
            where: {
              [Op.or]: [
                { userId: senderId, targetId: receiverId },
                { userId: receiverId, targetId: senderId },
              ],
            },
          });

          if (blocked) {
            console.log(
              "⛔ Message blocked due to BlockedUser record between",
              senderId,
              receiverId
            );
            // Notify sender that their message was blocked and include the original data
            io.to(sid).emit("messageBlocked", { reason: "User blocked", data });
            return;
          }
        } catch (e) {
          console.error(
            "Error checking blocked users:",
            e && e.stack ? e.stack : e
          );
          // proceed with sending if DB check fails (fail-open)
        }

        // Send to receiver
        io.to(rid).emit("receiveMessage", data);

        // Also emit to sender (echo)
        io.to(sid).emit("receiveMessage", data);
      } catch (err) {
        console.error("sendMessage handler error:", err);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", socket.id);
      Object.keys(onlineUsers).forEach((uid) => {
        if (onlineUsers[uid] === socket.id) delete onlineUsers[uid];
      });
    });
  });
}
