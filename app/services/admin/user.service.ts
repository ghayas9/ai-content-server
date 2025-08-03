import { Op } from "sequelize";
import sequelize from "../../config/database";
import User, { TUserRole, TUserStatus } from "../../models/user.models";
import Content from "../../models/content.models";
import AppError from "../../utils/app.error";
import { getPagination, getPaginationMetadata } from "../../utils/pagination";
import bcrypt from "bcryptjs";

interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: TUserRole;
  status?: TUserStatus;
  credits?: number;
  emailVerified?: boolean;
}

interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  profileImage?: string;
  coverImage?: string;
  role?: TUserRole;
  status?: TUserStatus;
  credits?: number;
  emailVerified?: boolean;
  referralCode?: string;
}

interface GetAllUsersOptions {
  role?: TUserRole;
  status?: TUserStatus;
  emailVerified?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  dateFrom?: Date;
  dateTo?: Date;
  minCredits?: number;
  maxCredits?: number;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  blockedUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  adminUsers: number;
  regularUsers: number;
  totalCredits: number;
  averageCredits: number;
}

interface BulkUpdatePayload {
  userIds: string[];
  updateData: {
    status?: TUserStatus;
    role?: TUserRole;
    emailVerified?: boolean;
    credits?: number;
  };
}

// Create a new user (Admin only)
export const createUser = async (userData: CreateUserPayload) => {
  const transaction = await sequelize.transaction();

  try {
    // Check if email already exists
    const existingUser = await User.findOne({
      where: { email: userData.email },
      paranoid: false,
    });

    if (existingUser) {
      await transaction.rollback();
      throw new AppError("User with this email already exists", 409);
    }

    const user = await User.create(
      {
        ...userData,
        emailVerified: userData.emailVerified ?? false,
        credits: userData.credits ?? 100,
        status: userData.status ?? "active",
        role: userData.role ?? "user",
      },
      { transaction },
    );

    await transaction.commit();

    return {
      message: "User created successfully",
      data: user,
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("User creation error", 500);
  }
};

// Get all users with filtering and pagination
export const getAllUsers = async ({
  role,
  status,
  emailVerified,
  page = 1,
  pageSize = 10,
  search,
  sortBy = "createdAt",
  sortOrder = "DESC",
  dateFrom,
  dateTo,
  minCredits,
  maxCredits,
}: GetAllUsersOptions = {}) => {
  try {
    // Validate sortBy field to prevent SQL injection
    const allowedSortFields = [
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
    ];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    // Build where clause
    const whereClause: any = {};

    if (role) whereClause.role = role;
    if (status) whereClause.status = status;
    if (emailVerified !== undefined) whereClause.emailVerified = emailVerified;

    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { id: { [Op.iLike]: `%${search}%` } },
        { referralCode: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt[Op.gte] = dateFrom;
      if (dateTo) whereClause.createdAt[Op.lte] = dateTo;
    }

    if (minCredits !== undefined || maxCredits !== undefined) {
      whereClause.credits = {};
      if (minCredits !== undefined) whereClause.credits[Op.gte] = minCredits;
      if (maxCredits !== undefined) whereClause.credits[Op.lte] = maxCredits;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Content,
          as: "contents",
          attributes: ["id", "title", "type", "contentType", "status"],
          required: false,
        },
      ],
      ...getPagination({ page, pageSize }),
      order: [[validSortBy, sortOrder.toUpperCase()]],
      distinct: true,
    });

    return {
      message: "Users retrieved successfully",
      data: {
        users,
        pagination: getPaginationMetadata({ page, pageSize }, count),
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Users retrieval error", 500);
  }
};

// Get a single user by ID
export const getUserById = async (userId: string) => {
  try {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Content,
          as: "contents",
          attributes: [
            "id",
            "title",
            "type",
            "contentType",
            "status",
            "createdAt",
          ],
        },
      ],
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return {
      message: "User retrieved successfully",
      data: user,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("User retrieval error", 500);
  }
};

// Update user
export const updateUser = async (
  userId: string,
  updateData: UpdateUserPayload,
) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findByPk(userId, { transaction });

    if (!user) {
      await transaction.rollback();
      throw new AppError("User not found", 404);
    }

    // Check if email is being updated and if it's unique
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({
        where: {
          email: updateData.email,
          id: { [Op.ne]: userId },
        },
        paranoid: false,
        transaction,
      });

      if (existingUser) {
        await transaction.rollback();
        throw new AppError("Email already exists", 409);
      }
    }

    await user.update(updateData, { transaction });

    await transaction.commit();

    // Fetch updated user without password
    const updatedUser = await User.findByPk(userId);

    return {
      message: "User updated successfully",
      data: updatedUser,
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("User update error", 500);
  }
};

// Delete user (soft delete)
export const deleteUser = async (userId: string) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findByPk(userId, { transaction });

    if (!user) {
      await transaction.rollback();
      throw new AppError("User not found", 404);
    }

    await user.destroy({ transaction });

    await transaction.commit();

    return {
      message: "User deleted successfully",
      data: { id: userId },
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("User deletion error", 500);
  }
};

