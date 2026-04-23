import { Router } from "express";
import { getAllJobs } from "../controllers/jobs.controller.js";

const router = Router();

router.get("/", getAllJobs);

export default router;
