import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app.error";

const NotFound = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith("/api/")) {
    throw new AppError("API endpoint not found", 404);
  }

  throw new AppError("Route not found", 404);
};

export default NotFound;
