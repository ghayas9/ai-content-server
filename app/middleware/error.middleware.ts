import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app.error";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let { statusCode, message } = err as AppError;

  if (!(err instanceof AppError)) {
    statusCode = 500;
    message = "Internal Server Error";
  }

  console.error(`[ERROR] ${req.method} ${req.originalUrl} - ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    // ...data,
  });
};
