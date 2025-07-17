import { Router } from "express";
import auth from "./auth.routes";
import content from "./content.routes";
import admin from "./admin/index";
import { isAuthOrUnAuth } from "../middleware/authentication";

const router = Router();
router.use(isAuthOrUnAuth);
router.use("/admin", admin);
router.use("/auth", auth);
router.use("/content", content);

export default router;
