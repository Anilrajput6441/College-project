import { Router } from "express";
import { applyToJob, getMyApplications, updateApplicationStatus } from "../controllers/apply.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", authenticate, applyToJob);
router.get("/my-applications", authenticate, getMyApplications);
router.patch("/:jobId/status", authenticate, updateApplicationStatus);

export default router;
