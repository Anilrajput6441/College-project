import React, { useState, useEffect } from "react";
import { CiCalendarDate, CiLocationOn } from "react-icons/ci";
import { BsBriefcase } from "react-icons/bs";
import api from "../lib/api";

const STATUS_CONFIG = {
  "Applied":        { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400"    },
  "Under Review":   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400"   },
  "Shortlisted":    { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  "Rejected":       { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-400"     },
  "Offer Received": { bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-400"  },
};
const ALL_STATUSES = Object.keys(STATUS_CONFIG);

const getInitials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

const LogoOrInitials = ({ logo, name }) => {
  const [err, setErr] = useState(false);
  if (logo && !err) {
    return (
      <img
        src={logo}
        alt={name}
        onError={() => setErr(true)}
        className="h-12 w-12 rounded-xl object-cover border border-slate-100 flex-shrink-0"
      />
    );
  }
  return (
    <div className="h-12 w-12 rounded-xl bg-[#eef2ff] flex items-center justify-center text-xs font-bold text-[#4f46e5] flex-shrink-0">
      {getInitials(name)}
    </div>
  );
};

// ── JobCard ────────────────────────────────────────────────────────────────

const JobCard = ({ job, appliedAt, status, onStatusChange }) => {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG["Applied"];
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-[#4f46e5]/20 transition-all duration-200">
      <LogoOrInitials logo={job.company_logo_link} name={job.company_name} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm truncate">{job.job_title}</p>
        <p className="text-slate-500 text-xs mt-0.5 truncate">{job.company_name}</p>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {job.job_location && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <CiLocationOn size={13} />{job.job_location}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <CiCalendarDate size={13} />
            Applied {new Date(appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>
      {/* Status dropdown */}
      <div className="flex-shrink-0">
        <select
          value={status}
          onChange={(e) => onStatusChange(job._id, e.target.value)}
          className={`rounded-full border-0 px-2.5 py-1 text-[11px] font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 ${s.bg} ${s.text}`}
        >
          {ALL_STATUSES.map((st) => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

// ── Empty state ────────────────────────────────────────────────────────────

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
    <div className="h-14 w-14 rounded-2xl bg-[#eef2ff] flex items-center justify-center">
      <BsBriefcase size={24} className="text-[#4f46e5] opacity-50" />
    </div>
    <p className="text-sm font-medium text-slate-500">No applications yet</p>
    <p className="text-xs text-slate-400">Jobs you apply to will appear here.</p>
  </div>
);

// ── Main ───────────────────────────────────────────────────────────────────

const MyApplication = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [activeTab, setActiveTab]       = useState("applied");

  useEffect(() => {
    api
      .get("/apply/my-applications")
      .then((res) => setApplications(res.data))
      .catch((err) => {
        if (err.response?.status === 401) setError("Please log in to see your applications.");
        else setError("Failed to load applications.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (jobId, newStatus) => {
    // Optimistic update
    setApplications((prev) =>
      prev.map((a) => a.jobId?._id === jobId ? { ...a, status: newStatus } : a)
    );
    try {
      await api.patch(`/apply/${jobId}/status`, { status: newStatus });
    } catch {
      // Revert on failure by re-fetching
      api.get("/apply/my-applications")
        .then((res) => setApplications(res.data));
    }
  };

  // Each entry: { jobId: { ...SavedJob fields }, appliedAt }
  const jobs = applications.filter((a) => a.jobId); // guard against null populated refs

  const tabs = [
    { id: "applied", label: "Applied Jobs", count: jobs.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] px-4 py-6 md:px-8 lg:px-6 lg:py-5 text-slate-900">
      <div className="mx-auto max-w-6xl flex flex-col gap-6 lg:grid lg:grid-cols-[2fr,1.05fr]">

        {/* ── Left: Applied Jobs ── */}
        <div className="flex flex-col overflow-hidden rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-2xl shadow-slate-300/50">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-0">
            <div>
              <h2 className="text-base font-semibold text-slate-900 md:text-lg">My Applications</h2>
              <p className="text-xs font-light text-slate-500 mt-0.5">Track all your job applications in one place.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#4f46e5]">
              <BsBriefcase size={12} />
              {jobs.length} {jobs.length === 1 ? "Job" : "Jobs"}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-100 px-6 mt-4">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={[
                  "relative px-3.5 pb-3 text-xs font-medium md:text-sm transition-colors",
                  activeTab === t.id ? "text-slate-900" : "text-slate-400 hover:text-slate-700",
                ].join(" ")}
              >
                {t.label}
                <span className="ml-1.5 rounded-full bg-[#eef2ff] px-1.5 py-0.5 text-[10px] font-semibold text-[#4f46e5]">
                  {t.count}
                </span>
                {activeTab === t.id && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#4f46e5]" />
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 max-h-[75vh]">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-2 w-2 rounded-full bg-[#4f46e5] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
                <p className="text-sm text-slate-500">{error}</p>
                {error.includes("log in") && (
                  <a href="/login" className="rounded-full bg-[#4f46e5] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#4338ca] transition-colors">
                    Sign In
                  </a>
                )}
              </div>
            ) : jobs.length === 0 ? (
              <EmptyState />
            ) : (
              jobs.map((a) => (
                <JobCard
                  key={a.jobId._id}
                  job={a.jobId}
                  appliedAt={a.appliedAt}
                  status={a.status || "Applied"}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right: Stats ── */}
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-xl shadow-slate-200/60 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Application Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Applied",   value: jobs.length,                                                                          color: "bg-[#eef2ff] text-[#4f46e5]"    },
                { label: "Shortlisted",     value: jobs.filter(a => a.status === "Shortlisted").length,                                  color: "bg-emerald-50 text-emerald-700" },
                { label: "Under Review",    value: jobs.filter(a => a.status === "Under Review").length,                                 color: "bg-amber-50 text-amber-700"     },
                { label: "Offer Received",  value: jobs.filter(a => a.status === "Offer Received").length,                               color: "bg-purple-50 text-purple-700"   },
              ].map((s) => (
                <div key={s.label} className={`rounded-2xl px-4 py-3 ${s.color}`}>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-[11px] font-medium mt-0.5 opacity-80">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="flex flex-col overflow-hidden rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-xl shadow-slate-200/60">
            <div className="px-5 pt-5 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Recent Activity</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Your last 5 applications</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 max-h-[46vh]">
              {loading ? null : jobs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No activity yet.</p>
              ) : (
                [...jobs]
                  .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
                  .slice(0, 5)
                  .map((a) => (
                    <div key={a.jobId._id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                      <LogoOrInitials logo={a.jobId.company_logo_link} name={a.jobId.company_name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{a.jobId.job_title}</p>
                        <p className="text-[11px] text-slate-400 truncate">{a.jobId.company_name}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {new Date(a.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MyApplication;
