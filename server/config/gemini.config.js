import { GoogleGenerativeAI } from "@google/generative-ai";

let _geminiModel = null;

export const getGeminiModel = () => {
  if (_geminiModel) return _geminiModel;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  _geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  return _geminiModel;
};

export const is429 = (err) =>
  err?.status === 429 ||
  err?.message?.includes("429") ||
  err?.message?.includes("quota");

export const quotaError = {
  error: "AI quota exceeded. Please try again later.",
};
