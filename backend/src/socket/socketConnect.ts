import { Server } from "socket.io";
import { Server as HttpServer } from "http";

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

    socket.on("register", (userId: string) => {
      onlineUsers.set(userId, socket.id);
      console.log("connect UserId: ",userId)
      console.log(onlineUsers)
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