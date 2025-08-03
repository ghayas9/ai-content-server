import axios from "axios";
import sequelize from "../config/database";
import AppError from "../utils/app.error";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import config from "../config";
import User from "../models/user.models";
import OTP from "../models/otp.models";
import { sendMail } from "../utils/mail";

const OTP_EXPIRY_MINUTES = 10;
const JWT_EXPIRY_MINUTES = 15;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 3;

// Registration payload interface
export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  referralCode?: string;
}

// Login payload interface
export interface LoginPayload {
  email: string;
  password: string;
}

// Token types for different authentication purposes
export enum TokenType {
  ACCESS = "ACCESS",
  REFRESH = "REFRESH",
  RESET_PASSWORD = "RESET_PASSWORD",
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
}

// Interface for authentication token payload
interface AuthTokenPayload {
  id: string;
  email: string;
  role: string;
  type: TokenType;
}

const generateAuthTokens = (user: User) => {
  const payload: AuthTokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    type: TokenType.ACCESS,
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: "360d",
    // expiresIn: "24h",
  });

  payload.type = TokenType.REFRESH;
  const refreshToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

// Auth service functions
export const register = async ({
  firstName,
  lastName,
  email,
  password,
  phone,
  referralCode,
}: RegisterPayload) => {
  const transaction = await sequelize.transaction();

  try {
    // Check if email already exists
    const existingUserByEmail = await User.findOne({
      where: { email: email.toLowerCase() },
      transaction,
    });

    if (existingUserByEmail) {
      await transaction.rollback();
      throw new AppError("EMAIL EXISTS", 400);
    }

    // Create user
    const user = await User.create(
      {
        firstName,
        lastName,
        email: email.toLowerCase(),
        password, // Will be hashed by model hook
        phone,
        emailVerified: false,
        credits: 50, // Signup bonus
        role: "user",
        status: "active",
      },
      { transaction },
    );

    // Commit transaction
    await transaction.commit();

    // Return user details (excluding sensitive information)
    return {
      message: "User registered successfully",
      data: user,
    };
  } catch (error) {
    // Rethrow known errors or wrap unknown errors
    if (error instanceof AppError) {
      throw error;
    }

    // Rollback transaction if it hasn't been committed
    await transaction.rollback();

    console.error("Registration error:", error);
    throw new AppError("REGISTRATION ERROR", 500);
  }
};

export const login = async ({ email, password }: LoginPayload) => {
  try {
    // Find user by email
    const user = await User.findOne({
      where: {
        email: email.toLowerCase(),
        status: ["active", "inactive"],
      },
    });

    // Check user existence
    if (!user) {
      throw new AppError("INVALID_CREDENTIALS", 401);
    }

    // Verify password
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      throw new AppError("INVALID_CREDENTIALS", 401);
    }

    // Check account status
    if (user.status === "blocked") {
      throw new AppError("ACCOUNT_BLOCKED", 403);
    }

    // Generate tokens
    const tokens = generateAuthTokens(user);

    return {
      message: "Login successful",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        credits: user.credits,
        emailVerified: user.emailVerified,
      },
      ...tokens,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error("Login error:", error);
    throw new AppError("LOGIN_ERROR", 500);
  }
};

export const googleLogin = async (idToken: string) => {
  try {
    // Verify Google ID token
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
    );

    const { email, name, sub: googleId } = response.data;
    const [firstName, ...lastNameParts] = (name || email).split(" ");
    const lastName = lastNameParts.join(" ") || "";

    // Find or create user
    let user = await User.findOne({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      // Create new user
      user = await User.create({
        email: email.toLowerCase(),
        firstName,
        lastName,
        emailVerified: true,
        credits: 50,
        role: "user",
        status: "active",
        password: uuidv4(), // Random password for OAuth users
      });
    }

    // Generate tokens
    const tokens = generateAuthTokens(user);

    return {
      message: "Google login successful",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        credits: user.credits,
        emailVerified: true,
      },
      ...tokens,
    };
  } catch (error) {
    console.error("Google login error:", error);
    throw new AppError("GOOGLE_LOGIN_ERROR", 500);
  }
};

