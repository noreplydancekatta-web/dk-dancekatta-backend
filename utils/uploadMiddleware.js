const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Factory function to create multer upload middleware
 * @param {string} folder - subfolder inside /uploads (e.g., "profile_images", "studio_logos")
 * @param {string} fieldName - field name expected in form-data (e.g., "image", "logo")
 */
function createUploader(folder, fieldName) {
  const uploadPath = path.join(__dirname, '..', 'uploads', folder);

  // Ensure folder exists
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  // Configure multer storage
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
      cb(null, uniqueName);
    }
  });

  // Only allow images
  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  };

  const upload = multer({ storage, fileFilter });

  // Return middleware for single file upload
  return upload.single(fieldName);
}

module.exports = createUploader;
