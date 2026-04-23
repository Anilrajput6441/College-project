import { createClient } from "@supabase/supabase-js";
import mongoose from "mongoose";
import "dotenv/config";

// Initialize Supabase client (used for job listings)
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Connect MongoDB via Mongoose (used for auth / User model)
let isMongoConnected = false;

export async function connectMongo() {
  if (isMongoConnected || mongoose.connection.readyState === 1) {
    console.log("MongoDB already connected (Mongoose)");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isMongoConnected = true;
    console.log("Connected to MongoDB via Mongoose");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}
