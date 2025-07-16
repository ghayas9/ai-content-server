import { v4 as uuidv4 } from "uuid";
import { AI_BASE_URL } from "../config";
import AppError from "../utils/app.error";
import axios from "axios";
import { uploadBufferToStorage } from "../utils/storage";

const axiosInstance = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 300000, // 5 minutes timeout for 3D generation
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const GenerateImageWithAI = async ({
  prompt,
}: {
  prompt: string;
}): Promise<string> => {
  try {
    // Start timer for API response measurement
    const startTime = performance.now();

    // Generate image with AI
    const response = await axiosInstance({
      method: "POST",
      url: "/image/generate",
      data: { prompt },
    });

    // End timer and calculate response time
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    console.log(
      `AI image generation API response time: ${responseTime.toFixed(2)}ms`,
      `AI image generation API response time: ${(responseTime / 1000).toFixed(2)} sec`,
    );

    // Extract the image URL from the response
    const imageUrl = response.data?.data?.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error("No image URL returned from AI service");
    }

    // Fetch the image from the URL
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 30000, // 30 seconds for image download
    });

    // Convert arraybuffer to buffer
    const imageBuffer = Buffer.from(imageResponse.data);

    // Get content type from response headers or default to webp
    const contentType = imageResponse.headers["content-type"] || "image/webp";
    const fileExtension = contentType.split("/")[1] || "webp";
    const fileName = `ai-generated-${uuidv4()}.${fileExtension}`;

    // Upload to Cloudinary using your existing storage service
    const uploadedUrl = await uploadBufferToStorage(
      imageBuffer,
      fileName,
      "generated",
    );

    return uploadedUrl;
  } catch (error) {
    console.error("Error generating and uploading image:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Failed to generate", 500);
  }
};

export const analyzeImageWithCLIP = async ({
  blob,
  categories,
}: {
  blob: Blob;
  categories: string[];
}): Promise<{ name: string; score: number }> => {
  try {
    // Convert blob to base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        try {
          // Get the base64 string by removing the data URL prefix
          const result = reader.result?.toString();
          if (!result) {
            reject(new Error("Failed to read file"));
            return;
          }
          const base64 = result.split(",")[1] || "";
          resolve(base64);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
    });

    reader.readAsDataURL(blob);
    const imageBase64 = await base64Promise;

    // Validate categories
    if (!categories || categories.length === 0) {
      throw new Error("Categories array cannot be empty");
    }

    // Create the parameters object with the categories
    const parameters = {
      candidate_labels: categories.join(", "),
    };

    // Make the request to the CLIP model API
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/openai/clip-vit-base-patch32",
      {
        headers: {
          // Authorization: `Bearer ${config.app.HUGGINGFACE_API_KEY || ""}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          image: imageBase64,
          parameters: parameters,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `CLIP API returned error: ${response.status} - ${errorText}`,
      );
    }

    // Parse the response
    const results = await response.json();

    // Validate results
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error("No analysis results returned from CLIP API");
    }

    // Find the match with highest score
    let bestMatch = { name: "", score: 0 };

    for (const result of results) {
      if (result.score > bestMatch.score) {
        bestMatch = {
          name: result.label.trim(),
          score: result.score,
        };
      }
    }

    // Validate that we found a match
    if (!bestMatch.name) {
      throw new Error("No valid classification found");
    }

    return bestMatch;
  } catch (error) {
    console.error("CLIP image analysis error:", error);

    if (error instanceof Error) {
      throw new AppError(`Failed to analyze image: ${error.message}`, 500);
    }

    throw new AppError("Failed to analyze image: Unknown error", 500);
  }
};
