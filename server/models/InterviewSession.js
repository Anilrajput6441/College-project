import mongoose from "mongoose";

const interviewSessionSchema = new mongoose.Schema({
  jobInfo: {
    job_title: String,
    company_name: String,
    location: String,
  },
  transcript: [
    {
      role: { type: String, enum: ["user", "model"] },
      text: String,
    },
  ],
  summary: String,
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
});

export default mongoose.model("InterviewSession", interviewSessionSchema);
