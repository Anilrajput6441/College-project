import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const experienceSchema = new mongoose.Schema(
  {
    title:     { type: String, default: "" },
    company:   { type: String, default: "" },
    type:      { type: String, default: "Full-time" },
    startDate: { type: String, default: "" },
    endDate:   { type: String, default: "" },
    current:   { type: Boolean, default: false },
  },
  { _id: true },
);

const educationSchema = new mongoose.Schema(
  {
    institution: { type: String, default: "" },
    degree:      { type: String, default: "" },
    field:       { type: String, default: "" },
    gpa:         { type: String, default: "" },
    startDate:   { type: String, default: "" },
    endDate:     { type: String, default: "" },
    current:     { type: Boolean, default: false },
  },
  { _id: true },
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // Automatically excludes password from queries for security
    },
    role: {
      type: String,
      enum: ["user"],
      default: "user",
    },
    appliedJobs: [
      {
        jobId:       { type: mongoose.Schema.Types.ObjectId, ref: "SavedJob" },
        appliedAt:   { type: Date, default: Date.now },
        status:      { type: String, enum: ["Applied", "Under Review", "Shortlisted", "Rejected", "Offer Received"], default: "Applied" },
      },
    ],
    profile: {
      designation: { type: String, default: "" },
      phone:       { type: String, default: "" },
      contactEmail:{ type: String, default: "" },
      country:     { type: String, default: "" },
      city:        { type: String, default: "" },
      fullAddress: { type: String, default: "" },
      dob:         { type: String, default: "" },
      age:         { type: String, default: "" },
      gender:      { type: String, default: "" },
      summary:     { type: String, default: "" },
      linkedin:    { type: String, default: "" },
      github:      { type: String, default: "" },
      portfolio:   { type: String, default: "" },
      resumeMeta: {
        fileName: { type: String, default: "" },
        parsedAt: { type: Date, default: null },
      },
      skills:      [{ type: String }],
      experience: [experienceSchema],
      education:  [educationSchema],
    },
  },
  {
    timestamps: true,
  },
);

// Middleware: Hash password before saving to database
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance Method: Compare entered password with hashed password in DB
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