// Restore deleted user
export const restoreUser = async (userId: string) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findByPk(userId, {
      paranoid: false,
      transaction,
    });

    if (!user) {
      await transaction.rollback();
      throw new AppError("User not found", 404);
    }

    if (!user.deletedAt) {
      await transaction.rollback();
      throw new AppError("User is not deleted", 400);
    }

    await user.restore({ transaction });

    await transaction.commit();

    return {
      message: "User restored successfully",
      data: user,
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("User restoration error", 500);
  }
};

// Permanently delete user
export const permanentlyDeleteUser = async (userId: string) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findByPk(userId, {
      paranoid: false,
      transaction,
    });

    if (!user) {
      await transaction.rollback();
      throw new AppError("User not found", 404);
    }

    // Also permanently delete user's content
    await Content.destroy({
      where: { userId },
      force: true,
      transaction,
    });

    await user.destroy({ force: true, transaction });

    await transaction.commit();

    return {
      message: "User permanently deleted successfully",
      data: { id: userId },
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Permanent user deletion error", 500);
  }
};

// Bulk update users
export const bulkUpdateUsers = async ({
  userIds,
  updateData,
}: BulkUpdatePayload) => {
  const transaction = await sequelize.transaction();

  try {
    const [updatedCount] = await User.update(updateData, {
      where: {
        id: {
          [Op.in]: userIds,
        },
      },
      transaction,
    });

    await transaction.commit();

    return {
      message: `${updatedCount} users updated successfully`,
      data: { updatedCount, userIds },
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Bulk update error", 500);
  }
};

// Get user statistics
export const getUserStats = async (): Promise<{
  message: string;
  data: UserStats;
}> => {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      blockedUsers,
      verifiedUsers,
      unverifiedUsers,
      adminUsers,
      regularUsers,
      creditsStats,
    ] = (await Promise.all([
      User.count(),
      User.count({ where: { status: "active" } }),
      User.count({ where: { status: "inactive" } }),
      User.count({ where: { status: "blocked" } }),
      User.count({ where: { emailVerified: true } }),
      User.count({ where: { emailVerified: false } }),
      User.count({ where: { role: "admin" } }),
      User.count({ where: { role: "user" } }),
      User.findAll({
        attributes: [
          [sequelize.fn("SUM", sequelize.col("credits")), "totalCredits"],
          [sequelize.fn("AVG", sequelize.col("credits")), "averageCredits"],
        ],
        raw: true,
      }),
    ])) as any;

    const stats: UserStats = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      blockedUsers,
      verifiedUsers,
      unverifiedUsers,
      adminUsers,
      regularUsers,
      totalCredits: parseInt(creditsStats[0]?.totalCredits) || 0,
      averageCredits: parseFloat(creditsStats[0]?.averageCredits) || 0,
    };

    return {
      message: "User statistics retrieved successfully",
      data: stats,
    };
  } catch (error) {
    throw new AppError("Statistics retrieval error", 500);
  }
};

// Manage user credits
export const adjustUserCredits = async (
  userId: string,
  amount: number,
  operation: "add" | "deduct" | "set",
) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findByPk(userId, { transaction });

    if (!user) {
      await transaction.rollback();
      throw new AppError("User not found", 404);
    }

    let newCredits: number;

    switch (operation) {
      case "add":
        newCredits = user.credits + amount;
        break;
      case "deduct":
        newCredits = Math.max(0, user.credits - amount);
        break;
      case "set":
        newCredits = Math.max(0, amount);
        break;
      default:
        await transaction.rollback();
        throw new AppError("Invalid operation", 400);
    }

    await user.update({ credits: newCredits }, { transaction });

    await transaction.commit();

    return {
      message: `User credits ${operation}ed successfully`,
      data: {
        userId,
        previousCredits: user.credits,
        newCredits,
        operation,
        amount,
      },
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Credits adjustment error", 500);
  }
};

// Change user password (Admin only)
export const changeUserPassword = async (
  userId: string,
  newPassword: string,
) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findByPk(userId, { transaction });

    if (!user) {
      await transaction.rollback();
      throw new AppError("User not found", 404);
    }

    // Validate password length
    if (newPassword.length < 6) {
      await transaction.rollback();
      throw new AppError("Password must be at least 6 characters long", 400);
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await user.update({ password: hashedPassword }, { transaction });

    await transaction.commit();

    return {
      message: "User password changed successfully",
      data: { userId },
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Password change error", 500);
  }
};

// Block/Unblock user
export const toggleUserStatus = async (userId: string, status: TUserStatus) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findByPk(userId, { transaction });

    if (!user) {
      await transaction.rollback();
      throw new AppError("User not found", 404);
    }

    await user.update({ status }, { transaction });

    await transaction.commit();

    return {
      message: `User ${status} successfully`,
      data: user,
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("User status update error", 500);
  }
};

// Get users with most content
export const getUsersWithMostContent = async (limit: number = 10) => {
  try {
    const users = await User.findAll({
      include: [
        {
          model: Content,
          as: "contents",
          attributes: [],
        },
      ],
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "role",
        "status",
        "credits",
        [sequelize.fn("COUNT", sequelize.col("contents.id")), "contentCount"],
      ],
      group: ["User.id"],
      order: [[sequelize.literal('"contentCount"'), "DESC"]],
      limit,
      subQuery: false,
    });

    return {
      message: "Top content creators retrieved successfully",
      data: users,
    };
  } catch (error) {
    throw new AppError("Top users retrieval error", 500);
  }
};
