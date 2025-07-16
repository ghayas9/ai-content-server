import { Router } from "express";
import * as controller from "../controllers/auth.controller";
import * as schema from "../schemas/auth.schemas";
import { validate } from "../middleware/validation.middleware";
import { isAuthenticated } from "../middleware/authentication";

const router = Router();

// Public routes (no authentication required)
router.post("/register", validate(schema.register), controller.register);
router.post("/login", validate(schema.login), controller.login);
router.post("/google", validate(schema.googleLogin), controller.googleLogin);
router.post(
  "/facebook",
  validate(schema.facebookLogin),
  controller.facebookLogin,
);
router.post(
  "/refresh-token",
  validate(schema.refreshToken),
  controller.refreshToken,
);
router.post(
  "/forgot-password",
  validate(schema.requestPasswordReset),
  controller.requestPasswordReset,
);
router.post(
  "/verify-otp",
  validate(schema.verifyResetPasswordOTP),
  controller.verifyResetPasswordOTP,
);
router.post(
  "/reset-password",
  validate(schema.resetPassword),
  controller.resetPassword,
);
router.post("/verify-token", controller.verifyAuthToken);

// Protected routes (authentication required)
router.post(
  "/logout",
  isAuthenticated,
  validate(schema.logout),
  controller.logout,
);
router.post("/logout-all", isAuthenticated, controller.logoutAll);
router.post(
  "/request-verification",
  isAuthenticated,
  controller.requestEmailVerification,
);
router.post(
  "/verify-email",
  isAuthenticated,
  validate(schema.verifyEmail),
  controller.verifyEmail,
);
router.post(
  "/change-password",
  isAuthenticated,
  validate(schema.changePassword),
  controller.changePassword,
);

export default router;
