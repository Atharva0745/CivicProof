const multer = require('multer');

// Memory storage keeps file buffer available for immediate cryptographic hashing and validation
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file format. Only JPEG, PNG, and WebP evidence photographs are allowed.'
      ),
      false
    );
  }
};

const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10);

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSizeMB * 1024 * 1024 // e.g. 10MB
  },
  fileFilter
});

module.exports = upload;
