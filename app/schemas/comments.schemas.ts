import { z } from "zod";

/**
 * Create comment schema
 */
export const createComment = z.object({
  body: z.object({
    contentId: z.string().uuid("Invalid content ID format"),
    text: z
      .string()
      .min(1, "Comment text is required")
      .max(10000, "Comment text cannot exceed 10,000 characters"),
    parentId: z.string().uuid("Invalid parent comment ID format").optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

/**
 * Get comments for content schema
 */
export const getCommentsForContent = z.object({
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
    includePinned: z
      .string()
      .refine((val) => val === "true" || val === "false", {
        message: "includePinned must be 'true' or 'false'",
      })
      .optional(),
    includeReplies: z
      .string()
      .refine((val) => val === "true" || val === "false", {
        message: "includeReplies must be 'true' or 'false'",
      })
      .optional(),
  }),
});

/**
 * Get comment by ID schema
 */
export const getCommentById = z.object({
  params: z.object({
    id: z.string().uuid("Invalid comment ID format"),
  }),
});

/**
 * Update comment schema
 */
export const updateComment = z.object({
  params: z.object({
    id: z.string().uuid("Invalid comment ID format"),
  }),
  body: z.object({
    text: z
      .string()
      .min(1, "Comment text cannot be empty")
      .max(10000, "Comment text cannot exceed 10,000 characters")
      .optional(),
    status: z.enum(["active", "hidden", "reported", "deleted"]).optional(),
    isPinned: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

/**
 * Delete comment schema
 */
export const deleteComment = z.object({
  params: z.object({
    id: z.string().uuid("Invalid comment ID format"),
  }),
});

/**
 * Get replies schema
 */
export const getReplies = z.object({
  params: z.object({
    commentId: z.string().uuid("Invalid comment ID format"),
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
 * Get user comments schema
 */
export const getUserComments = z.object({
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
 * Get my comments schema
 */
export const getMyComments = z.object({
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
 * Toggle pin comment schema
 */
export const togglePinComment = z.object({
  params: z.object({
    id: z.string().uuid("Invalid comment ID format"),
  }),
  body: z.object({
    isPinned: z.boolean(),
  }),
});

/**
 * Report comment schema
 */
export const reportComment = z.object({
  params: z.object({
    id: z.string().uuid("Invalid comment ID format"),
  }),
});

/**
 * Get reported comments schema
 */
export const getReportedComments = z.object({
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
 * Moderate comment schema
 */
export const moderateComment = z.object({
  params: z.object({
    id: z.string().uuid("Invalid comment ID format"),
  }),
  body: z.object({
    action: z.enum(["approve", "hide", "delete"], {
      errorMap: () => ({ message: "Invalid moderation action" }),
    }),
  }),
});

/**
 * Search comments schema
 */
export const searchComments = z.object({
  query: z.object({
    query: z
      .string()
      .min(1, "Search query is required")
      .max(100, "Search query cannot exceed 100 characters"),
    contentId: z.string().uuid("Invalid content ID format").optional(),
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
 * Get top commented content schema
 */
export const getTopCommentedContent = z.object({
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
 * Get comment analytics schema
 */
export const getCommentAnalytics = z.object({
  query: z.object({
    contentId: z.string().uuid("Invalid content ID format").optional(),
  }),
});
