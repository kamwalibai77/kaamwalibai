// api/sockets/socket.js
import { Server } from "socket.io";

export let onlineUsers = {};

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🔗 New client connected:", socket.id);

    // Register user
    socket.on("register", (userId) => {
      const uid = String(userId);
      onlineUsers[uid] = socket.id;
      socket.join(uid);
      console.log("✅ User registered:", uid, "socketId:", socket.id);
    });

    // Send message
    socket.on("sendMessage", (data) => {
      const { receiverId, senderId } = data;
      const rid = String(receiverId);
      const sid = String(senderId);
      console.log("📩 Message from", sid, "to", rid, "-----", data);

      // Send to receiver
      io.to(rid).emit("receiveMessage", data);

      // Also emit to sender (echo) so sender's UI can be updated from server-side
      // (useful when server assigns a canonical id or enriches message)
      io.to(sid).emit("receiveMessage", data);
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
