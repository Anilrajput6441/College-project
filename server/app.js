import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { supabase, connectMongo } from "./config/supabase.config.js";
import allJobs from "./routes/jobs.routes.js";
import authRoutes from "./routes/auth.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import applyRoutes from "./routes/apply.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import profileRoutes from "./routes/profile.routes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://college-project-sepia.vercel.app",
  "https://college-project-63e4fvm65-anilrajput6441s-projects.vercel.app",
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
connectMongo();

app.get("/", (req, res) => {
  res.send("Hello, Express.js Server!");
});

// Simple health route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Example Supabase test route – adjust table name to match your DB
app.get("/api/supabase-test", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("job_listing_tbl")
      .select("*")
      .limit(10);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.json({ ok: true, sample: data });
  } catch (err) {
    console.error("Unexpected Supabase error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Unexpected server error" });
  }
});

/**************************************************************  */
/*  <<<<<<<<<<-------- APIs --------->>>>>>>>>>
/************************************************************** */

app.use("/api/jobs", allJobs);
app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/apply", applyRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/profile", profileRoutes);

export default app;
