import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { logger } from "../utils/logger";

let io: Server;

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO server not initialized");
  }
  return io;
};

export const initializeWebSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};
