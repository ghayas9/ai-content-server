import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { AppError } from "./app.error";
import config from "../config";
import logger from "../config/logger";

// Configure Cloudinary with credentials
cloudinary.config({
  cloud_name: config.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY.CLOUDINARY_API_SECRET,
});

/**
 * Storage interface for file operations
 */
export interface StorageInterface {
  uploadBuffer(
    buffer: Buffer,
    filename: string,
    folder?: string,
  ): Promise<string>;
  uploadFile(filePath: string, folder?: string): Promise<string>;
  uploadStream(stream: Readable, options?: any): Promise<string>;
  deleteFile(publicId: string): Promise<boolean>;
  getUrl(publicId: string): string;
}

/**
 * Supported file types and their corresponding Cloudinary resource types
 */
export enum FileType {
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "raw",
  RAW = "raw",
}

/**
 * Determine resource type based on file extension
 * @param filename File name with extension
 * @returns Appropriate resource type
 */
const getResourceType = (filename: string): FileType => {
  const extension = filename.split(".").pop()?.toLowerCase() || "";

  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  const videoExtensions = ["mp4", "mov", "avi", "webm", "mkv"];
  const audioExtensions = ["mp3", "wav", "ogg", "flac", "m4a"];

  if (imageExtensions.includes(extension)) return FileType.IMAGE;
  if (videoExtensions.includes(extension)) return FileType.VIDEO;
  if (audioExtensions.includes(extension)) return FileType.AUDIO;

  return FileType.RAW;
};

/**
 * Upload a file buffer to cloud storage
 * @param buffer File buffer
 * @param filename Original filename
 * @param folder Optional folder path
 * @returns Public URL of the uploaded file
 */
export const uploadBufferToStorage = async (
  buffer: Buffer,
  filename: string,
  folder: string = "uploads",
): Promise<string> => {
  try {
    // Convert buffer to base64
    const base64Data = buffer.toString("base64");
    const resourceType = getResourceType(filename);

    // Create data URI
    const fileUri = `data:${
      resourceType === FileType.IMAGE
        ? "image"
        : resourceType === FileType.VIDEO
          ? "video"
          : "application"
    }/${filename.split(".").pop()};base64,${base64Data}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileUri, {
      resource_type: resourceType,
      folder,
      public_id: filename.split(".")[0],
    });

    logger.info(`File uploaded to Cloudinary: ${result.public_id}`);
    return result.secure_url;
  } catch (error) {
    logger.error(`File upload error: ${error}`);
    throw new AppError("File upload failed", 500);
  }
};

/**
 * Upload a file from a local path to cloud storage
 * @param filePath Local file path
 * @param folder Optional folder path
 * @returns Public URL of the uploaded file
 */
export const uploadFileToStorage = async (
  filePath: string,
  folder: string = "uploads",
): Promise<string> => {
  try {
    const filename = filePath.split("/").pop() || "";
    const resourceType = getResourceType(filename);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: resourceType,
      folder,
      public_id: filename.split(".")[0],
    });

    logger.info(`File uploaded to Cloudinary: ${result.public_id}`);
    return result.secure_url;
  } catch (error) {
    logger.error(`File upload error: ${error}`);
    throw new AppError("File upload failed", 500);
  }
};

/**
 * Delete a file from cloud storage
 * @param publicId Cloudinary public ID
 * @returns Boolean indicating success
 */
export const deleteFileFromStorage = async (
  publicId: string,
): Promise<boolean> => {
  try {
    // Extract public ID from URL if full URL is provided
    if (publicId.includes("cloudinary.com")) {
      const parts = publicId.split("/");
      const filename = parts[parts.length - 1];
      publicId = filename.split(".")[0];
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    logger.error(`File deletion error: ${error}`);
    return false;
  }
};

/**
 * Upload a stream to cloud storage
 * @param stream Readable stream
 * @param options Upload options
 * @returns Promise resolving to the public URL
 */
export const uploadStreamToStorage = (
  stream: Readable,
  options: {
    folder?: string;
    resourceType?: FileType;
    filename?: string;
  } = {},
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "uploads",
        resource_type: options.resourceType || "auto",
        public_id: options.filename
          ? options.filename.split(".")[0]
          : undefined,
      },
      (error, result) => {
        if (error) {
          logger.error(`Stream upload error: ${error}`);
          return reject(new AppError("Stream upload failed", 500));
        }
        resolve(result!.secure_url);
      },
    );

    stream.pipe(uploadStream);
  });
};

/**
 * Get a public URL for a Cloudinary resource
 * @param publicId Cloudinary public ID
 * @param options Additional options
 * @returns Public URL
 */
export const getPublicUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    format?: string;
  } = {},
): string => {
  return cloudinary.url(publicId, {
    secure: true,
    width: options.width,
    height: options.height,
    crop: options.crop,
    format: options.format,
  });
};

// Export all functions as a unified storage interface
export default {
  uploadBuffer: uploadBufferToStorage,
  uploadFile: uploadFileToStorage,
  uploadStream: uploadStreamToStorage,
  deleteFile: deleteFileFromStorage,
  getUrl: getPublicUrl,
};
