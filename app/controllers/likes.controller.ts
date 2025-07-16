import { Request, Response } from "express";
import * as service from "../services/likes.service";
import { catchAsync } from "../utils/catch-async";
import { HTTP } from "../types/status-codes";

export const toggleLike = catchAsync(async (req: Request, res: Response) => {
  const userId = req.payload.id;
  const { contentId } = req.body;
  const data = await service.toggleLike({ userId, contentId });
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const hasUserLiked = catchAsync(async (req: Request, res: Response) => {
  const userId = req.payload.id;
  const { contentId } = req.params;
  const data = await service.hasUserLiked(userId, contentId);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const getLikeCount = catchAsync(async (req: Request, res: Response) => {
  const { contentId } = req.params;
  const data = await service.getLikeCount(contentId);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const getUsersWhoLiked = catchAsync(
  async (req: Request, res: Response) => {
    const { contentId } = req.params;
    const { page, pageSize } = req.query;

    const data = await service.getUsersWhoLiked(contentId, {
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const getContentLikedByUser = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { page, pageSize } = req.query;

    const data = await service.getContentLikedByUser(userId, {
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const getMyLikedContent = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.payload.id;
    const { page, pageSize } = req.query;

    const data = await service.getContentLikedByUser(userId, {
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const getTopLikedContent = catchAsync(
  async (req: Request, res: Response) => {
    const { limit, timeframe } = req.query;

    const data = await service.getTopLikedContent({
      limit: limit ? parseInt(limit as string) : undefined,
      timeframe: timeframe as "day" | "week" | "month" | undefined,
    });
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const getLikeAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const { contentId } = req.params;
    const data = await service.getLikeAnalytics(contentId);
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const getUserLikeHistory = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { page, pageSize, sortBy, sortOrder } = req.query;

    const data = await service.getUserLikeHistory(userId, {
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "ASC" | "DESC",
    });
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const getMyLikeHistory = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.payload.id;
    const { page, pageSize, sortBy, sortOrder } = req.query;

    const data = await service.getUserLikeHistory(userId, {
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "ASC" | "DESC",
    });
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const removeLike = catchAsync(async (req: Request, res: Response) => {
  const userId = req.payload.id;
  const { contentId } = req.params;
  const data = await service.removeLike(userId, contentId);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const getGlobalLikeStats = catchAsync(
  async (req: Request, res: Response) => {
    const data = await service.getGlobalLikeStats();
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);
