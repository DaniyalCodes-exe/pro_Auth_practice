const express = require("express");
const userController = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", userController.userRegisterController);
router.post("/login", userController.userLoginController);
router.get("/getme", userController.profileFetch);
router.post("/refresh-token", userController.refreshTokenController);
router.post("/logout", userController.logoutController);
router.post("/logout-all", userController.logoutAllController);
router.post("/verify-email", userController.verifyEmailController);
router.post("/forgot-password", userController.forgotPasswordController);
router.post("/reset-password", userController.resetPasswordController);

module.exports = router;
