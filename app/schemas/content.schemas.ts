import { z } from "zod";

/**
 * Create content schema
 */
export const createContent = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title cannot exceed 200 characters"),
    description: z
      .string()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional(),
    type: z.enum(["article", "video", "image", "audio", "document"], {
      errorMap: () => ({ message: "Invalid content type" }),
    }),
    contentType: z.enum(["text", "html", "markdown", "json"], {
      errorMap: () => ({ message: "Invalid media type" }),
    }),
    prompt: z
      .string()
      .min(1, "Prompt is required")
      .max(2000, "Prompt cannot exceed 2000 characters"),
    url: z.string().url("Invalid URL format"),
    thumbnailUrl: z.string().url("Invalid thumbnail URL format").optional(),
    status: z
      .enum(["pending", "published", "draft", "archived"], {
        errorMap: () => ({ message: "Invalid status" }),
      })
      .optional(),
    isPrivate: z.boolean().optional(),
    metaTitle: z
      .string()
      .max(60, "Meta title cannot exceed 60 characters")
      .optional(),
    metaDescription: z
      .string()
      .max(160, "Meta description cannot exceed 160 characters")
      .optional(),
    metaKeywords: z
      .string()
      .max(200, "Meta keywords cannot exceed 200 characters")
      .optional(),
    ogTitle: z
      .string()
      .max(60, "OG title cannot exceed 60 characters")
      .optional(),
    ogDescription: z
      .string()
      .max(160, "OG description cannot exceed 160 characters")
      .optional(),
    ogImage: z.string().url("Invalid OG image URL format").optional(),
  }),
});

/**
 * Generate content schema
 */
export const generateContent = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title cannot exceed 200 characters"),
    prompt: z
      .string()
      .min(1, "Prompt is required")
      .max(2000, "Prompt cannot exceed 2000 characters"),
    isPrivate: z.boolean().optional(),
  }),
});

/**
 * Update content schema (combined params and body validation)
 */
export const updateContent = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .max(200, "Title cannot exceed 200 characters")
      .optional(),
    description: z
      .string()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional(),
    type: z
      .enum(["article", "video", "image", "audio", "document"], {
        errorMap: () => ({ message: "Invalid content type" }),
      })
      .optional(),
    contentType: z
      .enum(["text", "html", "markdown", "json"], {
        errorMap: () => ({ message: "Invalid media type" }),
      })
      .optional(),
    prompt: z
      .string()
      .min(1, "Prompt cannot be empty")
      .max(2000, "Prompt cannot exceed 2000 characters")
      .optional(),
    url: z.string().url("Invalid URL format").optional(),
    thumbnailUrl: z.string().url("Invalid thumbnail URL format").optional(),
    status: z
      .enum(["pending", "published", "draft", "archived"], {
        errorMap: () => ({ message: "Invalid status" }),
      })
      .optional(),
    isPrivate: z.boolean().optional(),
    metaTitle: z
      .string()
      .max(60, "Meta title cannot exceed 60 characters")
      .optional(),
    metaDescription: z
      .string()
      .max(160, "Meta description cannot exceed 160 characters")
      .optional(),
    metaKeywords: z
      .string()
      .max(200, "Meta keywords cannot exceed 200 characters")
      .optional(),
    ogTitle: z
      .string()
      .max(60, "OG title cannot exceed 60 characters")
      .optional(),
    ogDescription: z
      .string()
      .max(160, "OG description cannot exceed 160 characters")
      .optional(),
    ogImage: z.string().url("Invalid OG image URL format").optional(),
  }),
});

/**
 * Get content by ID schema (params validation)
 */
export const getContentById = z.object({
  params: z.object({
    id: z.string(),
  }),
});

/**
 * Get all content schema (query parameters validation)
 */
export const getAllContent = z.object({
  query: z.object({
    type: z.enum(["article", "video", "image", "audio", "document"]).optional(),
    contentType: z.enum(["text", "html", "markdown", "json"]).optional(),
    status: z
      .enum(["pending", "published", "draft", "archived", "completed"])
      .optional(),
    isPrivate: z
      .string()
      .refine((val) => val === "true" || val === "false", {
        message: "isPrivate must be 'true' or 'false'",
      })
      .optional(),
    page: z
      .string()
      .refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, {
        message: "Page must be a positive number",
      })
      .optional(),
    pageSize: z
      .string()
      .refine(
        (val) =>
          !isNaN(parseInt(val)) && parseInt(val) > 0 && parseInt(val) <= 100,
        {
          message: "Page size must be a positive number and not exceed 100",
        },
      )
      .optional(),
    search: z
      .string()
      .max(100, "Search term cannot exceed 100 characters")
      .optional(),
    sortBy: z
      .enum([
        "id",
        "title",
        "description",
        "type",
        "contentType",
        "status",
        "isPrivate",
        "createdAt",
        "updatedAt",
      ])
      .optional(),
    sortOrder: z.enum(["ASC", "DESC"]).optional(),
  }),
});

/**
 * Delete content schema (params validation)
 */
export const deleteContent = z.object({
  params: z.object({
    id: z.string(),
  }),
});
