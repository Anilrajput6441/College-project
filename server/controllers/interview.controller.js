import { getGeminiModel, is429, quotaError } from "../config/gemini.config.js";
import InterviewSession from "../models/InterviewSession.js";

const missingKeyError = {
  error: "GEMINI_API_KEY is not configured on the server.",
};

// POST /api/interview/chat
export const chat = async (req, res) => {
  const { message, jobInfo, history = [] } = req.body;
  try {
    const geminiModel = getGeminiModel();
    if (!geminiModel) return res.status(500).json(missingKeyError);

    const systemPrompt = `You are an AI interviewer conducting a job interview for the position of "${jobInfo?.job_title}" at "${jobInfo?.company_name}". 
Ask relevant technical and behavioral questions one at a time. Be professional, concise, and encouraging. 
Start by greeting the candidate and asking your first question. Keep responses under 3 sentences.`;

    const chatSession = geminiModel.startChat({
      history: [
        { role: "user",  parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I will conduct the interview professionally." }] },
        ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
      ],
    });

    const result = await chatSession.sendMessage(message);
    res.json({ reply: result.response.text() });
  } catch (err) {
    console.error("Gemini chat error:", err);
    res.status(is429(err) ? 429 : 500).json(is429(err) ? quotaError : { error: "AI response failed" });
  }
};

// POST /api/interview/summary
export const generateSummary = async (req, res) => {
  const { jobInfo, transcript } = req.body;
  try {
    const geminiModel = getGeminiModel();
    if (!geminiModel) return res.status(500).json(missingKeyError);

    const transcriptText = transcript
      .map((t) => `${t.role === "user" ? "Candidate" : "Interviewer"}: ${t.text}`)
      .join("\n");

    const prompt = `You are an AI that summarizes job interviews. Based on the following interview transcript for the role of "${jobInfo?.job_title}" at "${jobInfo?.company_name}", write a concise 3-4 sentence summary covering: candidate's key strengths, areas to improve, and overall impression.\n\nTranscript:\n${transcriptText}\n\nSummary:`;

    const result = await geminiModel.generateContent(prompt);
    const summary = result.response.text();

    const session = await InterviewSession.create({ jobInfo, transcript, summary, endedAt: new Date() });
    res.json({ summary, sessionId: session._id });
  } catch (err) {
    console.error("Summary generation error:", err);
    res.status(is429(err) ? 429 : 500).json(is429(err) ? quotaError : { error: "Summary generation failed" });
  }
};

// POST /api/interview/questions
export const generateQuestions = async (req, res) => {
  const { jobInfo } = req.body;
  try {
    const geminiModel = getGeminiModel();
    if (!geminiModel) return res.status(500).json(missingKeyError);

    const prompt = `Generate 10 interview practice questions for the role of "${jobInfo?.job_title}" at "${jobInfo?.company_name}".
${jobInfo?.job_description ? `Job description: ${jobInfo.job_description}` : ""}
Return ONLY a JSON array of strings, no explanation, no markdown. Example: ["Question 1?", "Question 2?"]`;

    const result = await geminiModel.generateContent(prompt);
    let text = result.response.text().trim()
      .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
    res.json({ questions: JSON.parse(text) });
  } catch (err) {
    console.error("Questions generation error:", err);
    res.status(is429(err) ? 429 : 500).json(is429(err) ? quotaError : { error: "Failed to generate questions" });
  }
};

// POST /api/interview/cover-letter
export const generateCoverLetter = async (req, res) => {
  const { jobInfo, userProfile } = req.body;
  try {
    const geminiModel = getGeminiModel();
    if (!geminiModel) return res.status(500).json(missingKeyError);

    const prompt = `Write a professional cover letter for the following:

Candidate:
- Name: ${userProfile.username || "Candidate"}
- Designation: ${userProfile.designation || ""}
- Summary: ${userProfile.summary || ""}
- Skills: ${(userProfile.skills || []).join(", ")}
- Experience: ${(userProfile.experience || []).map((e) => `${e.title} at ${e.company}`).join("; ")}
- Education: ${(userProfile.education || []).map((e) => `${e.degree} from ${e.institution}`).join("; ")}

Job:
- Title: ${jobInfo.job_title}
- Company: ${jobInfo.company_name}
- Description: ${jobInfo.job_description || ""}

Write a compelling, personalized cover letter in 3-4 paragraphs. Be professional and specific. Return only the cover letter text, no subject line or extra formatting.`;

    const result = await geminiModel.generateContent(prompt);
    res.json({ coverLetter: result.response.text() });
  } catch (err) {
    console.error("Cover letter error:", err);
    res.status(is429(err) ? 429 : 500).json(is429(err) ? quotaError : { error: "Failed to generate cover letter" });
  }
};
