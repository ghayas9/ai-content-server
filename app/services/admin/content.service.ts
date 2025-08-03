import { Op, QueryTypes } from "sequelize";
import sequelize from "../../config/database";
import Content, {
  TContentType,
  TMediaType,
  TContentStatus,
} from "../../models/content.models";
import User from "../../models/user.models";
import AppError from "../../utils/app.error";
import { getPagination, getPaginationMetadata } from "../../utils/pagination";
import View from "../../models/views.models";
import Like from "../../models/likes.models";
import Comment from "../../models/comments.models";

interface GetAllContentOptions {
  type?: TContentType;
  contentType?: TMediaType;
  status?: TContentStatus;
  isPrivate?: boolean;
  userId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  dateFrom?: Date;
  dateTo?: Date;
  includeDeleted?: boolean;
}

interface UpdateContentPayload {
  id: string;
  title?: string;
  description?: string;
  type?: TContentType;
  contentType?: TMediaType;
  prompt?: string;
  url?: string;
  thumbnailUrl?: string;
  status?: TContentStatus;
  isPrivate?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

// Get all content with filtering and pagination
export const getAll = async ({
  type,
  contentType,
  status,
  isPrivate,
  userId,
  page = 1,
  pageSize = 10,
  search,
  sortBy = "createdAt",
  sortOrder = "DESC",
  dateFrom,
  dateTo,
  includeDeleted = false,
}: GetAllContentOptions = {}) => {
  try {
    // Validate sortBy field to prevent SQL injection
    const allowedSortFields = [
      "id",
      "title",
      "type",
      "contentType",
      "status",
      "isPrivate",
      "createdAt",
      "updatedAt",
    ];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    // Build where clause
    const whereClause: any = {};

    if (type) whereClause.type = type;
    if (contentType) whereClause.contentType = contentType;
    if (status) whereClause.status = status;
    if (isPrivate !== undefined) whereClause.isPrivate = isPrivate;
    if (userId) whereClause.userId = userId;

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { prompt: { [Op.iLike]: `%${search}%` } },
        { id: { [Op.iLike]: `%${search}%` } },
        { slug: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt[Op.gte] = dateFrom;
      if (dateTo) whereClause.createdAt[Op.lte] = dateTo;
    }

    const { count, rows: contents } = await Content.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: {
            exclude: ["password"],
          },
        },
        // {
        //   model: View,
        //   as: "views",
        //   attributes: [],
        // },
        {
          model: Like,
          as: "likes",
          attributes: [],
        },
        {
          model: Comment,
          as: "comments",
          attributes: [],
          where: { status: "active" },
          required: false,
        },
      ],
      attributes: {
        include: [
          //   [
          //     sequelize.fn(
          //       "COUNT",
          //       sequelize.fn("DISTINCT", sequelize.col("views.id")),
          //     ),
          //     "viewCount",
          //   ],
          [
            sequelize.fn(
              "COUNT",
              sequelize.fn("DISTINCT", sequelize.col("likes.id")),
            ),
            "likeCount",
          ],
          [
            sequelize.fn(
              "COUNT",
              sequelize.fn("DISTINCT", sequelize.col("comments.id")),
            ),
            "commentCount",
          ],
        ],
      },
      group: ["Content.id", "user.id"],
      ...getPagination({ page, pageSize }),
      order: [[validSortBy, sortOrder.toUpperCase()]],
      paranoid: !includeDeleted,
      subQuery: false,
    });

    return {
      message: "Contents retrieved successfully",
      data: contents,
      pagination: getPaginationMetadata({ page, pageSize }, count.length),
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.log(error, "mm");
    throw new AppError("Content retrieval error", 500);
  }
};

