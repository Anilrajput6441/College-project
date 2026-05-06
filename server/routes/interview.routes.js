import express from "express";
import { chat, generateSummary, generateQuestions, generateCoverLetter } from "../controllers/interview.controller.js";

const router = express.Router();

router.post("/chat", chat);
router.post("/summary", generateSummary);
router.post("/questions", generateQuestions);
router.post("/cover-letter", generateCoverLetter);

export default router;
