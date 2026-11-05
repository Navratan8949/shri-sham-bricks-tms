const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(morgan("dev"));
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      // Allow any localhost / 127.0.0.1 port or configured allowedOrigins
      if (
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes("*") ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-company-id"],
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use("/public", express.static(path.join(__dirname, "..", "public")));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/companies", require("./routes/companyRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/vehicles", require("./routes/vehicleRoutes"));
app.use("/api/drivers", require("./routes/driverRoutes"));
app.use("/api/materials", require("./routes/materialRoutes"));
app.use("/api/supply-orders", require("./routes/supplyOrderRoutes"));
app.use("/api/vehicle-expenses", require("./routes/vehicleExpenseRoutes"));
app.use("/api/simple-dashboard", require("./routes/simpleDashboardRoutes"));
app.use("/api/alerts", require("./routes/alertRoutes"));
app.use("/api/settings", require("./routes/settingRoutes"));

app.get("/api/health", (req, res) =>
  res
    .status(200)
    .json({
      success: true,
      message: "Shri Shyam Bricks API is healthy",
      timestamp: new Date().toISOString(),
    }),
);
app.get("/", (req, res) =>
  res
    .status(200)
    .json({ success: true, message: "Shri Shyam Bricks API is running" }),
);
app.use((req, res) =>
  res
    .status(404)
    .json({
      success: false,
      message: "Route not found",
      path: req.originalUrl,
    }),
);
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (err instanceof multer.MulterError)
    return res.status(400).json({ success: false, message: err.message });
  if (err.message === "CORS origin not allowed")
    return res.status(403).json({ success: false, message: err.message });
  res.status(500).json({ success: false, message: "Internal server error" });
});
module.exports = app;
