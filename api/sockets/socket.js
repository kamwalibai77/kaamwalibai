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
      onlineUsers[userId] = socket.id;
      socket.join(userId);
      console.log("✅ User registered:", userId);
    });

    // Send message
    socket.on("sendMessage", (data) => {
      const { receiverId, senderId } = data;
      console.log("📩 Message from", senderId, "to", receiverId, "-----", data);
      io.to(receiverId).emit("receiveMessage", data); // Send to receiver
      // io.to(senderId).emit("receiveMessage", data); // Echo to sender
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