export const facebookLogin = async (accessToken: string) => {
  try {
    // Verify Facebook access token and get user info
    const response = await axios.get(
      `https://graph.facebook.com/me?fields=id,email,name&access_token=${accessToken}`,
    );

    const { email, name, id: facebookId } = response.data;
    const [firstName, ...lastNameParts] = (name || email).split(" ");
    const lastName = lastNameParts.join(" ") || "";

    // Find or create user
    let user = await User.findOne({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      // Create new user
      user = await User.create({
        email: email.toLowerCase(),
        firstName,
        lastName,
        emailVerified: true,
        credits: 50,
        role: "user",
        status: "active",
        password: uuidv4(), // Random password for OAuth users
      });
    }

    // Generate tokens
    const tokens = generateAuthTokens(user);

    return {
      message: "Facebook login successful",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        credits: user.credits,
        emailVerified: true,
      },
      ...tokens,
    };
  } catch (error) {
    console.error("Facebook login error:", error);
    throw new AppError("FACEBOOK_LOGIN_ERROR", 500);
  }
};

export const logout = async (token: string) => {
  try {
    // Token invalidation logic would go here
    // For now, just return success message
    return { message: "Logout successful" };
  } catch (error) {
    console.error("Logout error:", error);
    throw new AppError("LOGOUT_ERROR", 500);
  }
};

export const logoutAll = async (userId: string) => {
  try {
    // Invalidate all sessions logic would go here
    return { message: "Logged out from all devices" };
  } catch (error) {
    console.error("Logout all error:", error);
    throw new AppError("LOGOUT_ALL_ERROR", 500);
  }
};

export const refreshToken = async (refreshTokenString: string) => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(
      refreshTokenString,
      config.jwtSecret,
    ) as AuthTokenPayload;

    // Validate token type
    if (decoded.type !== TokenType.REFRESH) {
      throw new AppError("INVALID_TOKEN_TYPE", 401);
    }

    // Find user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new AppError("USER_NOT_FOUND", 404);
    }

    // Generate new tokens
    const tokens = generateAuthTokens(user);

    return {
      message: "Token refreshed successfully",
      ...tokens,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error("Refresh token error:", error);
    throw new AppError("TOKEN_REFRESH_ERROR", 401);
  }
};

export const forgotPassword = async (email: string): Promise<any> => {
  const transaction = await sequelize.transaction();

  try {
    // Find user
    const user = await User.findOne({
      where: { email: { [Op.iLike]: email } },
      transaction,
      attributes: ["id", "email", "firstName"],
    });

    const response = {
      message: "If the user exists, a password reset email has been sent",
    };

    // Early return if user doesn't exist, but with success message for security
    if (!user) {
      await transaction.commit();
      return response;
    }

    // Check for rate limiting on OTP generation
    const recentAttempts = await OTP.count({
      where: {
        userId: user.id,
        purpose: "password_reset",
        createdAt: { [Op.gt]: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
      },
      transaction,
    });

    if (recentAttempts >= MAX_ATTEMPTS) {
      await transaction.commit();
      return response;
    }

    // Generate OTP using the class method
    const otpRecord = await OTP.createOTP(user.id, "password_reset", {
      expiresInMinutes: OTP_EXPIRY_MINUTES,
      metadata: { email: user.email },
      length: 6,
    });

    sendMail({
      to: user?.email,
      subject: "Forgot Password",
      html: `<h1>${otpRecord?.code}</h1>`,
    });

    console.log(`Password reset OTP for ${email}: ${otpRecord.code}`);

    await transaction.commit();
    return response;
  } catch (error) {
    await transaction.rollback();

    if (error instanceof AppError) throw error;

    console.error("Password reset error:", error);
    throw new AppError("PASSWORD_RESET_ERROR", 500);
  }
};

export const verifyOtp = async (email: string, otp: string): Promise<any> => {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findOne({
      where: { email: { [Op.iLike]: email } },
      transaction,
      attributes: ["id"],
    });

    if (!user) {
      await transaction.rollback();
      throw new AppError("INVALID_OTP", 400);
    }

    // Find valid OTP
    const otpRecord = await OTP.findOne({
      where: {
        userId: user.id,
        code: otp,
        purpose: "password_reset",
        expiresAt: { [Op.gt]: new Date() },
        used: false,
      },
      transaction,
      order: [["createdAt", "DESC"]],
    });

    if (!otpRecord) {
      await transaction.rollback();
      throw new AppError("INVALID_OTP", 400);
    }

    // Mark OTP as used
    await otpRecord.update(
      {
        used: true,
      },
      { transaction },
    );

    // Generate JWT for password reset
    const resetToken = jwt.sign(
      {
        sub: user.id,
        purpose: "password_reset",
        iat: Math.floor(Date.now() / 1000),
      },
      config.jwtSecret,
      { expiresIn: JWT_EXPIRY_MINUTES * 60 },
    );

    await transaction.commit();
    return { resetToken };
  } catch (error) {
    await transaction.rollback();

    if (error instanceof AppError) throw error;

    console.error("OTP verification error:", error);
    throw new AppError("OTP_VERIFICATION_ERROR", 500);
  }
};

