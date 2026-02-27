const express = require('express');
const {
  getAllCoupons,
} = require('../controllers/couponController');

const router = express.Router();

router.get('/', getAllCoupons);



module.exports = router;