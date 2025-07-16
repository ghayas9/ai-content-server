import { z } from "zod";

/**
 * User registration schema
 */
export const register = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters long")
      .max(50, "First name cannot exceed 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters long")
      .max(50, "Last name cannot exceed 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces"),
    email: z.string().email("Invalid email format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    phone: z
      .string()
      .regex(/^[+]?[\d\s\-\(\)]+$/, "Invalid phone number format")
      .optional(),
    referralCode: z.string().optional(),
  }),
});

/**
 * User login schema
 */
export const login = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
});

/**
 * Google login schema
 */
export const googleLogin = z.object({
  body: z.object({
    idToken: z.string().min(1, "Google ID token is required"),
  }),
});

/**
 * Facebook login schema
 */
export const facebookLogin = z.object({
  body: z.object({
    accessToken: z.string().min(1, "Facebook access token is required"),
  }),
});

/**
 * Logout schema
 */
export const logout = z.object({
  body: z.object({
    token: z.string().min(1, "Token is required"),
  }),
});

/**
 * Refresh token schema
 */
export const refreshToken = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

/**
 * Request password reset schema
 */
export const requestPasswordReset = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
  }),
});

/**
 * Verify reset password OTP schema
 */
export const verifyResetPasswordOTP = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    code: z
      .string()
      .min(4, "Verification code must be at least 4 characters")
      .max(8, "Verification code cannot exceed 8 characters")
      .regex(
        /^[A-Z0-9]+$/,
        "Verification code can only contain uppercase letters and numbers",
      ),
  }),
});

/**
 * Reset password schema
 */
export const resetPassword = z.object({
  body: z.object({
    resetToken: z.string().min(1, "Reset token is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
  }),
});

/**
 * Verify email schema
 */
export const verifyEmail = z.object({
  body: z.object({
    code: z
      .string()
      .min(4, "Verification code must be at least 4 characters")
      .max(8, "Verification code cannot exceed 8 characters")
      .regex(
        /^[A-Z0-9]+$/,
        "Verification code can only contain uppercase letters and numbers",
      ),
  }),
});

/**
 * Change password schema
 */
export const changePassword = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
  }),
});

/**
 * Verify auth token schema (for header validation)
 */
export const verifyAuthToken = z.object({
  headers: z.object({
    authorization: z
      .string()
      .regex(
        /^Bearer\s+.+/,
        "Authorization header must be in 'Bearer <token>' format",
      ),
  }),
});