export const getOne = async (contentId: string, includeDeleted = false) => {
  try {
    const content = await Content.findByPk(contentId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: {
            exclude: ["password"],
          },
        },
        {
          model: View,
          as: "views",
          limit: 10,
          order: [["createdAt", "DESC"]],
        },
        {
          model: Like,
          as: "likes",
          attributes: ["id", "userId", "createdAt"],
          include: [
            {
              model: User,
              as: "user",
              attributes: {
                exclude: ["password"],
              },
            },
          ],
          limit: 10,
          order: [["createdAt", "DESC"]],
        },
        {
          model: Comment,
          as: "comments",
          attributes: ["id", "text", "status", "isPinned", "createdAt"],
          include: [
            {
              model: User,
              as: "user",
              attributes: {
                exclude: ["password"],
              },
            },
          ],
          limit: 10,
          order: [["createdAt", "DESC"]],
        },
      ],
      paranoid: !includeDeleted,
    });

    if (!content) {
      throw new AppError("Content not found", 404);
    }

    // Get additional analytics
    const analytics = await Promise.all([
      View.count({ where: { contentId } }),
      Like.count({ where: { contentId } }),
      Comment.count({ where: { contentId, status: "active" } }),
    ]);

    const contentWithAnalytics = {
      ...content.toJSON(),
      analytics: {
        totalViews: analytics[0],
        totalLikes: analytics[1],
        totalComments: analytics[2],
      },
    };

    return {
      message: "Content retrieved successfully",
      data: contentWithAnalytics,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Content retrieval error", 500);
  }
};

export const deleteOne = async (contentId: string) => {
  const transaction = await sequelize.transaction();

  try {
    const content = await Content.findByPk(contentId, { transaction });

    if (!content) {
      await transaction.rollback();
      throw new AppError("Content not found", 404);
    }

    await content.destroy({ transaction });

    await transaction.commit();

    return {
      message: "Content deleted successfully",
      data: { id: contentId },
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Content deletion error", 500);
  }
};

export const updateOne = async (data: UpdateContentPayload) => {
  const transaction = await sequelize.transaction();

  try {
    const content = await Content.findByPk(data?.id, { transaction });

    if (!content) {
      await transaction.rollback();
      throw new AppError("Content not found", 404);
    }

    await content.update(data, { transaction });

    await transaction.commit();

    // Fetch updated content with associations
    const updatedContent = await Content.findByPk(data?.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: {
            exclude: ["password"],
          },
        },
      ],
    });

    return {
      message: "Content updated successfully",
      data: updatedContent,
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Content update error", 500);
  }
};

interface GetStatsOptions {
  period?: "today" | "weekly" | "monthly" | "yearly" | "custom";
  startDate?: Date;
  endDate?: Date;
}

