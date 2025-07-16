// src/server.ts
import http from "http";
import app from "./app";
import config from "./config";
import sequelize from "./config/database";
import logger from "./config/logger";

// Create HTTP server from Express app
const server = http.createServer(app);

// Initialize WebSocket server with the HTTP server

// Database connection and server start
sequelize
  .authenticate()
  .then(() => {
    logger.info("Database connected");

    // Start server - using the HTTP server instance instead of app.listen
    server.listen(config.PORT, () => {
      logger.info(`Server is running on port ${config.PORT}`);
      logger.info("WebSocket server initialized");
    });
  })
  .catch((err) => {
    logger.error("Database connection failed:", err);
  });

// Handle graceful shutdown
// process.on("SIGTERM", () => {
//   logger.info("SIGTERM received, shutting down gracefully");

//   server.close(() => {
//     logger.info("HTTP server closed");

//     sequelize.close().then(() => {
//       logger.info("Database connection closed");
//       process.exit(0);
//     });
//   });
// });

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);

  // Exit with error
  process.exit(1);
});

export default server;
