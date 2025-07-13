import multer from "multer";

// Use memory storage or configure disk storage
const storage = multer.memoryStorage(); // stores file in req.file.buffer

// Single image upload (e.g., key = 'photo' in FormData)
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only jpeg and png images are allowed"));
    }
    cb(null, true);
  },
});

export default upload;
