// backend/config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Small helper to upload with retries and clearer logging
export async function uploadFile(localPath, options = {}) {
  const maxAttempts = options.retries || 2;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let attempt = 0;
  let lastErr = null;

  while (attempt <= maxAttempts) {
    try {
      attempt++;
      const res = await cloudinary.uploader.upload(localPath, options);
      return res;
    } catch (err) {
      lastErr = err;
      console.warn(`Cloudinary upload attempt ${attempt} failed for ${localPath}:`, err && err.message ? err.message : err);
      if (attempt > maxAttempts) break;
      // exponential backoff
      await wait(500 * attempt);
    }
  }

  const e = new Error(`Cloudinary upload failed after ${maxAttempts + 1} attempts for ${localPath}: ${lastErr && lastErr.message ? lastErr.message : lastErr}`);
  e.original = lastErr;
  throw e;
}

export default cloudinary;
