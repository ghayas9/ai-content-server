import { z } from "zod";

/**
 * Get all content schema
 */
export const getAllContent = z.object({
  query: z.object({
    type: z.enum(["generated", "upload"]).optional(),
    contentType: z.enum(["image", "video", "audio"]).optional(),
    status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
    isPrivate: z
      .string()
      .refine((val) => val === "true" || val === "false", {
        message: "isPrivate must be 'true' or 'false'",
      })
      .optional(),
    userId: z.string().min(1, "User ID cannot be empty").optional(),
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
        "type",
        "contentType",
        "status",
        "isPrivate",
        "createdAt",
        "updatedAt",
      ])
      .optional(),
    sortOrder: z.enum(["ASC", "DESC"]).optional(),
    dateFrom: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format for dateFrom",
      })
      .optional(),
    dateTo: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format for dateTo",
      })
      .optional(),
    includeDeleted: z
      .string()
      .refine((val) => val === "true" || val === "false", {
        message: "includeDeleted must be 'true' or 'false'",
      })
      .optional(),
  }),
});

/**
 * Get content by ID schema
 */
export const getContentById = z.object({
  params: z.object({
    id: z.string().min(1, "Content ID is required"),
  }),
  query: z.object({
    includeDeleted: z
      .string()
      .refine((val) => val === "true" || val === "false", {
        message: "includeDeleted must be 'true' or 'false'",
      })
      .optional(),
  }),
});

/**
 * Update content schema
 */
export const updateContent = z.object({
  params: z.object({
    id: z.string().min(1, "Content ID is required"),
  }),
  body: z.object({
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .max(255, "Title cannot exceed 255 characters")
      .optional(),
    description: z
      .string()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional(),
    type: z.enum(["generated", "upload"]).optional(),
    contentType: z.enum(["image", "video", "audio"]).optional(),
    prompt: z
      .string()
      .max(2000, "Prompt cannot exceed 2000 characters")
      .optional(),
    url: z.string().url("Invalid URL format").optional(),
    thumbnailUrl: z.string().url("Invalid thumbnail URL format").optional(),
    status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
    isPrivate: z.boolean().optional(),
    metaTitle: z
      .string()
      .max(255, "Meta title cannot exceed 255 characters")
      .optional(),
    metaDescription: z
      .string()
      .max(500, "Meta description cannot exceed 500 characters")
      .optional(),
    metaKeywords: z
      .string()
      .max(255, "Meta keywords cannot exceed 255 characters")
      .optional(),
    ogTitle: z
      .string()
      .max(255, "OG title cannot exceed 255 characters")
      .optional(),
    ogDescription: z
      .string()
      .max(500, "OG description cannot exceed 500 characters")
      .optional(),
    ogImage: z.string().url("Invalid OG image URL format").optional(),
  }),
});

/**
 * Delete content schema
 */
export const deleteContent = z.object({
  params: z.object({
    id: z.string().min(1, "Content ID is required"),
  }),
});

/**
 * Restore content schema
 */
export const restoreContent = z.object({
  params: z.object({
    id: z.string().min(1, "Content ID is required"),
  }),
});

/**
 * Permanently delete content schema
 */
export const permanentlyDeleteContent = z.object({
  params: z.object({
    id: z.string().min(1, "Content ID is required"),
  }),
});

/**
 * Bulk delete content schema
 */
export const bulkDeleteContent = z.object({
  body: z.object({
    ids: z
      .array(z.string().min(1, "Content ID cannot be empty"))
      .min(1, "At least one content ID is required")
      .max(100, "Cannot delete more than 100 content items at once"),
    hardDelete: z.boolean().optional(),
  }),
});

/**
 * Bulk restore content schema
 */
export const bulkRestoreContent = z.object({
  body: z.object({
    ids: z
      .array(z.string().min(1, "Content ID cannot be empty"))
      .min(1, "At least one content ID is required")
      .max(100, "Cannot restore more than 100 content items at once"),
  }),
});

/**
 * Bulk update content status schema
 */
export const bulkUpdateContentStatus = z.object({
  body: z.object({
    ids: z
      .array(z.string().min(1, "Content ID cannot be empty"))
      .min(1, "At least one content ID is required")
      .max(100, "Cannot update more than 100 content items at once"),
    status: z.enum(["pending", "processing", "completed", "failed"], {
      errorMap: () => ({
        message:
          "Status must be 'pending', 'processing', 'completed', or 'failed'",
      }),
    }),
  }),
});

/**
 * Get content statistics schema
 */
export const getContentStats = z.object({
  query: z.object({
    period: z
      .enum(["today", "weekly", "monthly", "yearly", "custom"])
      .optional(),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format for startDate",
      })
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format for endDate",
      })
      .optional(),
  }),
});

/**
 * Export content schema
 */
export const exportContent = z.object({
  query: z.object({
    format: z.enum(["json", "csv"]).optional(),
    type: z.enum(["generated", "upload"]).optional(),
    contentType: z.enum(["image", "video", "audio"]).optional(),
    status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
    isPrivate: z
      .string()
      .refine((val) => val === "true" || val === "false", {
        message: "isPrivate must be 'true' or 'false'",
      })
      .optional(),
    userId: z.string().min(1, "User ID cannot be empty").optional(),
    search: z
      .string()
      .max(100, "Search term cannot exceed 100 characters")
      .optional(),
    dateFrom: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format for dateFrom",
      })
      .optional(),
    dateTo: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format for dateTo",
      })
      .optional(),
    includeDeleted: z
      .string()
      .refine((val) => val === "true" || val === "false", {
        message: "includeDeleted must be 'true' or 'false'",
      })
      .optional(),
    includeAnalytics: z
      .string()
      .refine((val) => val === "true" || val === "false", {
        message: "includeAnalytics must be 'true' or 'false'",
      })
      .optional(),
  }),
});
