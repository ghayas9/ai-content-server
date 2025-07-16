import { Op } from "sequelize";
import sequelize from "../config/database";
import Like from "../models/likes.models";
import User from "../models/user.models";
import Content from "../models/content.models";
import AppError from "../utils/app.error";
import { getPagination, getPaginationMetadata } from "../utils/pagination";

interface ToggleLikePayload {
  userId: string;
  contentId: string;
}

interface GetLikesOptions {
  contentId?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

interface GetTopLikedContentOptions {
  limit?: number;
  timeframe?: "day" | "week" | "month";
  page?: number;
  pageSize?: number;
}

/**
 * Toggle like on content - like if not liked, unlike if already liked
 * @param payload Toggle like payload
 * @returns Result of toggle operation
 */
export const toggleLike = async ({ userId, contentId }: ToggleLikePayload) => {
  const transaction = await sequelize.transaction();

  try {
    // Check if content exists
    const content = await Content.findByPk(contentId, { transaction });
    if (!content) {
      await transaction.rollback();
      throw new AppError("Content not found", 404);
    }

    // Check if user exists
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      throw new AppError("User not found", 404);
    }

    // Check if like already exists
    const existingLike = await Like.findOne({
      where: {
        userId,
        contentId,
      },
      transaction,
    });

    let isLiked: boolean;
    let like: Like | null = null;

    if (existingLike) {
      // Unlike - soft delete the like
      await existingLike.destroy({ transaction });
      isLiked = false;
    } else {
      // Like - create new like
      like = await Like.create(
        {
          userId,
          contentId,
        },
        { transaction },
      );
      isLiked = true;
    }

    await transaction.commit();

    return {
      message: isLiked
        ? "Content liked successfully"
        : "Content unliked successfully",
      data: {
        isLiked,
        contentId,
        userId,
        like,
      },
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Like toggle error", 500);
  }
};

/**
 * Check if user has liked specific content
 * @param userId User ID
 * @param contentId Content ID
 * @returns Boolean indicating if user has liked the content
 */
export const hasUserLiked = async (userId: string, contentId: string) => {
  try {
    const like = await Like.findOne({
      where: {
        userId,
        contentId,
      },
    });
    const hasLiked = !!like;

    return {
      message: "Like status retrieved successfully",
      data: {
        hasLiked,
        userId,
        contentId,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Like status check error", 500);
  }
};

/**
 * Get like count for specific content
 * @param contentId Content ID
 * @returns Number of likes for the content
 */
export const getLikeCount = async (contentId: string) => {
  try {
    // Check if content exists
    const content = await Content.findByPk(contentId);
    if (!content) {
      throw new AppError("Content not found", 404);
    }

    const likeCount = await Like.count({
      where: {
        contentId,
      },
    });

    return {
      message: "Like count retrieved successfully",
      data: {
        contentId,
        likeCount,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Like count retrieval error", 500);
  }
};

/**
 * Get users who liked specific content
 * @param contentId Content ID
 * @param options Query options
 * @returns List of users who liked the content
 */
export const getUsersWhoLiked = async (
  contentId: string,
  options: GetLikesOptions = {},
) => {
  try {
    const { page = 1, pageSize = 10 } = options;

    // Check if content exists
    const content = await Content.findByPk(contentId);
    if (!content) {
      throw new AppError("Content not found", 404);
    }

    const { limit, offset } = getPagination({ page, pageSize });
    const likes = await Like.findAll({
      where: {
        contentId,
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "profileImage"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const users = likes.map((like) => like.user!);

    // Get total count for pagination
    const totalCount = await Like.count({
      where: { contentId },
    });

    return {
      message: "Users who liked content retrieved successfully",
      data: {
        users,
        pagination: getPaginationMetadata({ page, pageSize }, totalCount),
        contentId,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Users retrieval error", 500);
  }
};

/**
 * Get content liked by specific user
 * @param userId User ID
 * @param options Query options
 * @returns List of content liked by the user
 */
export const getContentLikedByUser = async (
  userId: string,
  options: GetLikesOptions = {},
) => {
  try {
    const { page = 1, pageSize = 10 } = options;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const { limit, offset } = getPagination({ page, pageSize });
    const likes = await Like.findAll({
      where: {
        userId,
      },
      include: [
        {
          model: Content,
          as: "content",
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const content = likes.map((like) => like.content!);

    // Get total count for pagination
    const totalCount = await Like.count({
      where: { userId },
    });

    return {
      message: "Content liked by user retrieved successfully",
      data: {
        content,
        pagination: getPaginationMetadata({ page, pageSize }, totalCount),
        userId,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Content retrieval error", 500);
  }
};

/**
 * Get top liked content
 * @param options Query options
 * @returns List of top liked content
 */
export const getTopLikedContent = async (
  options: GetTopLikedContentOptions = {},
) => {
  try {
    const { limit = 10, timeframe } = options;

    let dateFilter = {};

    if (timeframe) {
      const now = new Date();
      const timeframes = {
        day: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      };

      dateFilter = {
        createdAt: {
          [Op.gte]: timeframes[timeframe],
        },
      };
    }

    const results = await Like.findAll({
      where: dateFilter,
      include: [
        {
          model: Content,
          as: "content",
          required: true,
        },
      ],
      attributes: [
        "contentId",
        [sequelize.fn("COUNT", sequelize.col("id")), "likeCount"],
      ],
      group: ["contentId", "content.id"],
      order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
      limit,
    });

    const topContent = results.map((result: any) => ({
      content: result.content,
      likeCount: parseInt(result.getDataValue("likeCount")),
    }));

    return {
      message: "Top liked content retrieved successfully",
      data: {
        content: topContent,
        timeframe: timeframe || "all_time",
        limit,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Top content retrieval error", 500);
  }
};

/**
 * Get like analytics for content
 * @param contentId Content ID
 * @returns Like analytics data
 */
export const getLikeAnalytics = async (contentId: string) => {
  try {
    // Check if content exists
    const content = await Content.findByPk(contentId);
    if (!content) {
      throw new AppError("Content not found", 404);
    }

    const [totalLikes, likesToday, likesThisWeek, likesThisMonth, dailyLikes] =
      await Promise.all([
        // Total likes
        Like.count({ where: { contentId } }),

        // Likes today
        Like.count({
          where: {
            contentId,
            createdAt: {
              [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),

        // Likes this week
        Like.count({
          where: {
            contentId,
            createdAt: {
              [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Likes this month
        Like.count({
          where: {
            contentId,
            createdAt: {
              [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Daily likes for the last 30 days
        Like.findAll({
          where: {
            contentId,
            createdAt: {
              [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          attributes: [
            [sequelize.fn("DATE", sequelize.col("created_at")), "date"],
            [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          ],
          group: [sequelize.fn("DATE", sequelize.col("created_at"))],
          order: [[sequelize.fn("DATE", sequelize.col("created_at")), "ASC"]],
        }),
      ]);

    return {
      message: "Like analytics retrieved successfully",
      data: {
        contentId,
        totalLikes,
        likesToday,
        likesThisWeek,
        likesThisMonth,
        dailyLikes: dailyLikes.map((item: any) => ({
          date: item.getDataValue("date"),
          count: parseInt(item.getDataValue("count")),
        })),
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Analytics retrieval error", 500);
  }
};

/**
 * Get user's like history
 * @param userId User ID
 * @param options Query options
 * @returns User's like history
 */
export const getUserLikeHistory = async (
  userId: string,
  options: GetLikesOptions = {},
) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = options;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Validate sortBy field
    const allowedSortFields = ["createdAt", "updatedAt"];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const { count, rows: likes } = await Like.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Content,
          as: "content",
          attributes: ["id", "title", "slug", "contentType", "thumbnailUrl"],
        },
      ],
      ...getPagination({ page, pageSize }),
      order: [[validSortBy, sortOrder.toUpperCase()]],
    });

    return {
      message: "User like history retrieved successfully",
      data: {
        likes,
        pagination: getPaginationMetadata({ page, pageSize }, count),
        userId,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Like history retrieval error", 500);
  }
};

/**
 * Remove like from content
 * @param userId User ID
 * @param contentId Content ID
 * @returns Result of unlike operation
 */
export const removeLike = async (userId: string, contentId: string) => {
  const transaction = await sequelize.transaction();

  try {
    // Check if like exists
    const like = await Like.findOne({
      where: { userId, contentId },
      transaction,
    });

    if (!like) {
      await transaction.rollback();
      throw new AppError("Like not found", 404);
    }

    // Remove the like (soft delete)
    await like.destroy({ transaction });

    await transaction.commit();

    return {
      message: "Like removed successfully",
      data: {
        userId,
        contentId,
      },
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Like removal error", 500);
  }
};

/**
 * Get global like statistics
 * @returns Global like statistics
 */
export const getGlobalLikeStats = async () => {
  try {
    const [
      totalLikes,
      likesToday,
      likesThisWeek,
      likesThisMonth,
      mostLikedContentResults,
    ] = await Promise.all([
      // Total likes
      Like.count(),

      // Likes today
      Like.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // Likes this week
      Like.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Likes this month
      Like.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Most liked content
      Like.findAll({
        include: [
          {
            model: Content,
            as: "content",
            required: true,
          },
        ],
        attributes: [
          "contentId",
          [sequelize.fn("COUNT", sequelize.col("id")), "likeCount"],
        ],
        group: ["contentId", "content.id"],
        order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
        limit: 5,
      }),
    ]);

    const mostLikedContent = mostLikedContentResults.map((result: any) => ({
      content: result.content,
      likeCount: parseInt(result.getDataValue("likeCount")),
    }));

    return {
      message: "Global like statistics retrieved successfully",
      data: {
        totalLikes,
        likesToday,
        likesThisWeek,
        likesThisMonth,
        mostLikedContent,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Global statistics retrieval error", 500);
  }
};
