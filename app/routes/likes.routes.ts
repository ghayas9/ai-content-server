import { Router } from "express";
import * as controller from "../controllers/likes.controller";
import * as schema from "../schemas/likes.schemas";
import { validate } from "../middleware/validation.middleware";
import { isAuthenticated } from "../middleware/authentication";

const router = Router();

// Public routes
router.get(
  "/count/:contentId",
  validate(schema.getLikeCount),
  controller.getLikeCount,
);
router.get(
  "/users/:contentId",
  validate(schema.getUsersWhoLiked),
  controller.getUsersWhoLiked,
);
router.get(
  "/content/:userId",
  validate(schema.getContentLikedByUser),
  controller.getContentLikedByUser,
);
router.get(
  "/top",
  validate(schema.getTopLikedContent),
  controller.getTopLikedContent,
);
router.get(
  "/analytics/:contentId",
  validate(schema.getLikeAnalytics),
  controller.getLikeAnalytics,
);
router.get(
  "/history/:userId",
  validate(schema.getUserLikeHistory),
  controller.getUserLikeHistory,
);
router.get("/stats/global", controller.getGlobalLikeStats);

// Authenticated routes
router.post(
  "/toggle",
  isAuthenticated,
  validate(schema.toggleLike),
  controller.toggleLike,
);

router.get(
  "/check/:contentId",
  isAuthenticated,
  validate(schema.hasUserLiked),
  controller.hasUserLiked,
);

router.get(
  "/my/content",
  isAuthenticated,
  validate(schema.getMyLikedContent),
  controller.getMyLikedContent,
);

router.get(
  "/my/history",
  isAuthenticated,
  validate(schema.getMyLikeHistory),
  controller.getMyLikeHistory,
);

router.delete(
  "/:contentId",
  isAuthenticated,
  validate(schema.removeLike),
  controller.removeLike,
);

export default router;
