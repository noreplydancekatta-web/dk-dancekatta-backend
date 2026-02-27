const Coupon = require("../models/couponModel");

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Public (adjust as needed)
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ message: "Error fetching coupons", error });
  }
};

module.exports = {
  getAllCoupons,
};