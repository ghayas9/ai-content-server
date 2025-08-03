import { Request, Response } from "express";
import * as service from "../../services/admin/content.service";
import { catchAsync } from "../../utils/catch-async";
import { HTTP } from "../../types/status-codes";

// Get all content with filtering and pagination
export const getAllContent = catchAsync(async (req: Request, res: Response) => {
  const { page, pageSize, dateFrom, dateTo, includeDeleted, ...otherQuery } =
    req.query;

  const data = await service.getAll({
    ...otherQuery,
    page: page ? parseInt(page as string) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
    dateTo: dateTo ? new Date(dateTo as string) : undefined,
    includeDeleted: includeDeleted === "true",
  });
  res.status(HTTP.SUCCESS.OK).json(data);
});

// Get a single content by ID
export const getContentById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { includeDeleted } = req.query;
    const data = await service.getOne(id, includeDeleted === "true");
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

// Update content
export const updateContent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await service.updateOne({ id, ...req.body });
  res.status(HTTP.SUCCESS.OK).json(data);
});

// Delete content (soft delete)
export const deleteContent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await service.deleteOne(id);
  res.status(HTTP.SUCCESS.OK).json(data);
});

// Restore deleted content
export const restoreContent = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await service.RestoreOne(id);
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

// Permanently delete content
export const permanentlyDeleteContent = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await service.bulkDelete([id], true);
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

// Bulk delete content
export const bulkDeleteContent = catchAsync(
  async (req: Request, res: Response) => {
    const { ids, hardDelete } = req.body;
    const data = await service.bulkDelete(ids, hardDelete || false);
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

// Bulk restore content
export const bulkRestoreContent = catchAsync(
  async (req: Request, res: Response) => {
    const { ids } = req.body;
    const data = await service.RestoreMulti(ids);
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

// Bulk update content status
export const bulkUpdateContentStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { ids, status } = req.body;
    const data = await service.bulkUpdateStatus(ids, status);
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

// Get content statistics
export const getContentStats = catchAsync(
  async (req: Request, res: Response) => {
    const { period, startDate, endDate } = req.query;
    const data = await service.getStats({
      period: period as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.status(HTTP.SUCCESS.OK).json(data);
  },
);

// Export content
export const exportContent = catchAsync(async (req: Request, res: Response) => {
  const {
    format = "json",
    dateFrom,
    dateTo,
    includeDeleted,
    includeAnalytics,
    ...otherFilters
  } = req.query;

  const filters = {
    ...otherFilters,
    dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
    dateTo: dateTo ? new Date(dateTo as string) : undefined,
    includeDeleted: includeDeleted === "true",
    includeAnalytics: includeAnalytics !== "false",
  };

  const data = await service.exportContent(filters, format as "csv" | "json");

  if (data.data) {
    res.setHeader("Content-Type", data.data.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${data.data.filename}"`,
    );
    res.send(data.data.content);
  } else {
    res.status(HTTP.SUCCESS.OK).json(data);
  }
});
