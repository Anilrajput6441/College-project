import { Router } from "express";
import { getAllJobs, proxyJobLogo } from "../controllers/jobs.controller.js";

const router = Router();

router.get("/logo", proxyJobLogo);
router.get("/", getAllJobs);

export default router;
