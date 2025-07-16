import { Router } from "express";
import * as controller from "../controllers/views.controller";
import * as schema from "../schemas/views.schemas";
import { validate } from "../middleware/validation.middleware";
import { isAuthenticated } from "../middleware/authentication";

const router = Router();

// Public routes
router.post("/:contentId", validate(schema.recordView), controller.recordView);
router.get(
  "/count/:contentId",
  validate(schema.getViewCount),
  controller.getViewCount,
);
router.get(
  "/analytics/:contentId",
  validate(schema.getContentAnalytics),
  controller.getContentAnalytics,
);
router.get(
  "/top",
  validate(schema.getTopViewedContent),
  controller.getTopViewedContent,
);
router.get(
  "/range/:contentId",
  validate(schema.getViewsByDateRange),
  controller.getViewsByDateRange,
);
router.get(
  "/trends/:contentId",
  validate(schema.getViewTrends),
  controller.getViewTrends,
);
router.get(
  "/trends/global",
  validate(schema.getGlobalViewTrends),
  controller.getGlobalViewTrends,
);
router.get(
  "/device-analytics",
  validate(schema.getDeviceAnalytics),
  controller.getDeviceAnalytics,
);
router.get(
  "/geographic-analytics",
  validate(schema.getGeographicAnalytics),
  controller.getGeographicAnalytics,
);
router.get("/global-analytics", controller.getGlobalAnalytics);
router.get("/", validate(schema.getViews), controller.getViews);

export default router;
