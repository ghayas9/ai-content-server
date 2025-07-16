import { Request, Response } from "express";
import * as service from "../services/comments.service";
import { catchAsync } from "../utils/catch-async";
import { HTTP } from "../types/status-codes";

export const create = catchAsync(async (req: Request, res: Response) => {
  const userId = req.payload.id;
  const data = await service.createComment({ ...req.body, userId });
  res.status(HTTP.SUCCESS.CREATED).json(data);
});

export const getCommentsForContent = catchAsync(
  async (req: Request, res: Response) => {
    const { contentId } = req.params;
    const { page, pageSize, includePinned, includeReplies } = req.query;

    const data = await service.getCommentsForContent(contentId, {
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      includePinned:
        includePinned === "true"
          ? true
          : includePinned === "false"
            ? false
            : undefined,
      includeReplies:
        includeReplies === "true"
          ? true
          : includeReplies === "false"
            ? false
            : undefined,
    });
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const getOne = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.payload?.id;
  const data = await service.getCommentById(id, userId);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const updateOne = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.payload.id;
  const data = await service.updateComment(id, userId, req.body);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const deleteOne = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.payload.id;
  const data = await service.deleteComment(id, userId);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const getReplies = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const { page, pageSize } = req.query;

  const data = await service.getReplies(commentId, {
    page: page ? parseInt(page as string) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string) : undefined,
  });
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const getUserComments = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { page, pageSize } = req.query;

    const data = await service.getUserComments(userId, {
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const getMyComments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.payload.id;
  const { page, pageSize } = req.query;

  const data = await service.getUserComments(userId, {
    page: page ? parseInt(page as string) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string) : undefined,
  });
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const togglePin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isPinned } = req.body;

  const data = await service.togglePinComment(id, isPinned);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const report = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const reporterId = req.payload.id;

  const data = await service.reportComment(id, reporterId);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const getReported = catchAsync(async (req: Request, res: Response) => {
  const { page, pageSize } = req.query;

  const data = await service.getReportedComments({
    page: page ? parseInt(page as string) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string) : undefined,
  });
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const moderate = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action } = req.body;

  const data = await service.moderateComment(id, action);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const search = catchAsync(async (req: Request, res: Response) => {
  const { query, contentId, page, pageSize } = req.query;

  if (!query) {
    return res.status(HTTP.CLIENT_ERROR.BAD_REQUEST).json({
      message: "Search query is required",
    });
  }

  const data = await service.searchComments(query as string, {
    contentId: contentId as string,
    page: page ? parseInt(page as string) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string) : undefined,
  });
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const getTopCommented = catchAsync(
  async (req: Request, res: Response) => {
    const { limit, timeframe } = req.query;

    const data = await service.getTopCommentedContent({
      limit: limit ? parseInt(limit as string) : undefined,
      timeframe: timeframe as "day" | "week" | "month" | undefined,
    });
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const getAnalytics = catchAsync(async (req: Request, res: Response) => {
  const { contentId } = req.query;

  const data = await service.getCommentAnalytics(contentId as string);
  res.status(HTTP.SUCCESS.OK).json(data);
});
