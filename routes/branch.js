const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Branch = require('../models/branch'); // Adjust the path if needed
const multer = require('multer');
const path = require('path');

// ✅ Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // make sure uploads folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  }
});
const upload = multer({ storage });

// Helper function to transform branch data
const transformBranchData = (branch) => {
  let branchName = branch.branchName || branch.name || `Branch ${branch._id.toString().substring(0, 8)}`;
  let branchAddress = branch.branchAddress || branch.address || 'Address not available';
  let contactNo = branch.contactNumber || branch.contactNo || 'Contact not available';

  return {
    _id: branch._id,
    branchName: branchName,
    branchAddress: branchAddress,
    contactNo: contactNo,
    mapLink: branch.mapLink || '',
    branchCity: branch.branchCity || branch.city || 'City not available',
    branchState: branch.branchState || branch.state || 'State not available',
    branchPincode: branch.branchPincode || branch.pincode || 'Pincode not available',
    branchEmail: branch.branchEmail || branch.email || 'Email not available',
    status: branch.status || 'Pending',
    studioId: branch.studioId,
    area: branch.area || 'Unknown Area',
  };
};

// ✅ POST - Add a branch with an image
router.post('/add-branch', upload.single('image'), async (req, res) => {
  try {
    const branch = new Branch({
      ...req.body,
      image: req.file ? `/uploads/${req.file.filename}` : '' // save image path
    });
    await branch.save();
    res.status(201).json(transformBranchData(branch));
  } catch (err) {
    console.error('Error adding branch:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// ✅ GET all branches
router.get('/', async (req, res) => {
  try {
    const branches = await Branch.find();
    const transformedBranches = branches.map(transformBranchData);
    res.status(200).json(transformedBranches);
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// ✅ GET branches by studioId (place this BEFORE '/:branchId')
router.get('/studio/:studioId', async (req, res) => {
  try {
    const { studioId } = req.params;

    // Handle both ObjectId and string storage
    const filter = mongoose.Types.ObjectId.isValid(studioId)
      ? { studioId: new mongoose.Types.ObjectId(studioId) }
      : { studioId };

    const branches = await Branch.find(filter);

    // Return empty array (200) instead of 404 to keep UI happy
    const transformed = branches.map(transformBranchData);
    return res.status(200).json(transformed);
  } catch (err) {
    console.error('Error fetching branches by studio:', err);
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// ✅ GET branch by ID
router.get('/:branchId', async (req, res) => {
  const branchId = req.params.branchId;
  if (!mongoose.Types.ObjectId.isValid(branchId)) {
    return res.status(400).json({ message: 'Invalid branch ID' });
  }

  try {
    const branch = await Branch.findById(branchId);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    res.status(200).json(transformBranchData(branch));
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});



module.exports = router;
