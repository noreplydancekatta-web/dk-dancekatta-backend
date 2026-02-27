// routes/uploadRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const User = require("../models/User");
const Studio = require("../models/studio");

// ===== Multer Storage Factory =====
function createStorage(folderName) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `/var/www/uploads/${folderName}`); // VPS central upload folder
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
}

// ===== File Filters (only images for now) =====
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// ===== Uploaders =====
const uploadProfile = multer({ storage: createStorage("profile-pictures"), fileFilter: imageFilter });
const uploadStudioLogo = multer({ storage: createStorage("logos"), fileFilter: imageFilter });
const uploadStudioImages = multer({ storage: createStorage("studios"), fileFilter: imageFilter });
const uploadAadhar = multer({ storage: createStorage("aadhar"), fileFilter: imageFilter });

// ===== Routes =====

// 1. Profile Image Upload
// routes/uploadRoutes.js
router.post("/profile-image", uploadProfile.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const filePath = `/uploads/profile-pictures/${req.file.filename}`;

    // Return uploaded file path
    res.json({ message: "Upload successful", path: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 2. Studio Logo Upload
router.post("/logo", uploadStudioLogo.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const filePath = `/uploads/logos/${req.file.filename}`;

    res.json({ message: "Studio logo updated", path: filePath});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Studio Multiple Images Upload
router.post("/images", uploadStudioImages.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: "No files uploaded" });

    const filePaths = req.files.map(file => `/uploads/studios/${file.filename}`);

    res.json({ message: "Studio images updated", paths: filePaths});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Aadhaar Front Upload
router.post("/aadhar-front", uploadAadhar.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const filePath = `/uploads/aadhar/${req.file.filename}`;

    res.json({ message: "Aadhar front uploaded", path: filePath});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Aadhaar Back Upload
router.post("/aadhar-back", uploadAadhar.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const filePath = `/uploads/aadhar/${req.file.filename}`;

    res.json({ message: "Aadhar back uploaded", path: filePath});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;