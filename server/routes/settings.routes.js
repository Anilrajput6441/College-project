import { Router } from "express";
import { getSettings, updateProfile, changePassword, deleteAccount } from "../controllers/settings.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/",                authenticate, getSettings);
router.patch("/profile",       authenticate, updateProfile);
router.patch("/password",      authenticate, changePassword);
router.delete("/account",      authenticate, deleteAccount);

export default router;
