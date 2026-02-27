const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// ------------------ Express Setup ------------------
const app = express();
const PORT = process.env.PORT || 5002;
const MAC_IP = "192.168.0.101";

// ✅ Middleware
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// ------------------ Serve Uploaded Files ------------------
app.use('/uploads', express.static('/var/www/uploads'));

// ------------------ MongoDB Setup ------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// ------------------ Route Imports ------------------
const userRoutes = require("./routes/userRoutes");
const studioRoutes = require("./routes/studioRoutes");
const branchRoutes = require("./routes/branch");
const batchRoutes = require("./routes/batch");
const couponRoutes = require("./routes/couponRoutes");
const announcementRoutes = require("./routes/announcement.route");
const ratingRoutes = require("./routes/ratingRoutes");
const danceStyleRoutes = require("./routes/dancestyleRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const inboxRoutes = require("./routes/inbox.route");
const filterRoutes = require("./routes/filter");
const cityRoutes = require("./routes/cityRoutes");
const stateRoutes = require("./routes/stateRoutes");
const countryRoutes = require("./routes/countryRoutes");
const levelRoutes = require("./routes/levelRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const platformFeeRoutes = require("./routes/platformFeeRoutes");

// ✅ Mount Routes
app.use("/api/users", userRoutes);
app.use("/api/studios", studioRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/dance-styles", danceStyleRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/inbox", inboxRoutes);
app.use("/api/filters", filterRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api/states", stateRoutes);
app.use("/api/countries", countryRoutes);
app.use("/api/levels", levelRoutes);
app.use("/api/users", uploadRoutes);
app.use("/api/studios", uploadRoutes);
app.use("/api/platformfees", platformFeeRoutes);

// ------------------ Health Check ------------------
app.get("/ping", (req, res) => {
  res.json({ message: "pong from local_backend 💃🕺" });
});

// ------------------ Legacy Redirect ------------------
app.use("/batch", (req, res) => {
  res.redirect(301, "/api/batches" + req.url);
});

// ------------------ Catch-all 404 ------------------
app.use((req, res) => {
  res.status(404).json({ message: "Route not found in local_backend" });
});

// ------------------ Start Server ------------------
app.listen(PORT, () =>
  console.log(`🚀 Local backend running on http://${MAC_IP}:${PORT}`)
);

// ✅ Crash Safety
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
