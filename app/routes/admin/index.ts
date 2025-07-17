import { Router } from "express";
import users from "./user.routes";
import { isAdmin } from "../../middleware/authentication";

const router = Router();
router.use(isAdmin);
router.use("/users", users);

export default router;
