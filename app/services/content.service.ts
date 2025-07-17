import { Op } from "sequelize";
import sequelize from "../config/database";
import Content, {
  TContentStatus,
  TContentType,
  TMediaType,
} from "../models/content.models";
import AppError from "../utils/app.error";
import { getPagination, getPaginationMetadata } from "../utils/pagination";
import { GenerateImageWithAI } from "./ai.service";

interface CreateContentPayload {
  title: string;
  description?: string;
  type: TContentType;
  contentType: TMediaType;
  userId: string;
  prompt: string;
  url: string;
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

interface GenerateContentPayload {
  title: string;
  contentType?: TMediaType;
  userId: string;
  prompt: string;
  isPrivate?: boolean;
}

export const Generate = async ({
  title,
  contentType = "image",
  userId,
  prompt,
  isPrivate = false,
}: GenerateContentPayload) => {
  const transaction = await sequelize.transaction();

  try {
    const url = await GenerateImageWithAI({ prompt });
    const content = await Content.create(
      {
        title,
        type: "generated",
        contentType,
        userId,
        prompt,
        url: url,
        thumbnailUrl: url,
        status: "completed",
        isPrivate: !!isPrivate,
      },
      { transaction },
    );

    await transaction.commit();

    return {
      message: "Content Generated successfully",
      data: content,
    };
  } catch (error) {
    console.log(error);
    if (error instanceof AppError) {
      throw error;
    }
    await transaction.rollback();
    throw new AppError("CONTENT GENERATION ERROR", 500);
  }
};

export const create = async ({
  title,
  description,
  type,
  contentType,
  userId,
  prompt,
  url,
  thumbnailUrl,
  status = "pending",
  isPrivate = true,
  metaTitle,
  metaDescription,
  metaKeywords,
  ogTitle,
  ogDescription,
  ogImage,
}: CreateContentPayload) => {
  const transaction = await sequelize.transaction();

  try {
    const content = await Content.create(
      {
        title,
        description,
        type,
        contentType,
        userId,
        prompt,
        url,
        thumbnailUrl,
        status,
        isPrivate,
        metaTitle,
        metaDescription,
        metaKeywords,
        ogTitle,
        ogDescription,
        ogImage,
      },
      { transaction },
    );

    await transaction.commit();

    return {
      message: "Content created successfully",
      data: content,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    await transaction.rollback();
    throw new AppError("CONTENT CREATION ERROR", 500);
  }
};

export const getOne = async (id: string, userId?: string) => {
  try {
    const whereClause: any = { id };

    if (userId) {
      whereClause.userId = userId;
    }

    const content = await Content.findOne({
      where: whereClause,
    });

    if (!content) {
      throw new AppError("Content not found", 404);
    }

    if (content.isPrivate && (!userId || content.userId !== userId)) {
      throw new AppError("Content access denied", 403);
    }

    return {
      message: "Content retrieved successfully",
      data: content,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Content retrieval error", 500);
  }
};

interface GetAllContentOptions {
  userId?: string;
  type?: TContentType;
  contentType?: TMediaType;
  status?: TContentStatus;
  isPrivate?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export const getAll = async ({
  userId,
  type,
  contentType,
  status,
  isPrivate,
  page = 1,
  pageSize = 10,
  search,
  sortBy = "createdAt",
  sortOrder = "DESC",
}: GetAllContentOptions = {}) => {
  try {
    // Validate sortBy field to prevent SQL injection
    const allowedSortFields = [
      "id",
      "title",
      "description",
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

    const { count, rows: contents } = await Content.findAndCountAll({
      where: {
        ...(userId ? { userId } : {}),
        ...(type ? { type } : {}),
        ...(contentType ? { contentType } : {}),
        ...(status ? { status } : {}),
        ...(isPrivate !== undefined ? { isPrivate } : {}),
        ...(!userId ? { isPrivate: false } : {}),
        ...(search
          ? {
              [Op.or]: [
                { title: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } },
                { prompt: { [Op.iLike]: `%${search}%` } },
              ],
            }
          : {}),
      },
      ...getPagination({ page, pageSize }),
      order: [[validSortBy, sortOrder?.toUpperCase()]],
    });

    return {
      message: "Contents retrieved successfully",
      data: {
        contents,
        pagination: getPaginationMetadata({ page, pageSize }, count),
      },
    };
  } catch (error) {
    console.log(error, "test");
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Content retrieval error", 500);
  }
};

interface UpdateContentPayload {
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

export const updateOne = async (
  id: string,
  userId: string,
  updateData: UpdateContentPayload,
) => {
  const transaction = await sequelize.transaction();

  try {
    // First, check if the content exists and belongs to the user
    const existingContent = await Content.findOne({
      where: { id, userId },
      transaction,
    });

    if (!existingContent) {
      await transaction.rollback();
      throw new AppError("Content not found or access denied", 404);
    }

    // Update the content
    await existingContent.update(updateData, {
      where: { id, userId },
      transaction,
    });

    // Fetch the updated content
    const updatedContent = await Content.findOne({
      where: { id },
      transaction,
    });

    await transaction.commit();

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

export const deleteOne = async (id: string, userId: string) => {
  const transaction = await sequelize.transaction();

  try {
    // First, check if the content exists and belongs to the user
    const existingContent = await Content.findOne({
      where: { id, userId },
      transaction,
    });

    if (!existingContent) {
      await transaction.rollback();
      throw new AppError("Content not found or access denied", 404);
    }

    // Delete the content
    const deletedRows = await Content.destroy({
      where: { id, userId },
      transaction,
    });

    if (deletedRows === 0) {
      await transaction.rollback();
      throw new AppError("Content deletion failed", 400);
    }

    await transaction.commit();

    return {
      message: "Content deleted successfully",
      data: { id },
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Content deletion error", 500);
  }
};
