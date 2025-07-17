import { Request, Response } from "express";
import * as service from "../../services/admin/user.service";
import { catchAsync } from "../../utils/catch-async";
import { HTTP } from "../../types/status-codes";

// Create a new user (Admin only)
export const createUser = catchAsync(async (req: Request, res: Response) => {
  const data = await service.createUser(req.body);
  res.status(HTTP.SUCCESS.CREATED).json(data);
});

// Get all users with filtering and pagination
export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const {
    page,
    pageSize,
    emailVerified,
    dateFrom,
    dateTo,
    minCredits,
    maxCredits,
    ...otherQuery
  } = req.query;

  const data = await service.getAllUsers({
    ...otherQuery,
    page: page ? parseInt(page as string) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    emailVerified:
      emailVerified === "true"
        ? true
        : emailVerified === "false"
          ? false
          : undefined,
    dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
    dateTo: dateTo ? new Date(dateTo as string) : undefined,
    minCredits: minCredits ? parseInt(minCredits as string) : undefined,
    maxCredits: maxCredits ? parseInt(maxCredits as string) : undefined,
  });
  res.status(HTTP.SUCCESS.OK).json(data);
});

// Get a single user by ID
export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await service.getUserById(id);
  res.status(HTTP.SUCCESS.OK).json(data);
});

// Update user
export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await service.updateUser(id, req.body);
  res.status(HTTP.SUCCESS.OK).json(data);
});

// Delete user (soft delete)
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await service.deleteUser(id);
  res.status(HTTP.SUCCESS.OK).json(data);
});

// Restore deleted user
export const restoreUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await service.restoreUser(id);
  res.status(HTTP.SUCCESS.OK).json(data);
});

// Permanently delete user
export const permanentlyDeleteUser = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await service.permanentlyDeleteUser(id);
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

// Bulk update users
export const bulkUpdateUsers = catchAsync(
  async (req: Request, res: Response) => {
    const data = await service.bulkUpdateUsers(req.body);
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

// Get user statistics
export const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const data = await service.getUserStats();
  res.status(HTTP.SUCCESS.OK).json(data);
});

// Adjust user credits
export const adjustUserCredits = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amount, operation } = req.body;
    const data = await service.adjustUserCredits(id, amount, operation);
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

// Change user password (Admin only)
export const changeUserPassword = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    const data = await service.changeUserPassword(id, newPassword);
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

// Toggle user status (Block/Unblock/Activate/Deactivate)
export const toggleUserStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const data = await service.toggleUserStatus(id, status);
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

// Get users with most content
export const getUsersWithMostContent = catchAsync(
  async (req: Request, res: Response) => {
    const { limit } = req.query;
    const data = await service.getUsersWithMostContent(
      limit ? parseInt(limit as string) : undefined,
    );
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

// Block user (shortcut method)
export const blockUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await service.toggleUserStatus(id, "blocked");
  res.status(HTTP.SUCCESS.OK).json(data);
});

// Unblock user (shortcut method)
export const unblockUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await service.toggleUserStatus(id, "active");
  res.status(HTTP.SUCCESS.OK).json(data);
});

// Activate user (shortcut method)
export const activateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await service.toggleUserStatus(id, "active");
  res.status(HTTP.SUCCESS.OK).json(data);
});

// Deactivate user (shortcut method)
export const deactivateUser = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await service.toggleUserStatus(id, "inactive");
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

// Verify user email (Admin override)
export const verifyUserEmail = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await service.updateUser(id, { emailVerified: true });
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

// Make user admin
export const makeUserAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await service.updateUser(id, { role: "admin" });
  res.status(HTTP.SUCCESS.OK).json(data);
});

// Remove admin role from user
export const removeAdminRole = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await service.updateUser(id, { role: "user" });
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

// Add credits to user (shortcut method)
export const addCreditsToUser = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amount } = req.body;
    const data = await service.adjustUserCredits(id, amount, "add");
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

// Deduct credits from user (shortcut method)
export const deductCreditsFromUser = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amount } = req.body;
    const data = await service.adjustUserCredits(id, amount, "deduct");
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

// Set user credits (shortcut method)
export const setUserCredits = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amount } = req.body;
    const data = await service.adjustUserCredits(id, amount, "set");
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);
