import jwt from "jsonwebtoken";
import config from "../config";

export const generateToken = (user: any): string => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config?.jwtSecret,
    { expiresIn: "360d" },
  );
};
