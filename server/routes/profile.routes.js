import { Router } from "express";
import {
  getProfile, updatePersonalInfo,
  addExperience, deleteExperience,
  addEducation, deleteEducation,
  updateSkills,
  uploadResume,
  uploadResumeMiddleware,
} from "../controllers/profile.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/",                        authenticate, getProfile);
router.post("/resume",                 authenticate, uploadResumeMiddleware, uploadResume);
router.patch("/personal",              authenticate, updatePersonalInfo);
router.post("/experience",             authenticate, addExperience);
router.delete("/experience/:expId",    authenticate, deleteExperience);
router.post("/education",              authenticate, addEducation);
router.delete("/education/:eduId",     authenticate, deleteEducation);
router.patch("/skills",                authenticate, updateSkills);

export default router;
