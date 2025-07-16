import { z } from "zod";

/**
 * Record view schema
 */
export const recordView = z.object({
  params: z.object({
    contentId: z.string().uuid("Invalid content ID format"),
  }),
  body: z.object({
    browserName: z
      .string()
      .max(100, "Browser name cannot exceed 100 characters")
      .optional(),
    browserVersion: z
      .string()
      .max(50, "Browser version cannot exceed 50 characters")
      .optional(),
    deviceType: z.enum(["desktop", "mobile", "tablet", "unknown"]).optional(),
    deviceBrand: z
      .string()
      .max(100, "Device brand cannot exceed 100 characters")
      .optional(),
    deviceModel: z
      .string()
      .max(100, "Device model cannot exceed 100 characters")
      .optional(),
    osName: z
      .string()
      .max(100, "OS name cannot exceed 100 characters")
      .optional(),
    osVersion: z
      .string()
      .max(50, "OS version cannot exceed 50 characters")
      .optional(),
    screenResolution: z
      .string()
      .max(20, "Screen resolution cannot exceed 20 characters")
      .optional(),
    country: z
      .string()
      .max(100, "Country cannot exceed 100 characters")
      .optional(),
    city: z.string().max(100, "City cannot exceed 100 characters").optional(),
    userAgent: z
      .string()
      .max(2000, "User agent cannot exceed 2000 characters")
      .optional(),
    referrer: z
      .string()
      .max(2000, "Referrer cannot exceed 2000 characters")
      .optional(),
  }),
});

/**
 * Get view count schema
 */
export const getViewCount = z.object({
  params: z.object({
    contentId: z.string().uuid("Invalid content ID format"),
  }),
});

/**
 * Get content analytics schema
 */
export const getContentAnalytics = z.object({
  params: z.object({
    contentId: z.string().uuid("Invalid content ID format"),
  }),
});

/**
 * Get top viewed content schema
 */
export const getTopViewedContent = z.object({
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
 * Get views by date range schema
 */
export const getViewsByDateRange = z.object({
  params: z.object({
    contentId: z.string().uuid("Invalid content ID format"),
  }),
  query: z.object({
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid start date format",
    }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid end date format",
    }),
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
 * Get views with filters schema
 */
export const getViews = z.object({
  query: z.object({
    contentId: z.string().uuid("Invalid content ID format").optional(),
    deviceType: z.enum(["desktop", "mobile", "tablet", "unknown"]).optional(),
    country: z
      .string()
      .max(100, "Country cannot exceed 100 characters")
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
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid start date format",
      })
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid end date format",
      })
      .optional(),
    sortBy: z
      .enum([
        "createdAt",
        "updatedAt",
        "deviceType",
        "browserName",
        "osName",
        "country",
      ])
      .optional(),
    sortOrder: z.enum(["ASC", "DESC"]).optional(),
  }),
});

/**
 * Get view trends schema
 */
export const getViewTrends = z.object({
  params: z.object({
    contentId: z.string().uuid("Invalid content ID format"),
  }),
  query: z.object({
    days: z
      .string()
      .refine(
        (val) =>
          !isNaN(parseInt(val)) && parseInt(val) > 0 && parseInt(val) <= 365,
        {
          message: "Days must be a positive number and not exceed 365",
        },
      )
      .optional(),
  }),
});

/**
 * Get global view trends schema
 */
export const getGlobalViewTrends = z.object({
  query: z.object({
    days: z
      .string()
      .refine(
        (val) =>
          !isNaN(parseInt(val)) && parseInt(val) > 0 && parseInt(val) <= 365,
        {
          message: "Days must be a positive number and not exceed 365",
        },
      )
      .optional(),
  }),
});

/**
 * Get device analytics schema
 */
export const getDeviceAnalytics = z.object({
  query: z.object({
    contentId: z.string().uuid("Invalid content ID format").optional(),
  }),
});

/**
 * Get geographic analytics schema
 */
export const getGeographicAnalytics = z.object({
  query: z.object({
    contentId: z.string().uuid("Invalid content ID format").optional(),
  }),
});
