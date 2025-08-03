import { Router } from "express";
import users from "./user.routes";
import content from "./content.routes";
import { isAdmin } from "../../middleware/authentication";

const router = Router();
router.use(isAdmin);
router.use("/users", users);
router.use("/content", content);

export default router;
