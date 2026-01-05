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

      // Leave all previous rooms to prevent duplicates
      const rooms = Array.from(socket.rooms);
      rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });

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

        // Persist message in DB so we emit an authoritative payload
        try {
          const db = await import("../models/index.js");
          const Message = db.default.Message;
          const saved = await Message.create({
            senderId: senderId,
            receiverId: receiverId,
            message: data.message,
          });

          const payload = saved.toJSON();
          // Emit to receiver only - sender shows message locally
          io.to(rid).emit("receiveMessage", payload);
        } catch (e) {
          console.error("Error saving message in socket handler:", e);
          // Fallback - emit to receiver only
          io.to(rid).emit("receiveMessage", data);
        }
      } catch (err) {
        console.error("sendMessage handler error:", err);
      }
    });

    // Contact Request - User requests service provider's contact
    socket.on("contactRequest", async (data) => {
      try {
        const { requesterId, providerId, requesterName, timestamp } = data;
        const pid = String(providerId);
        
        console.log("📞 Contact request from", requesterId, "to", providerId);

        // Get requester name from database
        try {
          const db = await import("../models/index.js");
          const User = db.default.User;
          const requester = await User.findByPk(requesterId);
          
          const requestData = {
            requesterId,
            providerId,
            requesterName: requester?.name || "A user",
            timestamp,
          };

          // Send request to provider
          io.to(pid).emit("contactRequest", requestData);
          console.log("✅ Contact request sent to provider", providerId);
        } catch (e) {
          console.error("Error fetching requester details:", e);
          // Send anyway with provided name
          io.to(pid).emit("contactRequest", data);
        }
      } catch (err) {
        console.error("contactRequest handler error:", err);
      }
    });

    // Contact Request Response - Provider approves/rejects
    socket.on("contactRequestResponse", async (data) => {
      try {
        const { requesterId, providerId, approved } = data;
        const rid = String(requesterId);
        
        console.log(
          "📞 Contact request response:",
          approved ? "approved" : "rejected",
          "from",
          providerId,
          "to",
          requesterId
        );

        if (approved) {
          io.to(rid).emit("contactRequestApproved", {
            requesterId,
            providerId,
          });
        } else {
          io.to(rid).emit("contactRequestRejected", {
            requesterId,
            providerId,
          });
        }
      } catch (err) {
        console.error("contactRequestResponse handler error:", err);
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
