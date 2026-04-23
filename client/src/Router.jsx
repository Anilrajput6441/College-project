import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import MyApplication from "./components/MyApplication";
import SavedJobs from "./components/SavedJobs";
import Profile from "./components/Profile";
import FindJobs from "./components/FindJobs";
import Interview from "./components/Interview";
import Companies from "./components/Companies";
import Login from "./components/authComponents/Login";
import Signup from "./components/authComponents/Signup";
import CareerTips from "./components/CareerTips";
import Settings from "./components/Settings";

const Router = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/applications" element={<MyApplication />} />
      <Route path="/saved-jobs" element={<SavedJobs />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/find-jobs" element={<FindJobs />} />
      <Route path="/interviews" element={<Interview />} />
      <Route path="/companies" element={<Companies />} />
      <Route path="/career-tips" element={<CareerTips />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  );
};

export default Router;
