import SavedJob from "../models/SavedJob.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

// POST /api/apply
export const applyToJob = async (req, res) => {
  const { job } = req.body;
  const userId = req.user?.id; // set by authenticate middleware

  if (!job?.job_link)
    return res.status(400).json({ message: "job_link is required" });

  try {
    // 1. Upsert job into MongoDB
    let savedJob = await SavedJob.findOne({ job_link: job.job_link });
    if (!savedJob) {
      savedJob = await SavedJob.create({
        job_link:          job.job_link,
        job_title:         job.job_title         || "",
        company_name:      job.company_name      || "",
        company_logo_link: job.company_logo_link || "",
        job_location:      job.job_location      || "",
        job_type:          job.job_type          || "",
        job_working_des:   job.job_working_des   || "",
        job_description:   job.job_description   || "",
        posted_date:       job.posted_date       || "",
        domain:            job.domain            || "",
        applicants:        job.applicants        || "",
      });
    }

    // 2. Track in user's appliedJobs
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        const alreadyApplied = user.appliedJobs.some(
          (a) => a.jobId.toString() === savedJob._id.toString()
        );
        if (alreadyApplied)
          return res.status(200).json({ message: "Already tracked", alreadyApplied: true, jobId: savedJob._id });

        user.appliedJobs.push({ jobId: savedJob._id, appliedAt: new Date(), status: "Applied" });
        await user.save();
      }
    }

    res.status(200).json({ message: "Application tracked successfully", alreadyApplied: false, jobId: savedJob._id });
  } catch (err) {
    console.error("Apply error:", err);
    res.status(500).json({ message: "Failed to track application", error: err.message });
  }
};

// GET /api/apply/my-applications
export const getMyApplications = async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate("appliedJobs.jobId");
    res.status(200).json(user.appliedJobs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch applications", error: err.message });
  }
};

// PATCH /api/apply/:jobId/status
// Body: { status: "Under Review" | "Shortlisted" | "Rejected" | "Offer Received" | "Applied" }
export const updateApplicationStatus = async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  const { jobId } = req.params;
  const { status } = req.body;

  const allowed = ["Applied", "Under Review", "Shortlisted", "Rejected", "Offer Received"];
  if (!allowed.includes(status))
    return res.status(400).json({ message: "Invalid status value" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const entry = user.appliedJobs.find((a) => a.jobId.toString() === jobId);
    if (!entry) return res.status(404).json({ message: "Application not found" });

    entry.status = status;
    await user.save();

    res.status(200).json({ message: "Status updated", status });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status", error: err.message });
  }
};