export const getStats = async ({
  period = "today",
  startDate,
  endDate,
}: GetStatsOptions) => {
  try {
    // Calculate date range based on period
    let dateRangeStart: Date;
    let dateRangeEnd: Date = new Date();

    switch (period) {
      case "today":
        dateRangeStart = new Date();
        dateRangeStart.setHours(0, 0, 0, 0);
        dateRangeEnd.setHours(23, 59, 59, 999);
        break;

      case "weekly":
        dateRangeStart = new Date();
        dateRangeStart.setDate(dateRangeStart.getDate() - 7);
        dateRangeStart.setHours(0, 0, 0, 0);
        break;

      case "monthly":
        dateRangeStart = new Date();
        dateRangeStart.setMonth(dateRangeStart.getMonth() - 1);
        dateRangeStart.setHours(0, 0, 0, 0);
        break;

      case "yearly":
        dateRangeStart = new Date();
        dateRangeStart.setFullYear(dateRangeStart.getFullYear() - 1);
        dateRangeStart.setHours(0, 0, 0, 0);
        break;

      case "custom":
        if (!startDate || !endDate) {
          throw new AppError(
            "Start date and end date are required for custom period",
            400,
          );
        }
        dateRangeStart = new Date(startDate);
        dateRangeEnd = new Date(endDate);
        dateRangeStart.setHours(0, 0, 0, 0);
        dateRangeEnd.setHours(23, 59, 59, 999);
        break;

      default:
        throw new AppError("Invalid period specified", 400);
    }

    // Build where clause for date filtering
    const dateWhereClause = {
      createdAt: {
        [Op.gte]: dateRangeStart,
        [Op.lte]: dateRangeEnd,
      },
    };

    const [
      totalContent,
      generatedContent,
      uploadedContent,
      pendingContent,
      processingContent,
      completedContent,
      failedContent,
      publicContent,
      privateContent,
      imageContent,
      videoContent,
      audioContent,
      viewStats,
      likeStats,
      commentStats,
    ] = await Promise.all([
      Content.count({ where: dateWhereClause }),
      Content.count({ where: { ...dateWhereClause, type: "generated" } }),
      Content.count({ where: { ...dateWhereClause, type: "upload" } }),
      Content.count({ where: { ...dateWhereClause, status: "pending" } }),
      Content.count({ where: { ...dateWhereClause, status: "processing" } }),
      Content.count({ where: { ...dateWhereClause, status: "completed" } }),
      Content.count({ where: { ...dateWhereClause, status: "failed" } }),
      Content.count({ where: { ...dateWhereClause, isPrivate: false } }),
      Content.count({ where: { ...dateWhereClause, isPrivate: true } }),
      Content.count({ where: { ...dateWhereClause, contentType: "image" } }),
      Content.count({ where: { ...dateWhereClause, contentType: "video" } }),
      Content.count({ where: { ...dateWhereClause, contentType: "audio" } }),

      // Views for content created in date range
      sequelize.query(
        `
        SELECT COUNT(v.id) as totalViews
        FROM views v
        INNER JOIN contents c ON v.content_id = c.id
        WHERE c.created_at >= :startDate AND c.created_at <= :endDate
        AND c.deleted_at IS NULL
      `,
        {
          replacements: { startDate: dateRangeStart, endDate: dateRangeEnd },
          type: QueryTypes.SELECT,
          raw: true,
        },
      ),

      // Likes for content created in date range
      sequelize.query(
        `
        SELECT COUNT(l.id) as totalLikes
        FROM likes l
        INNER JOIN contents c ON l.content_id = c.id
        WHERE c.created_at >= :startDate AND c.created_at <= :endDate
        AND c.deleted_at IS NULL AND l.deleted_at IS NULL
      `,
        {
          replacements: { startDate: dateRangeStart, endDate: dateRangeEnd },
          type: QueryTypes.SELECT,
          raw: true,
        },
      ),

      // Comments for content created in date range
      sequelize.query(
        `
        SELECT COUNT(cm.id) as totalComments
        FROM comments cm
        INNER JOIN contents c ON cm.content_id = c.id
        WHERE c.created_at >= :startDate AND c.created_at <= :endDate
        AND c.deleted_at IS NULL AND cm.deleted_at IS NULL
        AND cm.status = 'active'
      `,
        {
          replacements: { startDate: dateRangeStart, endDate: dateRangeEnd },
          type: QueryTypes.SELECT,
          raw: true,
        },
      ),
    ]);

    const totalViews = parseInt((viewStats[0] as any)?.totalViews) || 0;
    const totalLikes = parseInt((likeStats[0] as any)?.totalLikes) || 0;
    const totalComments =
      parseInt((commentStats[0] as any)?.totalComments) || 0;

    return {
      message: `Content statistics for ${period} period retrieved successfully`,
      data: {
        totalContent,
        generatedContent,
        uploadedContent,
        pendingContent,
        processingContent,
        completedContent,
        failedContent,
        publicContent,
        privateContent,
        imageContent,
        videoContent,
        audioContent,
        totalViews,
        totalLikes,
        totalComments,
        averageViewsPerContent:
          totalContent > 0 ? totalViews / totalContent : 0,
        averageLikesPerContent:
          totalContent > 0 ? totalLikes / totalContent : 0,
        averageCommentsPerContent:
          totalContent > 0 ? totalComments / totalContent : 0,
        dateRange: {
          startDate: dateRangeStart,
          endDate: dateRangeEnd,
          period,
        },
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Statistics retrieval error", 500);
  }
};

export const RestoreOne = async (id: string) => {
  const transaction = await sequelize.transaction();

  try {
    // Find the soft-deleted content (paranoid: false to include deleted records)
    const content = await Content.findByPk(id, {
      transaction,
      paranoid: false,
    });

    if (!content) {
      await transaction.rollback();
      throw new AppError("Content not found", 404);
    }

    // Check if content is actually deleted
    if (!content.deletedAt) {
      await transaction.rollback();
      throw new AppError("Content is not deleted and cannot be recovered", 400);
    }

    await content.restore({ transaction });

    await transaction.commit();

    const data = await Content.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: {
            exclude: ["password"],
          },
        },
      ],
    });

    return {
      message: "Content recovered successfully",
      data: data,
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Content recovery error", 500);
  }
};

