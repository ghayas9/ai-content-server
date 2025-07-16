import { Op, fn, col } from "sequelize";
import sequelize from "../config/database";
import View, { TDeviceType } from "../models/views.models";
import Content from "../models/content.models";
import AppError from "../utils/app.error";
import { getPagination, getPaginationMetadata } from "../utils/pagination";

interface RecordViewPayload {
  contentId: string;
  ipAddress: string;
  browserName?: string;
  browserVersion?: string;
  deviceType?: TDeviceType;
  deviceBrand?: string;
  deviceModel?: string;
  osName?: string;
  osVersion?: string;
  screenResolution?: string;
  country?: string;
  city?: string;
  userAgent?: string;
  referrer?: string;
}

interface GetViewsOptions {
  contentId?: string;
  deviceType?: TDeviceType;
  country?: string;
  page?: number;
  pageSize?: number;
  startDate?: Date;
  endDate?: Date;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

interface GetTopViewedContentOptions {
  limit?: number;
  timeframe?: "day" | "week" | "month";
}

/**
 * Record a view for content (only if IP hasn't viewed before)
 * @param payload View recording payload
 * @returns Result of view recording
 */
export const recordView = async (payload: RecordViewPayload) => {
  const transaction = await sequelize.transaction();

  try {
    const { contentId, ipAddress, ...viewData } = payload;

    // Check if content exists
    const content = await Content.findByPk(contentId, { transaction });
    if (!content) {
      await transaction.rollback();
      throw new AppError("Content not found", 404);
    }

    try {
      // Check if this IP has already viewed this content
      const existingView = await View.findOne({
        where: {
          contentId,
          ipAddress,
        },
        transaction,
      });

      if (existingView) {
        await transaction.commit();
        return {
          message: "View already recorded for this IP",
          data: {
            contentId,
            ipAddress,
            isNewView: false,
          },
        };
      }

      // Create new view record
      const view = await View.create(
        {
          contentId,
          ipAddress,
          ...viewData,
        },
        { transaction },
      );

      await transaction.commit();

      return {
        message: "View recorded successfully",
        data: {
          view,
          contentId,
          ipAddress,
          isNewView: true,
        },
      };
    } catch (error) {
      // Handle unique constraint violation gracefully
      if (
        error instanceof Error &&
        error.name === "SequelizeUniqueConstraintError"
      ) {
        await transaction.commit();
        return {
          message: "View already recorded for this IP",
          data: {
            contentId,
            ipAddress,
            isNewView: false,
          },
        };
      }
      throw error;
    }
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("View recording error", 500);
  }
};

/**
 * Get view count for specific content
 * @param contentId Content ID
 * @returns Number of views for the content
 */
export const getViewCount = async (contentId: string) => {
  try {
    // Check if content exists
    const content = await Content.findByPk(contentId);
    if (!content) {
      throw new AppError("Content not found", 404);
    }

    const viewCount = await View.count({
      where: {
        contentId,
      },
    });

    return {
      message: "View count retrieved successfully",
      data: {
        contentId,
        viewCount,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("View count retrieval error", 500);
  }
};

/**
 * Get comprehensive analytics for content
 * @param contentId Content ID
 * @returns Detailed analytics data
 */
export const getContentAnalytics = async (contentId: string) => {
  try {
    // Check if content exists
    const content = await Content.findByPk(contentId);
    if (!content) {
      throw new AppError("Content not found", 404);
    }

    const [
      totalViews,
      deviceTypes,
      browsers,
      operatingSystems,
      countries,
      topReferrers,
    ] = await Promise.all([
      // Total views
      View.count({
        where: { contentId },
      }),

      // Device types
      View.findAll({
        where: { contentId },
        attributes: ["deviceType", [fn("COUNT", col("id")), "count"]],
        group: ["deviceType"],
        order: [[fn("COUNT", col("id")), "DESC"]],
      }),

      // Browsers
      View.findAll({
        where: { contentId },
        attributes: ["browserName", [fn("COUNT", col("id")), "count"]],
        group: ["browserName"],
        order: [[fn("COUNT", col("id")), "DESC"]],
        limit: 10,
      }),

      // Operating Systems
      View.findAll({
        where: { contentId },
        attributes: ["osName", [fn("COUNT", col("id")), "count"]],
        group: ["osName"],
        order: [[fn("COUNT", col("id")), "DESC"]],
        limit: 10,
      }),

      // Countries
      View.findAll({
        where: { contentId },
        attributes: ["country", [fn("COUNT", col("id")), "count"]],
        group: ["country"],
        order: [[fn("COUNT", col("id")), "DESC"]],
        limit: 10,
      }),

      // Top referrers
      View.findAll({
        where: {
          contentId,
          referrer: { [Op.ne]: null },
        },
        attributes: ["referrer", [fn("COUNT", col("id")), "count"]],
        group: ["referrer"],
        order: [[fn("COUNT", col("id")), "DESC"]],
        limit: 10,
      }),
    ]);

    const analytics = {
      totalViews,
      uniqueViews: totalViews, // Since each IP can only view once, unique = total
      deviceTypes: deviceTypes.map((item: any) => ({
        type: item.deviceType || "unknown",
        count: parseInt(item.getDataValue("count")),
      })),
      browsers: browsers.map((item: any) => ({
        name: item.browserName || "unknown",
        count: parseInt(item.getDataValue("count")),
      })),
      operatingSystems: operatingSystems.map((item: any) => ({
        name: item.osName || "unknown",
        count: parseInt(item.getDataValue("count")),
      })),
      countries: countries.map((item: any) => ({
        country: item.country || "unknown",
        count: parseInt(item.getDataValue("count")),
      })),
      topReferrers: topReferrers.map((item: any) => ({
        referrer: item.referrer,
        count: parseInt(item.getDataValue("count")),
      })),
    };

    return {
      message: "Content analytics retrieved successfully",
      data: {
        contentId,
        contentTitle: content.title,
        ...analytics,
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
 * Get top viewed content
 * @param options Query options
 * @returns List of top viewed content
 */
export const getTopViewedContent = async (
  options: GetTopViewedContentOptions = {},
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

    const results = await View.findAll({
      where: dateFilter,
      include: [
        {
          model: Content,
          as: "content",
          required: true,
        },
      ],
      attributes: ["contentId", [fn("COUNT", col("id")), "viewCount"]],
      group: ["contentId", "content.id"],
      order: [[fn("COUNT", col("id")), "DESC"]],
      limit,
    });

    const topContent = results.map((result: any) => ({
      content: result.content,
      viewCount: parseInt(result.getDataValue("viewCount")),
    }));

    return {
      message: "Top viewed content retrieved successfully",
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
 * Get views for content within date range
 * @param contentId Content ID
 * @param startDate Start date
 * @param endDate End date
 * @param options Additional options
 * @returns Views within date range
 */
export const getViewsByDateRange = async (
  contentId: string,
  startDate: Date,
  endDate: Date,
  options: GetViewsOptions = {},
) => {
  try {
    const { page = 1, pageSize = 10 } = options;

    // Check if content exists
    const content = await Content.findByPk(contentId);
    if (!content) {
      throw new AppError("Content not found", 404);
    }

    const views = await View.findAll({
      where: {
        contentId,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [["createdAt", "DESC"]],
    });

    // Get total count for pagination
    const totalCount = await View.count({
      where: {
        contentId,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    return {
      message: "Views by date range retrieved successfully",
      data: {
        views,
        pagination: getPaginationMetadata({ page, pageSize }, totalCount),
        contentId,
        startDate,
        endDate,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Views retrieval error", 500);
  }
};

/**
 * Get global view analytics
 * @returns Global view statistics
 */
export const getGlobalAnalytics = async () => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalViews,
      viewsToday,
      viewsThisWeek,
      viewsThisMonth,
      topDeviceTypes,
      topBrowsers,
      topCountries,
    ] = await Promise.all([
      View.count(),
      View.count({ where: { createdAt: { [Op.gte]: today } } }),
      View.count({ where: { createdAt: { [Op.gte]: weekAgo } } }),
      View.count({ where: { createdAt: { [Op.gte]: monthAgo } } }),

      View.findAll({
        attributes: ["deviceType", [fn("COUNT", col("id")), "count"]],
        group: ["deviceType"],
        order: [[fn("COUNT", col("id")), "DESC"]],
        limit: 5,
      }),

      View.findAll({
        attributes: ["browserName", [fn("COUNT", col("id")), "count"]],
        group: ["browserName"],
        order: [[fn("COUNT", col("id")), "DESC"]],
        limit: 5,
      }),

      View.findAll({
        attributes: ["country", [fn("COUNT", col("id")), "count"]],
        group: ["country"],
        order: [[fn("COUNT", col("id")), "DESC"]],
        limit: 5,
      }),
    ]);

    const analytics = {
      totalViews,
      viewsToday,
      viewsThisWeek,
      viewsThisMonth,
      topDeviceTypes: topDeviceTypes.map((item: any) => ({
        type: item.deviceType || "unknown",
        count: parseInt(item.getDataValue("count")),
      })),
      topBrowsers: topBrowsers.map((item: any) => ({
        name: item.browserName || "unknown",
        count: parseInt(item.getDataValue("count")),
      })),
      topCountries: topCountries.map((item: any) => ({
        country: item.country || "unknown",
        count: parseInt(item.getDataValue("count")),
      })),
    };

    return {
      message: "Global analytics retrieved successfully",
      data: analytics,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Global analytics retrieval error", 500);
  }
};

/**
 * Get views with filtering and pagination
 * @param options Query options
 * @returns Filtered views list
 */
export const getViews = async (options: GetViewsOptions = {}) => {
  try {
    const {
      contentId,
      deviceType,
      country,
      page = 1,
      pageSize = 10,
      startDate,
      endDate,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = options;

    // Build where clause
    const whereClause: any = {};

    if (contentId) {
      whereClause.contentId = contentId;
    }

    if (deviceType) {
      whereClause.deviceType = deviceType;
    }

    if (country) {
      whereClause.country = country;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      whereClause.createdAt = {
        [Op.gte]: startDate,
      };
    } else if (endDate) {
      whereClause.createdAt = {
        [Op.lte]: endDate,
      };
    }

    // Validate sortBy field
    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "deviceType",
      "browserName",
      "osName",
      "country",
    ];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const { count, rows: views } = await View.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Content,
          as: "content",
          attributes: ["id", "title", "slug", "contentType"],
        },
      ],
      ...getPagination({ page, pageSize }),
      order: [[validSortBy, sortOrder.toUpperCase()]],
    });

    return {
      message: "Views retrieved successfully",
      data: {
        views,
        pagination: getPaginationMetadata({ page, pageSize }, count),
        filters: {
          contentId,
          deviceType,
          country,
          startDate,
          endDate,
        },
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Views retrieval error", 500);
  }
};

/**
 * Get view trends over time
 * @param contentId Optional content ID to filter by
 * @param days Number of days to look back (default: 30)
 * @returns View trends data
 */
export const getViewTrends = async (contentId?: string, days: number = 30) => {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const whereClause: any = {
      createdAt: {
        [Op.gte]: startDate,
      },
    };

    if (contentId) {
      whereClause.contentId = contentId;
    }

    const trends = await View.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn("DATE", sequelize.col("created_at")), "date"],
        [sequelize.fn("COUNT", sequelize.col("id")), "views"],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("ip_address")),
          ),
          "uniqueViews",
        ],
      ],
      group: [sequelize.fn("DATE", sequelize.col("created_at"))],
      order: [[sequelize.fn("DATE", sequelize.col("created_at")), "ASC"]],
    });

    return {
      message: "View trends retrieved successfully",
      data: {
        trends: trends.map((item: any) => ({
          date: item.getDataValue("date"),
          views: parseInt(item.getDataValue("views")),
          uniqueViews: parseInt(item.getDataValue("uniqueViews")),
        })),
        contentId,
        days,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("View trends retrieval error", 500);
  }
};

/**
 * Get device analytics
 * @param contentId Optional content ID to filter by
 * @returns Device analytics data
 */
export const getDeviceAnalytics = async (contentId?: string) => {
  try {
    const whereClause: any = {};
    if (contentId) {
      whereClause.contentId = contentId;
    }

    const [deviceTypes, browsers, operatingSystems] = await Promise.all([
      // Device types
      View.findAll({
        where: whereClause,
        attributes: [
          "deviceType",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["deviceType"],
        order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
      }),

      // Browsers
      View.findAll({
        where: whereClause,
        attributes: [
          "browserName",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["browserName"],
        order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
        limit: 10,
      }),

      // Operating Systems
      View.findAll({
        where: whereClause,
        attributes: [
          "osName",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["osName"],
        order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
        limit: 10,
      }),
    ]);

    return {
      message: "Device analytics retrieved successfully",
      data: {
        deviceTypes: deviceTypes.map((item: any) => ({
          type: item.deviceType || "unknown",
          count: parseInt(item.getDataValue("count")),
        })),
        browsers: browsers.map((item: any) => ({
          name: item.browserName || "unknown",
          count: parseInt(item.getDataValue("count")),
        })),
        operatingSystems: operatingSystems.map((item: any) => ({
          name: item.osName || "unknown",
          count: parseInt(item.getDataValue("count")),
        })),
        contentId,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Device analytics retrieval error", 500);
  }
};

/**
 * Get geographic analytics
 * @param contentId Optional content ID to filter by
 * @returns Geographic analytics data
 */
export const getGeographicAnalytics = async (contentId?: string) => {
  try {
    const whereClause: any = {};
    if (contentId) {
      whereClause.contentId = contentId;
    }

    const [countries, cities] = await Promise.all([
      // Countries
      View.findAll({
        where: {
          ...whereClause,
          country: { [Op.ne]: null },
        },
        attributes: [
          "country",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["country"],
        order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
        limit: 10,
      }),

      // Cities
      View.findAll({
        where: {
          ...whereClause,
          city: { [Op.ne]: null },
        },
        attributes: [
          "city",
          "country",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["city", "country"],
        order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
        limit: 15,
      }),
    ]);

    return {
      message: "Geographic analytics retrieved successfully",
      data: {
        countries: countries.map((item: any) => ({
          country: item.country,
          count: parseInt(item.getDataValue("count")),
        })),
        cities: cities.map((item: any) => ({
          city: item.city,
          country: item.country,
          count: parseInt(item.getDataValue("count")),
        })),
        contentId,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Geographic analytics retrieval error", 500);
  }
};
