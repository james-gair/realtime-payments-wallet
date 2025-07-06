import multer from "multer";

// Use memory storage or configure disk storage
const storage = multer.memoryStorage(); // stores file in req.file.buffer

// Single image upload (e.g., key = 'photo' in FormData)
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export default upload;
