import "reflect-metadata";
import express from "express";
import { Container } from "inversify";
import { config } from "dotenv";
import cors from "cors";
import helmet from "helmet";
import audioRoutes from "./routes/audio-routes";
import { logger } from "./utils/logger";
import path from "path";
import fs from "fs";
import uuid4 from "uuid4";

import { createServer } from "http";
import { initializeWebSocket } from "./config/socketIO-config";
import { chatService } from "./services/chat-service";

// Load environment variables
config();

const app = express();
const httpServer = createServer(app);

initializeWebSocket(httpServer);

const container = new Container();
const port = process.env.PORT || 3030;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Range"],
    exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length", "Content-Type"],
  })
);

// Configure helmet to allow audio streaming
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json());

// Routes
app.use("/api/audio", audioRoutes);

// Basic health check endpoint
app.get("/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

httpServer.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

export { app, container };
