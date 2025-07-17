import dotenv from "dotenv";
dotenv.config();

type Dialect = "mysql" | "postgres" | "sqlite" | "mariadb" | "mssql";

interface Config {
  environment: "development" | "production" | "test";
  baseUrl: string;
  PORT: number;
  app: {
    frontendUrl: string;
  };
  db: {
    host: string;
    port: number;
    username: string;
    name: string;
    password: string;
    dialect: Dialect;
  };
  mail: {
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_USER: string;
    SMTP_PASS: string;
    FROM_EMAIL: string;
  };
  CLOUDINARY: {
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
  };

  jwtSecret: string;
  logging: boolean;
}

export const config: Config = {
  environment: "production",
  // environment: (process.env.NODE_ENV as any) || "development",
  baseUrl: process.env.API_URL || "http://localhost:4000",
  PORT: parseInt(process.env.PORT || "4000"),
  app: {
    frontendUrl: "http://localhost:3000",
  },
  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    name: process.env.DB_NAME || "ghayas",
    password: process.env.DB_PASSWORD || "ghayas",
    dialect: "postgres",
  },
  mail: {
    SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
    SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
    SMTP_USER: process.env.SMTP_USER || "ghayas.twalameals@gmail.com",
    SMTP_PASS: process.env.SMTP_PASS || "gwke slpb qqgn cdfa",
    FROM_EMAIL: process.env.FROM_EMAIL || "ghayas.twalameals@gmail.com",
  },
  CLOUDINARY: {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  },
  jwtSecret: process.env.JWT_SECRET || "JWT_SECRET",
  logging: process.env.LOGGING === "true",
};

export default config;

// export const AI_BASE_URL = "http://localhost:8000";
export const AI_BASE_URL = "https://all-ai-tools-api.vercel.app";
