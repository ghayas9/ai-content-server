import { Request, Response } from "express";
import * as service from "../services/content.service";
import { catchAsync } from "../utils/catch-async";
import { HTTP } from "../types/status-codes";

export const create = catchAsync(async (req: Request, res: Response) => {
  const userId = req.payload.id;
  const data = await service.create({ ...req.body, userId });
  res.status(HTTP.SUCCESS.CREATED).json(data);
});
export const generate = catchAsync(async (req: Request, res: Response) => {
  const userId = req.payload.id;
  const data = await service.Generate({ ...req.body, userId });
  res.status(HTTP.SUCCESS.CREATED).json(data);
});

export const getOne = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.payload?.id;
  const data = await service.getOne(id, userId);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const getAll = catchAsync(async (req: Request, res: Response) => {
  // const userId = req.payload?.id;
  const { page, pageSize, isPrivate, ...otherQuery } = req.query;

  const data = await service.getAll({
    ...otherQuery,
    // userId,
    page: page ? parseInt(page as string) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    isPrivate:
      isPrivate === "true" ? true : isPrivate === "false" ? false : undefined,
  });
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const updateOne = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.payload.id;
  const data = await service.updateOne(id, userId, req.body);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const deleteOne = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.payload.id;
  const data = await service.deleteOne(id, userId);
  res.status(HTTP.SUCCESS.OK).json(data);
});

export const getMy = catchAsync(async (req: Request, res: Response) => {
  const userId = req.payload.id;

  const data = await service.getAll({ ...req.query, userId });
  res.status(HTTP.SUCCESS.OK).json(data);
});