export const resetPassword = async (
  resetToken: string,
  newPassword: string,
): Promise<any> => {
  const transaction = await sequelize.transaction();

  try {
    // Verify JWT token
    const payload = jwt.verify(resetToken, config.jwtSecret) as any;

    // Check token purpose
    if (payload.purpose !== "password_reset") {
      await transaction.rollback();
      throw new AppError("INVALID_TOKEN", 400);
    }

    // Find user
    const user = await User.findByPk(payload.sub, {
      transaction,
      attributes: ["id", "password"],
    });

    if (!user) {
      await transaction.rollback();
      throw new AppError("USER_NOT_FOUND", 404);
    }

    // Check if new password is same as old password
    const isSamePassword = await user.verifyPassword(newPassword);
    if (isSamePassword) {
      await transaction.rollback();
      throw new AppError("SAME_PASSWORD", 400);
    }

    // Update password - the model hooks will handle hashing
    await user.update({ password: newPassword }, { transaction });

    // Mark all existing password reset OTPs as used
    await OTP.update(
      { used: true },
      {
        where: {
          userId: user.id,
          purpose: "password_reset",
          used: false,
        },
        transaction,
      },
    );

    await transaction.commit();
    return { message: "Password updated successfully" };
  } catch (error) {
    await transaction.rollback();

    if (error instanceof AppError) throw error;

    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError("INVALID_TOKEN", 401);
    }

    console.error("Password reset error:", error);
    throw new AppError("PASSWORD_RESET_ERROR", 500);
  }
};

