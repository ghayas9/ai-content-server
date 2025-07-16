import { Request, Response } from "express";
import * as service from "../services/views.service";
import { catchAsync } from "../utils/catch-async";
import { HTTP } from "../types/status-codes";

export const recordView = catchAsync(async (req: Request, res: Response) => {
  const { contentId } = req.params;
  const ipAddress = req.ip || req.connection.remoteAddress || "unknown";

  const data = await service.recordView({
    contentId,
    ipAddress,
    ...req.body,
  });
  res.status(HTTP.SUCCESS.CREATED).json(data);
});

export const getViewCount = catchAsync(async (req: Request, res: Response) => {
  const { contentId } = req.params;
  const data = await service.getViewCount(contentId);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const getContentAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const { contentId } = req.params;
    const data = await service.getContentAnalytics(contentId);
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const getTopViewedContent = catchAsync(
  async (req: Request, res: Response) => {
    const { limit, timeframe } = req.query;

    const data = await service.getTopViewedContent({
      limit: limit ? parseInt(limit as string) : undefined,
      timeframe: timeframe as "day" | "week" | "month" | undefined,
    });
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const getViewsByDateRange = catchAsync(
  async (req: Request, res: Response) => {
    const { contentId } = req.params;
    const { startDate, endDate, page, pageSize } = req.query;

    if (!startDate || !endDate) {
      return res.status(HTTP.CLIENT_ERROR.BAD_REQUEST).json({
        message: "Start date and end date are required",
      });
    }

    const data = await service.getViewsByDateRange(
      contentId,
      new Date(startDate as string),
      new Date(endDate as string),
      {
        page: page ? parseInt(page as string) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      },
    );
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const getGlobalAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const data = await service.getGlobalAnalytics();
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const getViews = catchAsync(async (req: Request, res: Response) => {
  const {
    contentId,
    deviceType,
    country,
    page,
    pageSize,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  } = req.query;

  const data = await service.getViews({
    contentId: contentId as string,
    deviceType: deviceType as any,
    country: country as string,
    page: page ? parseInt(page as string) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    sortBy: sortBy as string,
    sortOrder: sortOrder as "ASC" | "DESC",
  });
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const getViewTrends = catchAsync(async (req: Request, res: Response) => {
  const { contentId } = req.params;
  const { days } = req.query;

  const data = await service.getViewTrends(
    contentId,
    days ? parseInt(days as string) : undefined,
  );
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const getGlobalViewTrends = catchAsync(
  async (req: Request, res: Response) => {
    const { days } = req.query;

    const data = await service.getViewTrends(
      undefined,
      days ? parseInt(days as string) : undefined,
    );
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const getDeviceAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const { contentId } = req.query;

    const data = await service.getDeviceAnalytics(contentId as string);
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

export const getGeographicAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const { contentId } = req.query;

    const data = await service.getGeographicAnalytics(contentId as string);
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);
