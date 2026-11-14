require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const router = require("./routes");
const cookieParser = require("cookie-parser");
const dbConfig = require("./config/dbConfig");
const swaggerSpec = require("./config/swagger");
const swaggerUi = require("swagger-ui-express");
const { attachRedis } = require("./middlewre/redisMiddleware");
const { errorHandler } = require("./middlewre/errorHandler");
const { scheduleExpiryJob } = require("./jobs/subscriptionExpiryJob");
const { initChatSocket } = require("./sockets/chatSocket");

const PORT = process.env.PORT || 8000;

const app = express();
const server = http.createServer(app);

const { corsOptions } = require("./helpers/corsConfig");

// ---------- CORS ----------
app.use(cors(corsOptions));

// ---------- Middleware 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(attachRedis);

// ---------- Swagger Docs ----------
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ---------- Health checks ----------
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Nexora Social Backend API",
    docs: "/api-docs",
    health: "/health",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Jakariya Unode API is healthy" });
});

app.get("/health/redis", (_req, res) => {
  const { isRedisAvailable } = require("./helpers/redis");
  res.status(200).json({ success: true, redis: isRedisAvailable() });
});

// ---------- Routes 
app.use(router);

// ---------- Central Error Handler
app.use(errorHandler);

async function start() {
  await dbConfig();
  if (process.env.REDIS_ENABLED === "true") {
    try {
      const { redisConfig } = require("./config/radisConfig");
      await redisConfig();
    } catch (error) {
      console.error("Redis startup failed, continuing without Redis:", error.message);
    }
  }
  scheduleExpiryJob();
  initChatSocket(server);
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
    console.log(`Socket.IO ready`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  });
}

module.exports = app;
