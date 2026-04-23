import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashCards from "./DashbordComponents/DashCards";
import ApplicationStatausChart from "./DashbordComponents/ApplicationStatausChart";
import ComparisionChart from "./DashbordComponents/ComparisionChart";
import api from "../lib/api";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const Dashboard = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/apply/my-applications")
      .then((res) => {
        const safeApplications = Array.isArray(res.data) ? res.data.filter((item) => item.jobId) : [];
        setApplications(safeApplications);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setError("Please log in to see your dashboard.");
          return;
        }
        setError("Failed to load dashboard data.");
      })
      .finally(() => setLoading(false));
  }, []);

  const statusCounts = useMemo(() => {
    const counts = {
      Applied: 0,
      "Under Review": 0,
      Shortlisted: 0,
      Rejected: 0,
      "Offer Received": 0,
    };

    applications.forEach((application) => {
      const status = application.status || "Applied";
      counts[status] = (counts[status] || 0) + 1;
    });

    return counts;
  }, [applications]);

  const monthlyApplications = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const counts = new Array(12).fill(0);

    applications.forEach((application) => {
      const appliedDate = new Date(application.appliedAt);
      if (Number.isNaN(appliedDate.getTime()) || appliedDate.getFullYear() !== currentYear) {
        return;
      }

      counts[appliedDate.getMonth()] += 1;
    });

    return counts.map((count, index) => ({
      name: MONTHS[index],
      Applications: count,
    }));
  }, [applications]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-[#4f46e5] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] px-4 py-6 md:px-8 lg:px-6 lg:py-5 text-slate-900">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border-2 border-slate-200/80 bg-white/70 p-8 text-center shadow-xl shadow-slate-200/60">
            <p className="text-base font-semibold text-slate-800">{error}</p>
            {error.includes("log in") && (
              <button
                onClick={() => navigate("/login")}
                className="mt-4 rounded-2xl bg-[#4f46e5] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#4338ca] transition-colors"
              >
                Go to Login
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] px-4 py-6 md:px-8 lg:px-6 lg:py-5 text-slate-900">
      <div className="mx-auto max-w-6xl flex flex-col gap-6">
        <DashCards statusCounts={statusCounts} totalApplications={applications.length} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ApplicationStatausChart statusCounts={statusCounts} totalApplications={applications.length} />
          </div>
          <div className="lg:col-span-2">
            <ComparisionChart chartData={monthlyApplications} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
