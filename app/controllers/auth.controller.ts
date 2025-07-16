import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { catchAsync } from "../utils/catch-async";
import { HTTP } from "../types/status-codes";

export const register = catchAsync(async (req: Request, res: Response) => {
  const data = await authService.register(req.body);
  res.status(HTTP.SUCCESS.CREATED).json(data);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const data = await authService.login(req.body);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.body;
  const data = await authService.logout(token);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const logoutAll = catchAsync(async (req: Request, res: Response) => {
  const data = await authService.logoutAll(req.payload.id);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const data = await authService.refreshToken(refreshToken);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const requestPasswordReset = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    const data = await authService.forgotPassword(email);
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const verifyResetPasswordOTP = catchAsync(
  async (req: Request, res: Response) => {
    const { email, code } = req.body;
    const data = await authService.verifyOtp(email, code);
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const { idToken } = req.body;
  const data = await authService.googleLogin(idToken);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const facebookLogin = catchAsync(async (req: Request, res: Response) => {
  const { accessToken } = req.body;
  const data = await authService.facebookLogin(accessToken);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { resetToken, newPassword } = req.body;
  const data = await authService.resetPassword(resetToken, newPassword);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const requestEmailVerification = catchAsync(
  async (req: Request, res: Response) => {
    const data = await authService.requestEmailVerification(req.payload.id);
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const userId = req.payload.id;
  const { code } = req.body;
  const data = await authService.verifyEmail(userId, code);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const changePassword = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.payload.id;
    const { currentPassword, newPassword } = req.body;
    const data = await authService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const verifyAuthToken = catchAsync(
  async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(" ")[1] || "";
    const data = await authService.verifyAuthToken(token);
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

// Extend Express Request interface to include user payload
declare global {
  namespace Express {
    interface Request {
      token: string;
      payload: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}
