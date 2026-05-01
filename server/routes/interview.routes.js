import express from "express";
import { chat, generateSummary, generateQuestions } from "../controllers/interview.controller.js";

const router = express.Router();

router.post("/chat", chat);
router.post("/summary", generateSummary);
router.post("/questions", generateQuestions);

export default router;
