import axios from "axios";
import config from "../config";
import { uploadBufferToStorage } from "./storage";
import { v4 as uuidv4 } from "uuid";
import Together from "together-ai";
import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(config.app.HUGGINGFACE_API_KEY);

async function ClaudeAI(prompt: string) {
  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        system:
          "You are a skilled SVG designer. Convert text descriptions into detailed SVG specifications. Return JSON with elements array, colors, style information, and layout details.",
        messages: [
          {
            role: "user",
            content: `Create an SVG based on this description: ${prompt}`,
          },
        ],
        response_format: { type: "json_object" },
      },
      {
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      },
    );

    return JSON.parse(response.data.content[0].text);
  } catch (error) {
    throw new Error("Failed to get AI-generated SVG instructions");
  }
}

export const DeepSeekAI = async (prompt: string): Promise<string> => {
  try {
    const response = await axios.post<{
      choices: Array<{ message: { content: string } }>;
    }>(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "You are an SVG path specialist. Create outline-only SVGs using raw path data. Follow these rules:\n" +
              "1. Use ONLY <path> elements with 'd' attribute\n" +
              "2. No fill/stroke attributes or styles\n" +
              "3. No colors or gradients\n" +
              "4. Clean mathematical coordinates\n" +
              "5. Output raw SVG XML without explanations\n" +
              "6. Ensure proper viewBox and aspect ratio",
          },
          {
            role: "user",
            content: `Create outline SVG paths for: ${prompt}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 4000,
      },
      {
        headers: {
          Authorization: `Bearer ${config.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log(response.data);

    const rawSVG = response.data?.choices?.[0]?.message?.content?.trim() || "";

    // Validate SVG structure
    if (!rawSVG.includes("<svg") || !rawSVG.includes("</svg>")) {
      throw new Error("Invalid SVG format in response");
    }

    // Clean any markdown formatting
    const cleanSVG = rawSVG
      .replace(/```svg/g, "")
      .replace(/```/g, "")
      .trim();

    return cleanSVG;
  } catch (error) {
    console.error("SVG generation error:", error);
    throw new Error(
      `Failed to generate SVG: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export const TogetherAI = async (
  prompt: string,
  name: string,
): Promise<string[]> => {
  try {
    // Initialize Together AI client with timeout
    const together = new Together({
      apiKey: config.app.TOGETHER_API_KEY,
      timeout: 600000, // 10 minutes in milliseconds
    });

    // Generate multiple logo images
    const response = await together.images.create({
      model: "black-forest-labs/FLUX.1-dev",
      prompt: `Create a logo for ${name}: ${prompt}`,
      steps: 28,
      n: 4,
      width: 1024,
      height: 768,
    });

    // Process all images and upload to Cloudinary
    const cloudinaryUrls = await Promise.all(
      response.data.map(async (img: any, index: number) => {
        try {
          // Download the image from Together AI
          const imageResponse = await axios.get(img.url, {
            responseType: "arraybuffer",
          });

          // Extract image buffer from response
          const imageBuffer = Buffer.from(imageResponse.data, "binary");

          // Generate a unique filename
          const fileName = `${uuidv4()}.jpg`;

          // Upload to Cloudinary
          const cloudinaryUrl = await uploadBufferToStorage(
            imageBuffer,
            fileName,
            "ai-logos", // Cloudinary folder
          );

          return cloudinaryUrl;
        } catch (error) {
          console.error(`Error processing image ${index}:`, error);
          return ""; // Return empty string on error to keep array structure
        }
      }),
    );

    // Filter out any empty strings from failed uploads
    const validUrls = cloudinaryUrls.filter((url) => url !== "");

    if (validUrls.length === 0) {
      throw new Error("Failed to process any generated logos");
    }

    return validUrls;
  } catch (error) {
    console.error("Image generation error:", error);
    throw new Error(
      `Failed to generate images: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export const generateLogoWithHuggingFace = async (
  prompt: string,
  name: string,
): Promise<string> => {
  try {
    // Create a final prompt that includes both business name and description
    const finalPrompt = `Create a logo for ${name}: ${prompt}`;

    // Generate the image
    const image = await client.textToImage({
      provider: "hf-inference",
      model: "artificialguybr/LogoRedmond-LogoLoraForSDXL",
      inputs: finalPrompt,
      parameters: {
        num_inference_steps: 28,
        guidance_scale: 7.5,
        negative_prompt:
          "ugly, blurry, poor quality, deformed, multicolor, many colors",
      },
    });

    // Convert the Blob to a Buffer
    const arrayBuffer = await image.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Generate a unique filename
    const fileName = `${uuidv4()}.jpg`;

    // Upload to Cloudinary
    const cloudinaryUrl = await uploadBufferToStorage(
      imageBuffer,
      fileName,
      "ai-logos", // Cloudinary folder
    );

    return cloudinaryUrl;
  } catch (error) {
    console.error("HuggingFace image generation error:", error);
    throw new Error(
      `Failed to generate logo: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

const API_URL = "https://bbd9-35-185-14-108.ngrok-free.app";

export const TextToMusic = async (
  prompt: string,
  options?: Partial<MusicGenerationRequest>,
): Promise<MusicGenerationResponse> => {
  try {
    const payload: MusicGenerationRequest = {
      prompt,
      duration_minutes: options?.duration_minutes || 0.5,
      model_size: options?.model_size || "medium",
      guidance_scale: options?.guidance_scale || 3.0,
      seed: options?.seed,
      variation_amount: options?.variation_amount || 0.3,
    };

    console.log("generating ......");

    const response = await axios.post<MusicGenerationResponse>(
      `${API_URL}/generate-music/`,
      payload,
      {
        timeout: 6000000,
      },
    );

    if (!response.data.output_path) {
      throw new Error("Invalid response format from API");
    }

    // Construct download URL
    const filename = response.data.output_path.split("/").pop() || "";
    const download_url = `${API_URL}/download-music/${filename}`;

    const output = {
      ...response.data,
      download_url,
    };

    console.log(output, "ttt");
    return output;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `API request failed: ${error.response?.data?.detail || error.message}`,
      );
    }
    throw new Error(
      `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

interface MusicGenerationRequest {
  prompt: string;
  duration_minutes?: number;
  model_size?: "small" | "medium" | "large" | "melody";
  guidance_scale?: number;
  seed?: number;
  variation_amount?: number;
}

interface MusicGenerationResponse {
  output_path: string;
  generation_info: {
    duration: string;
    generation_time: string;
    base_prompt: string;
    model: string;
    segments_created: number;
    master_seed: number;
  };
  download_url: string;
}
