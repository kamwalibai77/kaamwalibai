const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/register", authController.signup);
router.post("/login", authController.login);
router.get("/profile", authController.profile);

module.exports = router;
