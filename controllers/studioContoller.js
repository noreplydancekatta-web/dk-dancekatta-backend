const Studio = require('../models/studioModel');
const path = require('path');
const fs = require('fs');
const { sendStudioUnderReviewEmail } = require("../utils/studioEmailService");

// Create a studio
exports.createStudio = async (req, res) => {
  try {
    const { name, description } = req.body;
    const logo = req.files?.logo?.[0];
    const images = req.files?.images || [];

    const logoPath = logo ? `/uploads/${logo.filename}` : '';
    const imagePaths = images.map((file) => `/uploads/${file.filename}`);

    const newStudio = new Studio({
      name,
      description,
      logo: logoPath,
      images: imagePaths,
    });

    await newStudio.save();
    res.status(201).json(newStudio);
  } catch (err) {
    console.error('Error creating studio:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get all studios
exports.getStudios = async (req, res) => {
  try {
    const studios = await Studio.find();
    res.json(studios);
  } catch (err) {
    console.error('Error fetching studios:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get single studio by ID
exports.getStudioById = async (req, res) => {
  try {
    const studio = await Studio.findById(req.params.id);
    if (!studio) return res.status(404).json({ message: 'Studio not found' });
    res.json(studio);
  } catch (err) {
    console.error('Error fetching studio:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};