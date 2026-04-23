import User from "../models/User.js";
import multer from "multer";
import { extractResumeText, normalizeParsedResume, parseResumeData } from "../utils/resume-parser.js";

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadResumeMiddleware = resumeUpload.single("resume");

// GET /api/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({
      username:    user.username,
      email:       user.email,
      profile:     user.profile,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/profile/personal
export const updatePersonalInfo = async (req, res) => {
  const {
    designation,
    phone,
    contactEmail,
    country,
    city,
    fullAddress,
    dob,
    age,
    gender,
    summary,
    linkedin,
    github,
    portfolio,
  } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: {
        "profile.designation": designation ?? "",
        "profile.phone":       phone       ?? "",
        "profile.contactEmail":contactEmail?? "",
        "profile.country":     country     ?? "",
        "profile.city":        city        ?? "",
        "profile.fullAddress": fullAddress ?? "",
        "profile.dob":         dob         ?? "",
        "profile.age":         age         ?? "",
        "profile.gender":      gender      ?? "",
        "profile.summary":     summary     ?? "",
        "profile.linkedin":    linkedin    ?? "",
        "profile.github":      github      ?? "",
        "profile.portfolio":   portfolio   ?? "",
      }},
      { new: true }
    );
    res.status(200).json({ message: "Personal info updated", profile: user.profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/profile/experience
export const addExperience = async (req, res) => {
  const { title, company, type, startDate, endDate, current } = req.body;
  if (!title || !company) return res.status(400).json({ message: "Title and company are required" });
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { "profile.experience": { title, company, type, startDate, endDate, current: !!current } } },
      { new: true }
    );
    res.status(201).json({ message: "Experience added", experience: user.profile.experience });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/profile/experience/:expId
export const deleteExperience = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { "profile.experience": { _id: req.params.expId } } },
      { new: true }
    );
    res.status(200).json({ message: "Experience deleted", experience: user.profile.experience });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/profile/education
export const addEducation = async (req, res) => {
  const { institution, degree, field, gpa, startDate, endDate, current } = req.body;
  if (!institution || !degree) return res.status(400).json({ message: "Institution and degree are required" });
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { "profile.education": { institution, degree, field, gpa, startDate, endDate, current: !!current } } },
      { new: true }
    );
    res.status(201).json({ message: "Education added", education: user.profile.education });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/profile/education/:eduId
export const deleteEducation = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { "profile.education": { _id: req.params.eduId } } },
      { new: true }
    );
    res.status(200).json({ message: "Education deleted", education: user.profile.education });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/profile/skills
// Body: { skills: ["React", "Node.js", ...] }
export const updateSkills = async (req, res) => {
  const { skills } = req.body;
  if (!Array.isArray(skills)) return res.status(400).json({ message: "Skills must be an array" });
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { "profile.skills": skills.map(s => s.trim()).filter(Boolean) } },
      { new: true }
    );
    res.status(200).json({ message: "Skills updated", skills: user.profile.skills });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/profile/resume
export const uploadResume = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a resume file." });
  }

  try {
    const resumeText = await extractResumeText(req.file);
    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({ message: "Could not extract any readable text from the resume." });
    }

    const parsedData = await parseResumeData(resumeText);
    const normalized = normalizeParsedResume(parsedData, req.file.originalname);

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (normalized.username) {
      user.username = normalized.username;
    }

    const currentProfile = typeof user.profile?.toObject === "function"
      ? user.profile.toObject()
      : { ...user.profile };

    user.profile = {
      ...currentProfile,
      ...normalized.profile,
      skills: normalized.profile.skills.length ? normalized.profile.skills : currentProfile.skills,
      experience: normalized.profile.experience.length ? normalized.profile.experience : currentProfile.experience,
      education: normalized.profile.education.length ? normalized.profile.education : currentProfile.education,
    };

    await user.save();

    res.status(200).json({
      message: "Resume parsed successfully",
      username: user.username,
      email: user.email,
      profile: user.profile,
    });
  } catch (err) {
    console.error("Resume upload error:", err);
    res.status(500).json({ message: err.message || "Failed to parse resume" });
  }
};
