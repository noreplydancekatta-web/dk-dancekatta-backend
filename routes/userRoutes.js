const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Studio = require('../models/studio');
const sendWelcomeEmail = require("../utils/emailService");


//const { upload, profileImageUpload, generateImageUrl, deleteImageFile, extractFilenameFromUrl } = require('../utils/imageUpload');

// ✅ POST - Register new user
router.post('/', async (req, res) => {
  try {
   let { email } = req.body;

if (!email) {
  return res.status(400).json({ message: 'Email is required' });
}

email = email.toLowerCase().trim();


    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'This email is already registered' });
    }

    // Calculate if profile is complete based on required fields
    const isProfileComplete = calculateProfileCompletion(req.body);

    // Ensure profilePhoto is not null or empty string
    let profilePhoto = req.body.profilePhoto;
    if (!profilePhoto || profilePhoto === "null" || profilePhoto === "") {
      profilePhoto = undefined;
    }

    const userData = {
      ...req.body,
      email,
      profilePhoto, // overwrite with cleaned value
      isProfileComplete
    };
    
    const user = new User(userData);
    await user.save();

    //  Send email AFTER user saved
    const emailSent = await sendWelcomeEmail(user);

    if (!emailSent) {
      console.log("User created but email failed.");
    }

    res.status(201).json({
      message: emailSent
        ? "User registered and email sent"
        : "User registered but email failed",
      user
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ POST /api/user/check-google
// ✅ POST /api/users/check-google
router.post('/check-google', async (req, res) => {
  try {
    const { email, name, photoURL } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ✅ Check if a user already exists
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // ✅ User exists (OTP or Google) → return existing user
      const userWithFlag = await attachStudioFlag(user);
      return res.json({ exists: true, user: userWithFlag });
    }

    // ❌ If not found, only then create a new user
    const firstName = name ? name.split(' ')[0] : '';
    const lastName = name ? name.split(' ').slice(1).join(' ') : '';

    const userData = {
      firstName,
      lastName,
      email: normalizedEmail,
      profilePhoto: photoURL || '',
      mobile: '',
      altMobile: '',
      dateOfBirth: '',
      guardianName: '',
      guardianMobile: '',
      guardianEmail: '',
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      youtube: '',
      facebook: '',
      instagram: '',
      isProfessional: '',
      experience: '',
      skills: [],
      isProfileComplete: false
    };

    user = new User(userData);
    await user.save();

    const userWithFlag = await attachStudioFlag(user);
    return res.status(201).json({ exists: false, user: userWithFlag });

  } catch (err) {
    console.error('Check Google user error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});



// ✅ GET - Fetch all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    const usersWithFlags = await Promise.all(users.map(u => attachStudioFlag(u)));
    res.json(usersWithFlags); // ✅ include studioCreated for each user
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ 🟡 Important: Keep this before /:id
router.get('/email/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userWithFlag = await attachStudioFlag(user);
    return res.status(200).json(userWithFlag);
  } catch (err) {
    console.error('❌ Error fetching user:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});



// ✅ PUT - Update user by ID
router.put('/:id', async (req, res) => {
  try {
    console.log('PUT /:id - User ID:', req.params.id);
    console.log('PUT /:id - Request body:', req.body);

    // Calculate if profile is complete based on required fields
    const isProfileComplete = calculateProfileCompletion(req.body);
    console.log('PUT /:id - Calculated isProfileComplete:', isProfileComplete);

    // Add the calculated isProfileComplete to the update data
    const updateData = {
      ...req.body,
      isProfileComplete
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      console.log('PUT /:id - User not found for ID:', req.params.id);
      return res.status(404).json({ error: 'User not found' });
    }

    // ✅ log update success
    console.log('PUT /:id - User updated successfully:', updatedUser._id);

    // ✅ return with studioCreated
    const userWithFlag = await attachStudioFlag(updatedUser);
    res.json(userWithFlag);
  } catch (err) {
    console.error('PUT /:id - Error:', err);
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
});

//// ✅ POST /api/users/:id/profile-photo - Upload profile photo
//router.post('/:id/profile-photo', upload.single('profilePhoto'), async (req, res) => {
//  try {
//    const userId = req.params.id;
//
//    if (!req.file) {
//      return res.status(400).json({ message: 'No image file provided' });
//    }
//
//    // Find the user first
//    const user = await User.findById(userId);
//    if (!user) {
//      // Delete uploaded file if user doesn't exist
//      deleteImageFile(req.file.filename);
//      return res.status(404).json({ message: 'User not found' });
//    }
//
//    // Generate public URL for the uploaded image
//    const imageUrl = generateImageUrl(req.file.filename, req);
//
//    // Delete old profile photo if it exists
//    if (user.profilePhoto) {
//      const oldFilename = extractFilenameFromUrl(user.profilePhoto);
//      if (oldFilename) {
//        deleteImageFile(oldFilename);
//      }
//    }
//
//    // Update user with new profile photo URL
//    const updatedUser = await User.findByIdAndUpdate(
//      userId,
//      { profilePhoto: imageUrl },
//      { new: true }
//    );
//
//    res.status(200).json({
//      message: 'Profile photo uploaded successfully',
//      profilePhoto: imageUrl,
//      user: updatedUser
//    });
//
//  } catch (err) {
//    console.error('❌ Error uploading profile photo:', err);
//
//    // Delete uploaded file if there was an error
//    if (req.file) {
//      deleteImageFile(req.file.filename);
//    }
//
//    res.status(500).json({ message: 'Failed to upload profile photo', error: err.message });
//  }
//});

// ✅ POST /api/users/profile-image - Upload profile image before user creation
//router.post('/profile-image/:id', profileImageUpload.single('image'), async (req, res) => {
//  try {
//    if (!req.file) {
//      return res.status(400).json({ message: 'No image file provided' });
//    }
//    // ✅ Return correct relative path for storage in DB
//    const relativePath = `/uploads/profile_images/${req.file.filename}`;
//    res.status(200).json({ path: relativePath });
//  } catch (err) {
//    if (req.file) {
//      deleteImageFile(req.file.filename);
//    }
//    res.status(500).json({ message: 'Failed to upload image', error: err.message });
//  }
//});

// ✅ GET - Fetch user by ID (Keep this LAST!)
router.get('/:id', async (req, res) => {
  try {
    console.log('GET /:id - User ID:', req.params.id);
    const user = await User.findById(req.params.id);
    if (!user) {
      console.log('GET /:id - User not found for ID:', req.params.id);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('GET /:id - User found:', user._id);

    const userWithFlag = await attachStudioFlag(user);
    res.json(userWithFlag);

  } catch (err) {
    console.error('GET /:id - Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper function to calculate profile completion
function calculateProfileCompletion(userData) {
  // Check if user is adult (18+)
  let isAdult = true;
  if (userData.dateOfBirth) {
    try {
      const birthDate = new Date(userData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      isAdult = age >= 18;
    } catch (e) {
      isAdult = true; // Default to adult if date parsing fails
    }
  }

  const requiredFields = [
    userData.firstName,
    userData.lastName,
    userData.email,
    userData.mobile,
    userData.dateOfBirth,
    userData.address,
    userData.city,
    userData.state,
    userData.country,
    userData.pincode,
    userData.isProfessional,
  ];

  // Add guardian fields only if user is under 18
  if (!isAdult) {
    requiredFields.push(
      userData.guardianName,
      userData.guardianMobile,
      userData.guardianEmail
    );
  }

  // Check if all required fields are filled
  const allRequiredFieldsFilled = requiredFields.every(field =>
    field && field.toString().trim().length > 0
  );

  // If user is professional, experience is also required
  if (userData.isProfessional === 'Yes') {
    if (!userData.experience || userData.experience.trim().length === 0) {
      return false;
    }
  }

  // Check if at least one skill is added
  const hasSkills = userData.skills &&
    Array.isArray(userData.skills) &&
    userData.skills.length > 0 &&
    userData.skills.some(skill =>
      skill.style &&
      skill.style.toString().trim().length > 0 &&
      skill.level &&
      skill.level.toString().trim().length > 0
    );

  return allRequiredFieldsFilled && hasSkills;
}

async function attachStudioFlag(user) {
  if (!user) return user;

  // Find studio by ownerId (not email)
  const studio = await Studio.findOne({ ownerId: user._id });

  // Convert mongoose doc → plain object
  const obj = user.toObject ? user.toObject() : user;

  if (studio) {
    obj.studioCreated = true;
    obj.isStudioOwner = studio.status === "Approved"; // ✅ Only true if approved
    obj.studioStatus = studio.status; // Pending, Approved, Rejected
  } else {
    obj.studioCreated = false;
    obj.isStudioOwner = false;
    obj.studioStatus = null;
  }

  return obj;
}

module.exports = router;