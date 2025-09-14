// backend/middleware/multer.js
import multer from "multer";
import path from "path";

// Set storage location and filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // e.g., 1690000000000.jpg
  },
});

// Export the multer upload middleware
export const upload = multer({ storage });
