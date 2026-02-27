const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ Use VPS base upload directory
const baseUploadDir = '/var/www/uploads';

// Ensure a subdirectory exists
function ensureDir(subdir) {
  const dir = path.join(baseUploadDir, subdir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// ✅ Studio images directory
const studioDir = ensureDir('studio_images');

// ✅ Configure multer storage for studio images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, studioDir);  // ✅ VPS folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${fileExtension}`);
  }
});

// ✅ File filter (only images)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/octet-stream'
  ];

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  const mimeTypeValid = allowedMimeTypes.includes(file.mimetype);
  const extensionValid = allowedExtensions.includes(fileExtension);

  if (mimeTypeValid || extensionValid) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype} (${fileExtension})`), false);
  }
};

// ✅ Multer uploader for studio images
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 5
  }
});

// ✅ Generate public URL for uploaded image
const generateImageUrl = (filename, req) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/studio_images/${filename}`;
};

// ✅ Delete file from VPS
const deleteImageFile = (filename) => {
  const filePath = path.join(studioDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

// ✅ Extract filename from URL
const extractFilenameFromUrl = (url) => {
  if (!url) return null;
  return url.split('/').pop();
};

// ✅ Profile images directory
const profileImagesDir = ensureDir('profile_images');

// ✅ Configure multer storage for profile images
const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileImagesDir); // ✅ VPS folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${ext}`);
  }
});

const profileImageUpload = multer({ storage: profileImageStorage });

module.exports = {
  upload,
  generateImageUrl,
  deleteImageFile,
  extractFilenameFromUrl,
  profileImageUpload
};
