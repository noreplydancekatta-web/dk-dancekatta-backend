const express = require("express");
const router = express.Router();
const PlatformFee = require("../models/platformFee");

// ✅ Get all platform fees
router.get("/", async (req, res) => {
  try {
    const fees = await PlatformFee.find();
    res.json(fees);
  } catch (err) {
    res.status(500).json({ message: "Error fetching platform fees" });
  }
});

// ✅ Get a specific platform fee by ID
router.get("/:id", async (req, res) => {
  try {
    const fee = await PlatformFee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ message: "Platform fee not found" });
    }
    res.json(fee);
  } catch (err) {
    res.status(500).json({ message: "Error fetching platform fee" });
  }
});

module.exports = router;
