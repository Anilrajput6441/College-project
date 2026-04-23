import { GoogleGenerativeAI } from "@google/generative-ai";
import InterviewSession from "../models/InterviewSession.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/interview/chat
// Body: { sessionId, message, jobInfo, history }
export const chat = async (req, res) => {
  const { message, jobInfo, history = [] } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `You are an AI interviewer conducting a job interview for the position of "${jobInfo?.job_title}" at "${jobInfo?.company_name}". 
Ask relevant technical and behavioral questions one at a time. Be professional, concise, and encouraging. 
Start by greeting the candidate and asking your first question. Keep responses under 3 sentences.`;

    const geminiHistory = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I will conduct the interview professionally." }],
      },
      ...history.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
    ];

    const chatSession = model.startChat({ history: geminiHistory });
    const result = await chatSession.sendMessage(message);
    const reply = result.response.text();

    res.json({ reply });
  } catch (err) {
    console.error("Gemini chat error:", err);
    res.status(500).json({ error: "AI response failed" });
  }
};

// POST /api/interview/summary
// Body: { jobInfo, transcript }
export const generateSummary = async (req, res) => {
  const { jobInfo, transcript } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const transcriptText = transcript
      .map((t) => `${t.role === "user" ? "Candidate" : "Interviewer"}: ${t.text}`)
      .join("\n");

    const prompt = `You are an AI that summarizes job interviews. Based on the following interview transcript for the role of "${jobInfo?.job_title}" at "${jobInfo?.company_name}", write a concise 3-4 sentence summary covering: candidate's key strengths, areas to improve, and overall impression.

Transcript:
${transcriptText}

Summary:`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    // Save session to MongoDB
    const session = await InterviewSession.create({
      jobInfo,
      transcript,
      summary,
      endedAt: new Date(),
    });

    res.json({ summary, sessionId: session._id });
  } catch (err) {
    console.error("Summary generation error:", err);
    res.status(500).json({ error: "Summary generation failed" });
  }
};