export const RestoreMulti = async (ids: string[]) => {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new AppError("Valid array of content IDs is required", 400);
  }

  const transaction = await sequelize.transaction();

  try {
    // Find all soft-deleted content items (paranoid: false to include deleted records)
    const contents = await Content.findAll({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
      transaction,
      paranoid: false,
    });

    if (contents.length === 0) {
      await transaction.rollback();
      throw new AppError("No content found with the provided IDs", 404);
    }

    // Separate found IDs from not found IDs
    const foundIds = contents.map((content) => content.id);
    const notFoundIds = ids.filter((id) => !foundIds.includes(id));

    // Separate deleted from non-deleted content
    const deletedContent = contents.filter((content) => content.deletedAt);
    const nonDeletedContent = contents.filter((content) => !content.deletedAt);

    if (deletedContent.length === 0) {
      await transaction.rollback();
      throw new AppError(
        "None of the provided content items are deleted and can be restored",
        400,
      );
    }

    // Restore all deleted content
    const restoredIds: string[] = [];
    for (const content of deletedContent) {
      await content.restore({ transaction });
      restoredIds.push(content.id);
    }

    await transaction.commit();

    // Fetch the restored content with associations
    const restoredContent = await Content.findAll({
      where: {
        id: {
          [Op.in]: restoredIds,
        },
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: {
            exclude: ["password"],
          },
        },
      ],
    });

    return {
      message: `Successfully restored ${restoredIds.length} content item(s)`,
      data: {
        restored: restoredContent,
        summary: {
          totalRequested: ids.length,
          totalRestored: restoredIds.length,
          restoredIds,
          notFoundIds,
          alreadyActiveIds: nonDeletedContent.map((content) => content.id),
        },
      },
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Content bulk restoration error", 500);
  }
};

export const bulkDelete = async (
  ids: string[],
  hardDelete: boolean = false,
) => {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new AppError("Valid array of content IDs is required", 400);
  }

  const transaction = await sequelize.transaction();

  try {
    // Find all content items to be deleted
    const contents = await Content.findAll({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
      transaction,
      paranoid: !hardDelete, // Include soft-deleted items if hard delete
    });

    if (contents.length === 0) {
      await transaction.rollback();
      throw new AppError("No content found with the provided IDs", 404);
    }

    const foundIds = contents.map((content) => content.id);
    const notFoundIds = ids.filter((id) => !foundIds.includes(id));

    let deletedIds: string[] = [];

    if (hardDelete) {
      // Permanently delete content and related data
      await Promise.all([
        // Delete related views
        sequelize.query("DELETE FROM views WHERE content_id IN (:contentIds)", {
          replacements: { contentIds: foundIds },
          transaction,
        }),
        // Delete related likes
        sequelize.query("DELETE FROM likes WHERE content_id IN (:contentIds)", {
          replacements: { contentIds: foundIds },
          transaction,
        }),
        // Delete related comments
        sequelize.query(
          "DELETE FROM comments WHERE content_id IN (:contentIds)",
          {
            replacements: { contentIds: foundIds },
            transaction,
          },
        ),
      ]);

      // Hard delete content
      await Content.destroy({
        where: {
          id: {
            [Op.in]: foundIds,
          },
        },
        force: true,
        transaction,
      });

      deletedIds = foundIds;
    } else {
      // Soft delete - only delete non-deleted content
      const activeContent = contents.filter((content) => !content.deletedAt);

      if (activeContent.length === 0) {
        await transaction.rollback();
        throw new AppError(
          "All provided content items are already deleted",
          400,
        );
      }

      const activeIds = activeContent.map((content) => content.id);

      await Content.destroy({
        where: {
          id: {
            [Op.in]: activeIds,
          },
        },
        transaction,
      });

      deletedIds = activeIds;
    }

    await transaction.commit();

    return {
      message: `Successfully ${hardDelete ? "permanently " : ""}deleted ${deletedIds.length} content item(s)`,
      data: {
        summary: {
          totalRequested: ids.length,
          totalDeleted: deletedIds.length,
          deletedIds,
          notFoundIds,
          alreadyDeletedIds: hardDelete
            ? []
            : foundIds.filter((id) => !deletedIds.includes(id)),
          deletionType: hardDelete ? "permanent" : "soft",
        },
      },
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Content bulk deletion error", 500);
  }
};

