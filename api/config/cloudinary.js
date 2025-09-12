// backend/config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "dvjzsuy1x",
  api_key: "849712924611974",
  api_secret: "2cE58L1r7FGtEcA1PLwEK1heO-w",
});

// ✅ default options (preset)
export const cloudinaryOptions = {
  upload_preset: "profile_upload", // unsigned preset name (must exist in Cloudinary dashboard)
};

export default cloudinary;
