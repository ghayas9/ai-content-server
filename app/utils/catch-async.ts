import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

/**
 * Higher-order function to wrap async route handlers and catch errors
 * @param fn Async controller function
 * @returns Express middleware function with error handling
 */
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((err) => {
      logger.error(
        `Error in request: ${req.method} ${req.path} - ${err.message}`,
      );
      next(err);
    });
  };
};

export default catchAsync;
