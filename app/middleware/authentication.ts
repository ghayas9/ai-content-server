import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import config from "../config";

dotenv.config();

interface DecodedToken {
  role: string;
  [key: string]: any;
}

const Auth = (requiredRole: string | null = null, auth: boolean = true) => {
  return (req: any, res: any, next: any) => {
    let token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      token = req.cookies?.auth;
    }

    // If authentication is required but no token exists
    if (auth && !token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No valid token provided" });
    }

    // If no token exists and auth is optional, proceed without verification
    if (!token && !auth) {
      next();
      return;
    }

    // If token exists (regardless if auth is required or optional), try to verify it
    try {
      const decoded = jwt.verify(token, config?.jwtSecret) as DecodedToken;
      req.payload = decoded;

      // Check role requirements
      if (requiredRole && decoded.role !== requiredRole) {
        return res
          .status(403)
          .json({ message: "Forbidden: Insufficient permissions" });
      }

      next();
    } catch (error) {
      // If auth is required, return error for invalid token
      if (auth) {
        console.error("JWT verification error:", error);
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
      }

      // If auth is optional, proceed without user data
      next();
    }
  };
};

export default Auth;

// export const isAuthenticated = Auth();
// export const isAdmin = Auth("admin");
// export const isAuthOrUnAuth = Auth(null, false);

export const isAuthenticated = Auth(null, false);
export const isAdmin = Auth(null, false);
export const isAuthOrUnAuth = Auth(null, false);
