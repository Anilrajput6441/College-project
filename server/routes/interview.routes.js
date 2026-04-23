import express from "express";
import { chat, generateSummary } from "../controllers/interview.controller.js";

const router = express.Router();

router.post("/chat", chat);
router.post("/summary", generateSummary);

export default router;