export const requestEmailVerification = async (
  userId: string,
): Promise<any> => {
  const transaction = await sequelize.transaction();

  try {
    // Find the user
    const user = await User.findByPk(userId, {
      transaction,
      attributes: ["id", "email", "firstName", "emailVerified"],
    });

    if (!user) {
      await transaction.rollback();
      throw new AppError("USER_NOT_FOUND", 404);
    }

    // If user is already verified, return early
    if (user.emailVerified) {
      await transaction.rollback();
      return { message: "Email is already verified" };
    }

    // Check for rate limiting
    const recentAttempts = await OTP.count({
      where: {
        userId: user.id,
        purpose: "email_verification",
        createdAt: { [Op.gt]: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
      },
      transaction,
    });

    if (recentAttempts >= MAX_ATTEMPTS) {
      await transaction.rollback();
      throw new AppError("RATE_LIMITED", 429);
    }

    // Generate new OTP
    const otpRecord = await OTP.createOTP(user.id, "email_verification", {
      expiresInMinutes: OTP_EXPIRY_MINUTES,
      metadata: { email: user.email },
    });

    console.log(`Email verification OTP for ${user.email}: ${otpRecord.code}`);

    await transaction.commit();
    return { message: "Verification code sent to your email" };
  } catch (error) {
    await transaction.rollback();

    if (error instanceof AppError) throw error;

    console.error("Email verification request error:", error);
    throw new AppError("EMAIL_VERIFICATION_ERROR", 500);
  }
};

export const verifyEmail = async (
  userId: string,
  code: string,
): Promise<any> => {
  const transaction = await sequelize.transaction();

  try {
    // Find the user
    const user = await User.findByPk(userId, {
      transaction,
      attributes: ["id", "emailVerified"],
    });

    if (!user) {
      await transaction.rollback();
      throw new AppError("USER_NOT_FOUND", 404);
    }

    // If already verified, return early
    if (user.emailVerified) {
      await transaction.rollback();
      return { message: "Email is already verified" };
    }

    // Verify the OTP
    const otpRecord = await OTP.findOne({
      where: {
        userId,
        code,
        purpose: "email_verification",
        expiresAt: { [Op.gt]: new Date() },
        used: false,
      },
      transaction,
    });

    if (!otpRecord) {
      await transaction.rollback();
      throw new AppError("INVALID_CODE", 400);
    }

    // Mark OTP as used
    await otpRecord.update({ used: true }, { transaction });

    // Update user's verification status
    await user.update({ emailVerified: true }, { transaction });

    await transaction.commit();
    return { message: "Email verified successfully" };
  } catch (error) {
    await transaction.rollback();

    if (error instanceof AppError) throw error;

    console.error("Email verification error:", error);
    throw new AppError("EMAIL_VERIFICATION_ERROR", 500);
  }
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<any> => {
  const transaction = await sequelize.transaction();

  try {
    // Find the user
    const user = await User.findByPk(userId, {
      transaction,
      attributes: ["id", "password"],
    });

    if (!user) {
      await transaction.rollback();
      throw new AppError("USER_NOT_FOUND", 404);
    }

    // Verify current password
    const isPasswordValid = await user.verifyPassword(currentPassword);
    if (!isPasswordValid) {
      await transaction.rollback();
      throw new AppError("INVALID_PASSWORD", 400);
    }

    // Check if new password is same as current
    const isSamePassword = await user.verifyPassword(newPassword);
    if (isSamePassword) {
      await transaction.rollback();
      throw new AppError("SAME_PASSWORD", 400);
    }

    // Update password
    await user.update({ password: newPassword }, { transaction });

    await transaction.commit();
    return { message: "Password changed successfully" };
  } catch (error) {
    await transaction.rollback();

    if (error instanceof AppError) throw error;

    console.error("Password change error:", error);
    throw new AppError("PASSWORD_CHANGE_ERROR", 500);
  }
};

export const verifyAuthToken = async (token: string): Promise<any> => {
  try {
    if (!token) {
      throw new AppError("NO_TOKEN", 401);
    }

    // Verify token with JWT
    const decoded = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;

    // Ensure it's an access token
    if (decoded.type !== TokenType.ACCESS) {
      throw new AppError("INVALID_TOKEN_TYPE", 401);
    }

    // Find user to return updated info
    const user = await User.findByPk(decoded.id, {
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "role",
        "credits",
        "emailVerified",
      ],
    });

    if (!user) {
      throw new AppError("USER_NOT_FOUND", 404);
    }

    return {
      message: "Token is valid",
      user,
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError("INVALID_TOKEN", 401);
    }

    if (error instanceof AppError) throw error;

    console.error("Token verification error:", error);
    throw new AppError("TOKEN_VERIFICATION_ERROR", 500);
  }
};

// Renaming for controller compatibility
export const verifyResetPasswordOTP = verifyOtp;
