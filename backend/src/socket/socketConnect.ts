import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";

let  io : Server;
const onlineUsers = new Map<string,string>();

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register", (token: string) => {
      try {
        if (!token) return;
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "demo_super_secret_jwt_key_123"
        ) as { id: string };
        const userId = decoded.id;
        onlineUsers.set(userId, socket.id);
        console.log("connect UserId (verified): ", userId);
      } catch (err) {
        console.error("Socket register verification failed:", err);
      }
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log("Delete UserId: ",userId)
          console.log(onlineUsers)
        }
      }
    });
  });

  return io;
};

export const sendNotification = (
  userId: string,
  notification: any,
) => {
  const socketId = onlineUsers.get(userId);

  if (socketId) {
    io.to(socketId).emit("notification", notification);
  }
};