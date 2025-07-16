import { Op, fn, col } from "sequelize";
import sequelize from "../config/database";
import Comment, { TCommentStatus } from "../models/comments.models";
import User from "../models/user.models";
import Content from "../models/content.models";
import AppError from "../utils/app.error";
import { getPagination, getPaginationMetadata } from "../utils/pagination";

interface CreateCommentPayload {
  userId: string;
  contentId: string;
  text: string;
  parentId?: string;
  metadata?: Record<string, any>;
}

interface UpdateCommentPayload {
  text?: string;
  status?: TCommentStatus;
  isPinned?: boolean;
  metadata?: Record<string, any>;
}

interface GetCommentsOptions {
  contentId?: string;
  userId?: string;
  parentId?: string;
  status?: TCommentStatus;
  isPinned?: boolean;
  page?: number;
  pageSize?: number;
  includePinned?: boolean;
  includeReplies?: boolean;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

interface GetTopCommentedContentOptions {
  limit?: number;
  timeframe?: "day" | "week" | "month";
}

/**
 * Create a new comment
 * @param payload Comment creation payload
 * @returns Created comment
 */
export const createComment = async (payload: CreateCommentPayload) => {
  const transaction = await sequelize.transaction();

  try {
    const { userId, contentId, text, parentId, metadata } = payload;

    // Check if user exists
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      throw new AppError("User not found", 404);
    }

    // Check if content exists
    const content = await Content.findByPk(contentId, { transaction });
    if (!content) {
      await transaction.rollback();
      throw new AppError("Content not found", 404);
    }

    // If this is a reply, check if parent comment exists
    if (parentId) {
      const parentComment = await Comment.findByPk(parentId, { transaction });
      if (!parentComment) {
        await transaction.rollback();
        throw new AppError("Parent comment not found", 404);
      }

      // Ensure parent comment belongs to the same content
      if (parentComment.contentId !== contentId) {
        await transaction.rollback();
        throw new AppError(
          "Parent comment does not belong to this content",
          400,
        );
      }
    }

    // Create the comment
    const comment = await Comment.create(
      {
        userId,
        contentId,
        text,
        parentId: parentId || null,
        metadata: metadata || null,
        status: "active",
        isPinned: false,
      },
      { transaction },
    );

    // Fetch the created comment with user details
    const createdComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "profileImage"],
        },
        {
          model: Content,
          as: "content",
          attributes: ["id", "title", "slug"],
        },
      ],
      transaction,
    });

    await transaction.commit();

    return {
      message: "Comment created successfully",
      data: createdComment,
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Comment creation error", 500);
  }
};

/**
 * Get comments for content
 * @param contentId Content ID
 * @param options Query options
 * @returns Comments for the content
 */
export const getCommentsForContent = async (
  contentId: string,
  options: GetCommentsOptions = {},
) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      includePinned = true,
      includeReplies = false,
    } = options;

    // Check if content exists
    const content = await Content.findByPk(contentId);
    if (!content) {
      throw new AppError("Content not found", 404);
    }

    const { limit, offset } = getPagination({ page, pageSize });

    // Build where clause
    const whereClause: any = {
      contentId,
      parentId: null, // Only top-level comments
      status: "active",
    };

    // Query for top-level comments
    const comments = await Comment.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "profileImage"],
        },
        ...(includeReplies
          ? [
              {
                model: Comment,
                as: "replies",
                where: { status: "active" },
                required: false,
                include: [
                  {
                    model: User,
                    as: "user",
                    attributes: ["id", "firstName", "lastName", "profileImage"],
                  },
                ],
              },
            ]
          : []),
      ],
      order: [
        ...((includePinned ? [["isPinned", "DESC"]] : []) as any),
        ["createdAt", "DESC"],
      ],
      limit,
      offset,
    });

    // Get total count for pagination
    const totalCount = await Comment.count({
      where: {
        contentId,
        parentId: null,
        status: "active",
      },
    });

    return {
      message: "Comments retrieved successfully",
      data: {
        comments,
        pagination: getPaginationMetadata({ page, pageSize }, totalCount),
        contentId,
        includeReplies,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Comments retrieval error", 500);
  }
};

/**
 * Get comment by ID
 * @param commentId Comment ID
 * @param userId Optional user ID for permission check
 * @returns Comment details
 */
export const getCommentById = async (commentId: string, userId?: string) => {
  try {
    const comment = await Comment.findByPk(commentId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "profileImage"],
        },
        {
          model: Content,
          as: "content",
          attributes: ["id", "title", "slug"],
        },
        {
          model: Comment,
          as: "parent",
          attributes: ["id", "text"],
          required: false,
        },
      ],
    });

    if (!comment) {
      throw new AppError("Comment not found", 404);
    }

    // Check if comment is hidden and user doesn't own it
    if (comment.status === "hidden" && (!userId || comment.userId !== userId)) {
      throw new AppError("Comment not found", 404);
    }

    return {
      message: "Comment retrieved successfully",
      data: comment,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Comment retrieval error", 500);
  }
};

