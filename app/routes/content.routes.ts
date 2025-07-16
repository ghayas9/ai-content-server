import { Router } from "express";
import * as controller from "../controllers/content.controller";
import * as schema from "../schemas/content.schemas";
import { validate } from "../middleware/validation.middleware";
import { isAuthenticated } from "../middleware/authentication";

const router = Router();

router.get("/", validate(schema.getAllContent), controller.getAll);

router.post(
  "/",
  isAuthenticated,
  validate(schema.createContent),
  controller.create,
);

router.post(
  "/generate",
  isAuthenticated,
  validate(schema.generateContent),
  controller.generate,
);
router.get(
  "/my",
  isAuthenticated,
  validate(schema.getAllContent),
  controller.getMy,
);
router.put(
  "/:id",
  isAuthenticated,
  validate(schema.updateContent),
  controller.updateOne,
);
router.delete(
  "/:id",
  isAuthenticated,
  validate(schema.deleteContent),
  controller.deleteOne,
);

router.get("/:id", validate(schema.getContentById), controller.getOne);

export default router;
