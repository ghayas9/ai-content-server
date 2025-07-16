import { Router } from "express";
import auth from "./auth.routes";
import content from "./content.routes";
import { isAuthOrUnAuth } from "../middleware/authentication";

const router = Router();
router.use(isAuthOrUnAuth);
router.use("/auth", auth);
router.use("/content", content);

export default router;