/**
 * Update comment
 * @param commentId Comment ID
 * @param userId User ID (for ownership check)
 * @param updateData Update payload
 * @returns Updated comment
 */
export const updateComment = async (
  commentId: string,
  userId: string,
  updateData: UpdateCommentPayload,
) => {
  const transaction = await sequelize.transaction();

  try {
    // Check if comment exists and belongs to user
    const comment = await Comment.findOne({
      where: { id: commentId, userId },
      transaction,
    });

    if (!comment) {
      await transaction.rollback();
      throw new AppError("Comment not found or access denied", 404);
    }

    // Update the comment
    await comment.update(updateData, { transaction });

    // Fetch updated comment with relations
    const updatedComment = await Comment.findByPk(commentId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "profileImage"],
        },
        {
          model: Content,
          as: "content",
          attributes: ["id", "title", "slug"],
        },
      ],
      transaction,
    });

    await transaction.commit();

    return {
      message: "Comment updated successfully",
      data: updatedComment,
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Comment update error", 500);
  }
};

/**
 * Delete comment
 * @param commentId Comment ID
 * @param userId User ID (for ownership check)
 * @returns Deletion result
 */
export const deleteComment = async (commentId: string, userId: string) => {
  const transaction = await sequelize.transaction();

  try {
    // Check if comment exists and belongs to user
    const comment = await Comment.findOne({
      where: { id: commentId, userId },
      transaction,
    });

    if (!comment) {
      await transaction.rollback();
      throw new AppError("Comment not found or access denied", 404);
    }

    // Soft delete the comment
    await comment.destroy({ transaction });

    await transaction.commit();

    return {
      message: "Comment deleted successfully",
      data: { commentId },
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Comment deletion error", 500);
  }
};

/**
 * Get replies for a comment
 * @param commentId Parent comment ID
 * @param options Query options
 * @returns Comment replies
 */
export const getReplies = async (
  commentId: string,
  options: GetCommentsOptions = {},
) => {
  try {
    const { page = 1, pageSize = 10 } = options;

    // Check if parent comment exists
    const parentComment = await Comment.findByPk(commentId);
    if (!parentComment) {
      throw new AppError("Parent comment not found", 404);
    }

    const { limit, offset } = getPagination({ page, pageSize });

    // Get replies to this comment
    const replies = await Comment.findAll({
      where: {
        parentId: commentId,
        status: "active",
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "profileImage"],
        },
      ],
      order: [["createdAt", "ASC"]],
      limit,
      offset,
    });

    // Get total reply count
    const totalCount = await Comment.count({
      where: {
        parentId: commentId,
        status: "active",
      },
    });

    return {
      message: "Replies retrieved successfully",
      data: {
        replies,
        pagination: getPaginationMetadata({ page, pageSize }, totalCount),
        parentCommentId: commentId,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Replies retrieval error", 500);
  }
};

/**
 * Get user's comments
 * @param userId User ID
 * @param options Query options
 * @returns User's comments
 */
export const getUserComments = async (
  userId: string,
  options: GetCommentsOptions = {},
) => {
  try {
    const { page = 1, pageSize = 10 } = options;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const { limit, offset } = getPagination({ page, pageSize });

    const comments = await Comment.findAll({
      where: {
        userId,
        status: "active",
      },
      include: [
        {
          model: Content,
          as: "content",
          attributes: ["id", "title", "slug"],
        },
        {
          model: Comment,
          as: "parent",
          attributes: ["id", "text"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    // Get total count
    const totalCount = await Comment.count({
      where: { userId, status: "active" },
    });

    return {
      message: "User comments retrieved successfully",
      data: {
        comments,
        pagination: getPaginationMetadata({ page, pageSize }, totalCount),
        userId,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("User comments retrieval error", 500);
  }
};

/**
 * Pin/unpin comment (admin function)
 * @param commentId Comment ID
 * @param isPinned Pin status
 * @returns Updated comment
 */
export const togglePinComment = async (
  commentId: string,
  isPinned: boolean,
) => {
  const transaction = await sequelize.transaction();

  try {
    const comment = await Comment.findByPk(commentId, { transaction });

    if (!comment) {
      await transaction.rollback();
      throw new AppError("Comment not found", 404);
    }

    // Update pin status
    comment.isPinned = isPinned;
    await comment.save({ transaction });

    await transaction.commit();

    return {
      message: `Comment ${isPinned ? "pinned" : "unpinned"} successfully`,
      data: comment,
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Comment pin toggle error", 500);
  }
};

/**
 * Report comment
 * @param commentId Comment ID
 * @param reporterId User ID who is reporting
 * @returns Report result
 */
export const reportComment = async (commentId: string, reporterId: string) => {
  const transaction = await sequelize.transaction();

  try {
    const comment = await Comment.findByPk(commentId, { transaction });

    if (!comment) {
      await transaction.rollback();
      throw new AppError("Comment not found", 404);
    }

    // Can't report your own comment
    if (comment.userId === reporterId) {
      await transaction.rollback();
      throw new AppError("Cannot report your own comment", 400);
    }

    // Update comment status to reported
    comment.status = "reported";
    await comment.save({ transaction });

    await transaction.commit();

    return {
      message: "Comment reported successfully",
      data: { commentId, reporterId },
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Comment report error", 500);
  }
};

/**
 * Get reported comments (admin function)
 * @param options Query options
 * @returns Reported comments
 */
export const getReportedComments = async (options: GetCommentsOptions = {}) => {
  try {
    const { page = 1, pageSize = 10 } = options;

    const { limit, offset } = getPagination({ page, pageSize });

    const comments = await Comment.findAll({
      where: {
        status: "reported",
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: Content,
          as: "content",
          attributes: ["id", "title", "slug"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    // Get total count
    const totalCount = await Comment.count({
      where: { status: "reported" },
    });

    return {
      message: "Reported comments retrieved successfully",
      data: {
        comments,
        pagination: getPaginationMetadata({ page, pageSize }, totalCount),
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Reported comments retrieval error", 500);
  }
};

/**
 * Moderate comment (admin function)
 * @param commentId Comment ID
 * @param action Moderation action
 * @returns Moderation result
 */
export const moderateComment = async (
  commentId: string,
  action: "approve" | "hide" | "delete",
) => {
  const transaction = await sequelize.transaction();

  try {
    const comment = await Comment.findByPk(commentId, { transaction });

    if (!comment) {
      await transaction.rollback();
      throw new AppError("Comment not found", 404);
    }

    switch (action) {
      case "approve":
        comment.status = "active";
        await comment.save({ transaction });
        break;
      case "hide":
        comment.status = "hidden";
        await comment.save({ transaction });
        break;
      case "delete":
        await comment.destroy({ transaction });
        break;
      default:
        await transaction.rollback();
        throw new AppError("Invalid moderation action", 400);
    }

    await transaction.commit();

    return {
      message: `Comment ${action}d successfully`,
      data: { commentId, action },
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Comment moderation error", 500);
  }
};

/**
 * Search comments
 * @param query Search query
 * @param options Search options
 * @returns Search results
 */
export const searchComments = async (
  query: string,
  options: GetCommentsOptions & { contentId?: string } = {},
) => {
  try {
    const { page = 1, pageSize = 10, contentId } = options;

    if (!query || query.trim().length === 0) {
      throw new AppError("Search query is required", 400);
    }

    const { limit, offset } = getPagination({ page, pageSize });

    const whereClause: any = {
      text: {
        [Op.iLike]: `%${query}%`,
      },
      status: "active",
    };

    if (contentId) {
      whereClause.contentId = contentId;
    }

    const comments = await Comment.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "profileImage"],
        },
        {
          model: Content,
          as: "content",
          attributes: ["id", "title", "slug"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    // Get total count for pagination
    const totalCount = await Comment.count({ where: whereClause });

    return {
      message: "Comments search completed successfully",
      data: {
        comments,
        pagination: getPaginationMetadata({ page, pageSize }, totalCount),
        query,
        contentId,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Comment search error", 500);
  }
};

/**
 * Get top commented content
 * @param options Query options
 * @returns Top commented content
 */
export const getTopCommentedContent = async (
  options: GetTopCommentedContentOptions = {},
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

    const results = await Comment.findAll({
      where: {
        status: "active",
        ...dateFilter,
      },
      include: [
        {
          model: Content,
          as: "content",
          required: true,
        },
      ],
      attributes: ["contentId", [fn("COUNT", col("id")), "commentCount"]],
      group: ["contentId", "content.id"],
      order: [[fn("COUNT", col("id")), "DESC"]],
      limit,
    });

    const topContent = results.map((result: any) => ({
      content: result.content,
      commentCount: parseInt(result.getDataValue("commentCount")),
    }));

    return {
      message: "Top commented content retrieved successfully",
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
    throw new AppError("Top commented content retrieval error", 500);
  }
};

/**
 * Get comment analytics
 * @param contentId Optional content ID to filter by
 * @returns Comment analytics data
 */
export const getCommentAnalytics = async (contentId?: string) => {
  try {
    const whereClause: any = { status: "active" };
    if (contentId) {
      whereClause.contentId = contentId;
    }

    const [
      totalComments,
      commentsToday,
      commentsThisWeek,
      commentsThisMonth,
      dailyComments,
    ] = await Promise.all([
      // Total comments
      Comment.count({ where: whereClause }),

      // Comments today
      Comment.count({
        where: {
          ...whereClause,
          createdAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // Comments this week
      Comment.count({
        where: {
          ...whereClause,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Comments this month
      Comment.count({
        where: {
          ...whereClause,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Daily comments for the last 30 days
      Comment.findAll({
        where: {
          ...whereClause,
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
      message: "Comment analytics retrieved successfully",
      data: {
        totalComments,
        commentsToday,
        commentsThisWeek,
        commentsThisMonth,
        dailyComments: dailyComments.map((item: any) => ({
          date: item.getDataValue("date"),
          count: parseInt(item.getDataValue("count")),
        })),
        contentId,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Comment analytics retrieval error", 500);
  }
};
