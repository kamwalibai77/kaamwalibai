const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");

// Update user profile
router.put("/update", profileController.updateProfile);

module.exports = router;
