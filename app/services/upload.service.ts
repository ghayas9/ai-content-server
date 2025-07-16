import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import AppError from "../utils/app.error";
import config from "../config";

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY.CLOUDINARY_API_SECRET,
});

// Types
export interface UploadResult {
  public_id: string;
  url: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  created_at: string;
}

// Allowed image formats
const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "gif", "webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Convert buffer to stream
 */
const bufferToStream = (buffer: Buffer): Readable => {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
};

/**
 * Upload image to Cloudinary
 */
export const uploadImage = async (
  buffer: Buffer,
  filename: string,
  folder: string = "uploads",
): Promise<UploadResult> => {
  try {
    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      throw new AppError("File size too large. Maximum size is 10MB", 400);
    }

    // Validate file format
    const fileExtension = filename.split(".").pop()?.toLowerCase();
    if (!fileExtension || !ALLOWED_FORMATS.includes(fileExtension)) {
      throw new AppError(
        `Invalid file format. Allowed formats: ${ALLOWED_FORMATS.join(", ")}`,
        400,
      );
    }

    // Upload options
    const uploadOptions = {
      folder,
      resource_type: "image" as const,
      quality: "auto:good",
      format: "auto",
      unique_filename: true,
      overwrite: false,
    };

    // Convert buffer to stream and upload
    const stream = bufferToStream(buffer);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(new AppError(`Upload failed: ${error.message}`, 500));
          } else if (result) {
            resolve({
              public_id: result.public_id,
              url: result.url,
              secure_url: result.secure_url,
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes,
              created_at: result.created_at,
            });
          } else {
            reject(new AppError("Upload failed: No result returned", 500));
          }
        },
      );

      stream.pipe(uploadStream);
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Upload service error:", error);
    throw new AppError("Image upload failed", 500);
  }
};
