// backend/middleware/multer.js
import fs from "fs";
import multer from "multer";
import path from "path";

// Set storage location and filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads";
    try {
      if (!fs.existsSync(uploadDir))
        fs.mkdirSync(uploadDir, { recursive: true });
    } catch (e) {
      // if we can't create the folder, pass the error to multer
      return cb(e, null);
    }
    cb(null, uploadDir + "/");
  },
  filename: function (req, file, cb) {
    try {
      // Some mobile clients (blobs from fetch/URI) may not provide
      // `file.originalname`. Be defensive: try originalname first,
      // otherwise infer extension from mimetype or default to .jpg.
      let ext = "";
      if (file && file.originalname) {
        ext = path.extname(file.originalname);
      }
      if (!ext && file && file.mimetype) {
        const m = String(file.mimetype).toLowerCase();
        const map = {
          "image/jpeg": ".jpg",
          "image/jpg": ".jpg",
          "image/png": ".png",
          "image/webp": ".webp",
          "image/heic": ".jpg",
        };
        ext = map[m] || "";
      }
      if (!ext) ext = ".jpg";
      cb(null, `${Date.now()}${ext}`);
    } catch (e) {
      // Fallback filename if anything unexpected happens
      cb(null, `${Date.now()}.jpg`);
    }
  },
});

// Export the multer upload middleware
export const upload = multer({ storage });
