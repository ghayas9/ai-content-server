import { z } from "zod";

/**
 * Toggle like schema
 */
export const toggleLike = z.object({
  body: z.object({
    contentId: z.string().uuid("Invalid content ID format"),
  }),
});

/**
 * Check if user liked content schema
 */
export const hasUserLiked = z.object({
  params: z.object({
    contentId: z.string().uuid("Invalid content ID format"),
  }),
});

/**
 * Get like count schema
 */
export const getLikeCount = z.object({
  params: z.object({
    contentId: z.string().uuid("Invalid content ID format"),
  }),
});

/**
 * Get users who liked content schema
 */
export const getUsersWhoLiked = z.object({
  params: z.object({
    contentId: z.string().uuid("Invalid content ID format"),
  }),
  query: z.object({
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
  }),
});

/**
 * Get content liked by user schema
 */
export const getContentLikedByUser = z.object({
  params: z.object({
    userId: z.string().min(1, "User ID is required"),
  }),
  query: z.object({
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
  }),
});

/**
 * Get my liked content schema
 */
export const getMyLikedContent = z.object({
  query: z.object({
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
  }),
});

/**
 * Get top liked content schema
 */
export const getTopLikedContent = z.object({
  query: z.object({
    limit: z
      .string()
      .refine(
        (val) =>
          !isNaN(parseInt(val)) && parseInt(val) > 0 && parseInt(val) <= 100,
        {
          message: "Limit must be a positive number and not exceed 100",
        },
      )
      .optional(),
    timeframe: z.enum(["day", "week", "month"]).optional(),
  }),
});

/**
 * Get like analytics schema
 */
export const getLikeAnalytics = z.object({
  params: z.object({
    contentId: z.string().uuid("Invalid content ID format"),
  }),
});

/**
 * Get user like history schema
 */
export const getUserLikeHistory = z.object({
  params: z.object({
    userId: z.string().min(1, "User ID is required"),
  }),
  query: z.object({
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
    sortBy: z.enum(["createdAt", "updatedAt"]).optional(),
    sortOrder: z.enum(["ASC", "DESC"]).optional(),
  }),
});

/**
 * Get my like history schema
 */
export const getMyLikeHistory = z.object({
  query: z.object({
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
    sortBy: z.enum(["createdAt", "updatedAt"]).optional(),
    sortOrder: z.enum(["ASC", "DESC"]).optional(),
  }),
});

/**
 * Remove like schema
 */
export const removeLike = z.object({
  params: z.object({
    contentId: z.string().uuid("Invalid content ID format"),
  }),
});
