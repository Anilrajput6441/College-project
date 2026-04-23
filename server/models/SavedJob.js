import mongoose from "mongoose";

const savedJobSchema = new mongoose.Schema(
  {
    job_link:         { type: String, required: true, unique: true },
    job_title:        String,
    company_name:     String,
    company_logo_link:String,
    job_location:     String,
    job_type:         String,
    job_working_des:  String,
    job_description:  String,
    posted_date:      String,
    domain:           String,
    applicants:       String,
    source:           { type: String, default: "supabase" },
  },
  { timestamps: true }
);

export default mongoose.model("SavedJob", savedJobSchema);