// Content Filters Interface for Export
interface ContentFilters {
  type?: TContentType;
  contentType?: TMediaType;
  status?: TContentStatus;
  isPrivate?: boolean;
  userId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  includeDeleted?: boolean;
  includeAnalytics?: boolean;
}

// Export Content Function
export const exportContent = async (
  filters: ContentFilters = {},
  format: "csv" | "json" = "json",
) => {
  try {
    const {
      type,
      contentType,
      status,
      isPrivate,
      userId,
      search,
      dateFrom,
      dateTo,
      includeDeleted = false,
      includeAnalytics = true,
    } = filters;

    // Build where clause
    const whereClause: any = {};

    if (type) whereClause.type = type;
    if (contentType) whereClause.contentType = contentType;
    if (status) whereClause.status = status;
    if (isPrivate !== undefined) whereClause.isPrivate = isPrivate;
    if (userId) whereClause.userId = userId;

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { prompt: { [Op.iLike]: `%${search}%` } },
        { id: { [Op.iLike]: `%${search}%` } },
        { slug: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt[Op.gte] = dateFrom;
      if (dateTo) whereClause.createdAt[Op.lte] = dateTo;
    }

    // Base attributes to include
    let includeAttributes: any = {
      include: [],
    };

    // Add analytics if requested
    if (includeAnalytics) {
      includeAttributes.include = [
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("views.id")),
          ),
          "viewCount",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("likes.id")),
          ),
          "likeCount",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("comments.id")),
          ),
          "commentCount",
        ],
      ];
    }

    const includeModels = [
      {
        model: User,
        as: "user",
        attributes: ["id", "username", "email", "firstName", "lastName"],
      },
    ];

    if (includeAnalytics) {
      includeModels.push(
        {
          model: View,
          as: "views",
          attributes: [],
        } as any,
        {
          model: Like,
          as: "likes",
          attributes: [],
        } as any,
        {
          model: Comment,
          as: "comments",
          attributes: [],
          where: { status: "active" },
          required: false,
        } as any,
      );
    }

    const contents = await Content.findAll({
      where: whereClause,
      include: includeModels,
      attributes: includeAttributes,
      group: includeAnalytics ? ["Content.id", "user.id"] : undefined,
      order: [["createdAt", "DESC"]],
      paranoid: !includeDeleted,
      subQuery: false,
    });

    if (contents.length === 0) {
      return {
        message: "No content found matching the specified filters",
        data: null,
        exportInfo: {
          totalRecords: 0,
          format,
          filters,
          exportedAt: new Date().toISOString(),
        },
      };
    }

    // Transform data for export
    const exportData = contents.map((content: any) => {
      const contentData = content.toJSON();

      // Flatten user data
      const flattenedData = {
        id: contentData.id,
        title: contentData.title,
        description: contentData.description,
        type: contentData.type,
        contentType: contentData.contentType,
        status: contentData.status,
        isPrivate: contentData.isPrivate,
        url: contentData.url,
        thumbnailUrl: contentData.thumbnailUrl,
        prompt: contentData.prompt,
        slug: contentData.slug,
        metaTitle: contentData.metaTitle,
        metaDescription: contentData.metaDescription,
        metaKeywords: contentData.metaKeywords,
        ogTitle: contentData.ogTitle,
        ogDescription: contentData.ogDescription,
        ogImage: contentData.ogImage,
        createdAt: contentData.createdAt,
        updatedAt: contentData.updatedAt,
        deletedAt: contentData.deletedAt,
        // User information
        userId: contentData.user?.id,
        userUsername: contentData.user?.username,
        userEmail: contentData.user?.email,
        userFirstName: contentData.user?.firstName,
        userLastName: contentData.user?.lastName,
      } as any;

      // Add analytics if included
      if (includeAnalytics) {
        flattenedData.viewCount = contentData.viewCount || 0;
        flattenedData.likeCount = contentData.likeCount || 0;
        flattenedData.commentCount = contentData.commentCount || 0;
      }

      return flattenedData;
    });

    let formattedData: string;
    let mimeType: string;
    let fileExtension: string;

    if (format === "csv") {
      // Convert to CSV
      if (exportData.length === 0) {
        formattedData = "";
      } else {
        const headers = Object.keys(exportData[0]).join(",");
        const rows = exportData
          .map((row) =>
            Object.values(row)
              .map((value) => {
                // Handle null/undefined values and escape commas/quotes
                if (value === null || value === undefined) return "";
                const stringValue = String(value);
                if (
                  stringValue.includes(",") ||
                  stringValue.includes('"') ||
                  stringValue.includes("\n")
                ) {
                  return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
              })
              .join(","),
          )
          .join("\n");
        formattedData = `${headers}\n${rows}`;
      }
      mimeType = "text/csv";
      fileExtension = "csv";
    } else {
      // JSON format
      formattedData = JSON.stringify(exportData, null, 2);
      mimeType = "application/json";
      fileExtension = "json";
    }

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `content_export_${timestamp}.${fileExtension}`;

    return {
      message: `Content exported successfully in ${format.toUpperCase()} format`,
      data: {
        content: formattedData,
        filename,
        mimeType,
        size: Buffer.byteLength(formattedData, "utf8"),
      },
      exportInfo: {
        totalRecords: contents.length,
        format,
        filters,
        exportedAt: new Date().toISOString(),
        includeAnalytics,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Content export error", 500);
  }
};

// Additional helper function for bulk status update
export const bulkUpdateStatus = async (
  ids: string[],
  status: TContentStatus,
) => {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new AppError("Valid array of content IDs is required", 400);
  }

  const validStatuses: TContentStatus[] = [
    "pending",
    "processing",
    "completed",
    "failed",
  ];
  if (!validStatuses.includes(status)) {
    throw new AppError("Invalid status provided", 400);
  }

  const transaction = await sequelize.transaction();

  try {
    const [affectedCount] = await Content.update(
      { status },
      {
        where: {
          id: {
            [Op.in]: ids,
          },
        },
        transaction,
      },
    );

    if (affectedCount === 0) {
      await transaction.rollback();
      throw new AppError("No content found with the provided IDs", 404);
    }

    await transaction.commit();

    // Fetch updated content
    const updatedContent = await Content.findAll({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: {
            exclude: ["password"],
          },
        },
      ],
    });

    return {
      message: `Successfully updated status to "${status}" for ${affectedCount} content item(s)`,
      data: {
        updatedContent,
        summary: {
          totalRequested: ids.length,
          totalUpdated: affectedCount,
          newStatus: status,
        },
      },
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Content bulk status update error", 500);
  }
};
