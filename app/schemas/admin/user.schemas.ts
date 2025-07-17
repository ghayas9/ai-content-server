import { z } from "zod";

/**
 * Create user schema
 */
export const createUser = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(100, "First name cannot exceed 100 characters")
      .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(100, "Last name cannot exceed 100 characters")
      .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces"),
    email: z
      .string()
      .email("Invalid email format")
      .max(255, "Email cannot exceed 255 characters"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(255, "Password cannot exceed 255 characters"),
    phone: z
      .string()
      .regex(/^[+]?[\d\s\-\(\)]+$/, "Invalid phone number format")
      .max(20, "Phone number cannot exceed 20 characters")
      .optional(),
    role: z
      .enum(["user", "admin"], {
        errorMap: () => ({ message: "Role must be either 'user' or 'admin'" }),
      })
      .optional(),
    status: z
      .enum(["active", "inactive", "blocked"], {
        errorMap: () => ({
          message: "Status must be 'active', 'inactive', or 'blocked'",
        }),
      })
      .optional(),
    credits: z
      .number()
      .min(0, "Credits cannot be negative")
      .max(999999, "Credits cannot exceed 999,999")
      .optional(),
    emailVerified: z.boolean().optional(),
  }),
});

/**
 * Update user schema
 */
export const updateUser = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    firstName: z
      .string()
      .min(1, "First name cannot be empty")
      .max(100, "First name cannot exceed 100 characters")
      .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces")
      .optional(),
    lastName: z
      .string()
      .min(1, "Last name cannot be empty")
      .max(100, "Last name cannot exceed 100 characters")
      .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces")
      .optional(),
    email: z
      .string()
      .email("Invalid email format")
      .max(255, "Email cannot exceed 255 characters")
      .optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(255, "Password cannot exceed 255 characters")
      .optional(),
    phone: z
      .string()
      .regex(/^[+]?[\d\s\-\(\)]+$/, "Invalid phone number format")
      .max(20, "Phone number cannot exceed 20 characters")
      .optional(),
    profileImage: z.string().url("Invalid profile image URL").optional(),
    coverImage: z.string().url("Invalid cover image URL").optional(),
    role: z
      .enum(["user", "admin"], {
        errorMap: () => ({ message: "Role must be either 'user' or 'admin'" }),
      })
      .optional(),
    status: z
      .enum(["active", "inactive", "blocked"], {
        errorMap: () => ({
          message: "Status must be 'active', 'inactive', or 'blocked'",
        }),
      })
      .optional(),
    credits: z
      .number()
      .min(0, "Credits cannot be negative")
      .max(999999, "Credits cannot exceed 999,999")
      .optional(),
    emailVerified: z.boolean().optional(),
    referralCode: z
      .string()
      .max(20, "Referral code cannot exceed 20 characters")
      .optional(),
  }),
});

/**
 * Get user by ID schema
 */
export const getUserById = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
});

/**
 * Get all users schema
 */
export const getAllUsers = z.object({
  query: z.object({
    role: z.enum(["user", "admin"]).optional(),
    status: z.enum(["active", "inactive", "blocked"]).optional(),
    emailVerified: z
      .string()
      .refine((val) => val === "true" || val === "false", {
        message: "emailVerified must be 'true' or 'false'",
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
        "firstName",
        "lastName",
        "email",
        "role",
        "status",
        "credits",
        "emailVerified",
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
    minCredits: z
      .string()
      .refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
        message: "Min credits must be a non-negative number",
      })
      .optional(),
    maxCredits: z
      .string()
      .refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
        message: "Max credits must be a non-negative number",
      })
      .optional(),
  }),
});

/**
 * Delete user schema
 */
export const deleteUser = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
});

/**
 * Bulk update users schema
 */
export const bulkUpdateUsers = z.object({
  body: z.object({
    userIds: z
      .array(z.string().min(1, "User ID cannot be empty"))
      .min(1, "At least one user ID is required")
      .max(100, "Cannot update more than 100 users at once"),
    updateData: z.object({
      status: z
        .enum(["active", "inactive", "blocked"], {
          errorMap: () => ({
            message: "Status must be 'active', 'inactive', or 'blocked'",
          }),
        })
        .optional(),
      role: z
        .enum(["user", "admin"], {
          errorMap: () => ({
            message: "Role must be either 'user' or 'admin'",
          }),
        })
        .optional(),
      emailVerified: z.boolean().optional(),
      credits: z
        .number()
        .min(0, "Credits cannot be negative")
        .max(999999, "Credits cannot exceed 999,999")
        .optional(),
    }),
  }),
});

/**
 * Adjust user credits schema
 */
export const adjustUserCredits = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    amount: z
      .number()
      .min(1, "Amount must be at least 1")
      .max(999999, "Amount cannot exceed 999,999"),
    operation: z.enum(["add", "deduct", "set"], {
      errorMap: () => ({
        message: "Operation must be 'add', 'deduct', or 'set'",
      }),
    }),
  }),
});

/**
 * Change user password schema
 */
export const changeUserPassword = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(255, "Password cannot exceed 255 characters"),
  }),
});

/**
 * Toggle user status schema
 */
export const toggleUserStatus = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    status: z.enum(["active", "inactive", "blocked"], {
      errorMap: () => ({
        message: "Status must be 'active', 'inactive', or 'blocked'",
      }),
    }),
  }),
});

/**
 * Get top content creators schema
 */
export const getUsersWithMostContent = z.object({
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
  }),
});

/**
 * Add credits to user schema (shortcut)
 */
export const addCreditsToUser = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    amount: z
      .number()
      .min(1, "Amount must be at least 1")
      .max(999999, "Amount cannot exceed 999,999"),
  }),
});

/**
 * Deduct credits from user schema (shortcut)
 */
export const deductCreditsFromUser = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    amount: z
      .number()
      .min(1, "Amount must be at least 1")
      .max(999999, "Amount cannot exceed 999,999"),
  }),
});

/**
 * Set user credits schema (shortcut)
 */
export const setUserCredits = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    amount: z
      .number()
      .min(0, "Amount cannot be negative")
      .max(999999, "Amount cannot exceed 999,999"),
  }),
});

/**
 * Restore user schema
 */
export const restoreUser = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
});

/**
 * Permanently delete user schema
 */
export const permanentlyDeleteUser = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
});
