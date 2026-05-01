import React, { useMemo, useState, useEffect } from "react";
import { CiLocationOn, CiSearch } from "react-icons/ci";
import { BsBriefcase, BsBuilding } from "react-icons/bs";
import { HiArrowRight } from "react-icons/hi";
import api from "../lib/api";
import { getInitials, resolveLogoUrl, toDisplayLogoUrl } from "../lib/jobLogos";

// Client-side fallback — used only when server is unreachable
const DEMO_JOBS = [
  { id: 1,  companyName: "TechNova",          jobTitle: "Frontend Developer",       jobGeo: "San Francisco, CA", jobType: "Full-time",  domain: "Engineering",    url: "#" },
  { id: 2,  companyName: "TechNova",          jobTitle: "Senior React Engineer",    jobGeo: "Remote",            jobType: "Full-time",  domain: "Engineering",    url: "#" },
  { id: 3,  companyName: "TechNova",          jobTitle: "DevOps Engineer",          jobGeo: "Remote",            jobType: "Contract",   domain: "Infrastructure", url: "#" },
  { id: 4,  companyName: "CloudNine SaaS",    jobTitle: "Backend Engineer",         jobGeo: "Remote",            jobType: "Full-time",  domain: "Engineering",    url: "#" },
  { id: 5,  companyName: "CloudNine SaaS",    jobTitle: "Account Executive",        jobGeo: "New York, NY",      jobType: "Full-time",  domain: "Sales",          url: "#" },
  { id: 6,  companyName: "GreenGrid Energy",  jobTitle: "Product Designer",         jobGeo: "Portland, OR",      jobType: "Full-time",  domain: "Design",         url: "#" },
  { id: 7,  companyName: "GreenGrid Energy",  jobTitle: "Data Analyst",             jobGeo: "Chicago, IL",       jobType: "Full-time",  domain: "Analytics",      url: "#" },
  { id: 8,  companyName: "Nebula Stream",     jobTitle: "Lead DevOps Engineer",     jobGeo: "Seattle, WA",       jobType: "Full-time",  domain: "Infrastructure", url: "#" },
  { id: 9,  companyName: "Nebula Stream",     jobTitle: "Full Stack Engineer",      jobGeo: "Remote",            jobType: "Full-time",  domain: "Engineering",    url: "#" },
  { id: 10, companyName: "BioHealth AI",      jobTitle: "AI Research Scientist",    jobGeo: "Boston, MA",        jobType: "Full-time",  domain: "AI/ML",          url: "#" },
  { id: 11, companyName: "BioHealth AI",      jobTitle: "ML Engineer",              jobGeo: "Remote",            jobType: "Full-time",  domain: "AI/ML",          url: "#" },
  { id: 12, companyName: "Ironclad Security", jobTitle: "Security Analyst",         jobGeo: "Washington, D.C.",  jobType: "Full-time",  domain: "Security",       url: "#" },
  { id: 13, companyName: "Ironclad Security", jobTitle: "Penetration Tester",       jobGeo: "Remote",            jobType: "Contract",   domain: "Security",       url: "#" },
  { id: 14, companyName: "Velocity Games",    jobTitle: "Unity Developer",          jobGeo: "Vancouver, BC",     jobType: "Full-time",  domain: "Gaming",         url: "#" },
  { id: 15, companyName: "Velocity Games",    jobTitle: "Game Designer",            jobGeo: "Remote",            jobType: "Full-time",  domain: "Gaming",         url: "#" },
  { id: 16, companyName: "Apex Logistics",    jobTitle: "Data Analyst",             jobGeo: "Chicago, IL",       jobType: "Full-time",  domain: "Analytics",      url: "#" },
  { id: 17, companyName: "Stellar Media",     jobTitle: "Growth Marketer",          jobGeo: "New York, NY",      jobType: "Full-time",  domain: "Marketing",      url: "#" },
  { id: 18, companyName: "Stellar Media",     jobTitle: "Content Strategist",       jobGeo: "Remote",            jobType: "Part-time",  domain: "Marketing",      url: "#" },
  { id: 19, companyName: "Quantum Fintech",   jobTitle: "Senior Blockchain Dev",    jobGeo: "Remote",            jobType: "Full-time",  domain: "Blockchain",     url: "#" },
  { id: 20, companyName: "Quantum Fintech",   jobTitle: "Smart Contract Auditor",   jobGeo: "Remote",            jobType: "Contract",   domain: "Blockchain",     url: "#" },
];

// Map Supabase row → component shape
const normalizeJob = (job) => ({
  id:          job.id           || job.job_link || `${job.company_name}-${job.job_title}`,
  companyName: job.company_name || "Unknown Company",
  jobTitle:    job.job_title    || "Untitled Position",
  jobGeo:      job.job_location || "Location not specified",
  jobType:     job.job_type     || "Full-time",
  domain:      job.domain       || job.company_sector || "",
  url:         job.job_link     || "#",
  companyLogo: toDisplayLogoUrl(resolveLogoUrl(job)),
  jobLevel:    job.job_working_des   || "",
  applicants:  job.applicants        || "",
  postedDate:  job.posted_date       || "",
});

const ACCENT_COLORS = [
  "bg-[#eef2ff] text-[#4f46e5]",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-600",
  "bg-sky-50 text-sky-700",
  "bg-purple-50 text-purple-700",
  "bg-teal-50 text-teal-700",
];

const TYPE_COLORS = {
  "Full-time": "bg-emerald-50 text-emerald-700",
  "Contract":  "bg-amber-50 text-amber-700",
  "Part-time": "bg-sky-50 text-sky-700",
};

const groupByCompany = (jobs) => {
  const map = new Map();
  jobs.forEach((job) => {
    const name = job.companyName;
    if (!map.has(name)) map.set(name, { name, jobs: [] });
    map.get(name).jobs.push(job);
  });
  return Array.from(map.values()).sort((a, b) => b.jobs.length - a.jobs.length);
};

const CompanyLogo = ({ logo, name, className, fallbackClassName }) => {
  const [failedLogo, setFailedLogo] = useState("");

  useEffect(() => { setFailedLogo(""); }, [logo]);

  if (logo && failedLogo !== logo) {
    return (
      <img
        src={logo}
        alt={name}
        loading="lazy"
        decoding="async"
        onError={() => setFailedLogo(logo)}
        className={className}
      />
    );
  }

  return (
    <div className={fallbackClassName}>
      {getInitials(name)}
    </div>
  );
};

const Companies = () => {
  const [jobs, setJobs]                   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    api.get("/jobs")
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : [];
        const normalized = raw.length > 0 ? raw.map(normalizeJob) : DEMO_JOBS;
        setJobs(normalized);
        setSelectedCompany(groupByCompany(normalized)[0] ?? null);
      })
      .catch(() => {
        setJobs(DEMO_JOBS);
        setSelectedCompany(groupByCompany(DEMO_JOBS)[0] ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const companies = useMemo(() => groupByCompany(jobs), [jobs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? companies.filter((c) => c.name.toLowerCase().includes(q)) : companies;
  }, [companies, search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] px-4 py-6 md:px-8 lg:px-6 lg:py-5 text-slate-900">
      <div className="mx-auto max-w-6xl flex flex-col gap-6 lg:grid lg:grid-cols-[1fr,1.6fr]">

        {/* ── Left: Company List ── */}
        <div className="flex flex-col overflow-hidden rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-2xl shadow-slate-300/50">

          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Companies</h2>
                <p className="text-xs font-light text-slate-400 mt-0.5">
                  {filtered.length} {filtered.length === 1 ? "company" : "companies"} · {jobs.length} total jobs
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#4f46e5]">
                <BsBuilding size={11} /> Browse
              </span>
            </div>
            <div className="relative">
              <CiSearch size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search companies..."
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white/80 text-xs text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 max-h-[75vh]">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="flex gap-1.5">
                  {[0,1,2].map((i) => (
                    <span key={i} className="h-2 w-2 rounded-full bg-[#4f46e5] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <CiSearch size={32} className="mb-2 opacity-40" />
                <p className="text-sm">No companies found</p>
              </div>
            ) : (
              filtered.map((company, i) => {
                const active = selectedCompany?.name === company.name;
                const colorCls = ACCENT_COLORS[i % ACCENT_COLORS.length];
                return (
                  <button
                    key={company.name}
                    onClick={() => setSelectedCompany(company)}
                    className={`w-full flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                      active
                        ? "border-[#4f46e5] bg-[#eef2ff] shadow-md"
                        : "border-slate-100 bg-white shadow-sm hover:border-[#4f46e5]/30 hover:shadow-md"
                    }`}
                  >
                    <CompanyLogo
                      logo={company.jobs[0]?.companyLogo}
                      name={company.name}
                      className="h-10 w-10 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                      fallbackClassName={`h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold ${colorCls}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{company.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {company.jobs.length} {company.jobs.length === 1 ? "job" : "jobs"} posted
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                        <CiLocationOn size={11} />{company.jobs[0]?.jobGeo}
                      </span>
                    </div>
                    {active && <HiArrowRight size={14} className="text-[#4f46e5] flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: Company Detail ── */}
        <div key={selectedCompany?.name} className="flex flex-col overflow-hidden rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-2xl shadow-slate-300/50">
          {selectedCompany ? (
            <>
              {/* Banner */}
              <div className="relative h-24 flex-shrink-0 bg-[linear-gradient(135deg,#03001e,#7303c0,#ec38bc,#fdeff9)]">
                <div className="absolute -bottom-6 left-6">
                  <CompanyLogo
                    logo={selectedCompany.jobs[0]?.companyLogo}
                    name={selectedCompany.name}
                    className="h-12 w-12 rounded-2xl border-4 border-white bg-white object-cover shadow-lg"
                    fallbackClassName={`h-12 w-12 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-sm font-bold ${
                      ACCENT_COLORS[companies.findIndex(c => c.name === selectedCompany.name) % ACCENT_COLORS.length]
                    }`}
                  />
                </div>
              </div>

              {/* Company info */}
              <div className="px-6 pt-9 pb-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-900">{selectedCompany.name}</h2>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-2.5 py-1 text-[11px] font-medium text-[#4f46e5]">
                    <BsBriefcase size={10} />
                    {selectedCompany.jobs.length} open {selectedCompany.jobs.length === 1 ? "role" : "roles"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <CiLocationOn size={13} />{selectedCompany.jobs[0]?.jobGeo}
                  </span>
                </div>
              </div>

              {/* Jobs list */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 max-h-[calc(100vh-18rem)]">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Open Positions</p>
                {selectedCompany.jobs.map((job, i) => (
                  <div
                    key={job.id}
                    className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-[#4f46e5]/20 transition-all duration-200"
                  >
                    <CompanyLogo
                      logo={job.companyLogo}
                      name={job.companyName}
                      className="h-10 w-10 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                      fallbackClassName={`h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center text-[11px] font-bold ${
                        ACCENT_COLORS[i % ACCENT_COLORS.length]
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{job.jobTitle}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <CiLocationOn size={12} />{job.jobGeo}
                        </span>
                        {job.domain && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ACCENT_COLORS[i % ACCENT_COLORS.length]}`}>
                            {job.domain}
                          </span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[job.jobType] || "bg-slate-100 text-slate-600"}`}>
                          {job.jobType}
                        </span>
                      </div>
                    </div>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#4f46e5] px-3.5 py-1.5 text-[11px] font-medium text-white hover:bg-[#4338ca] transition-colors shadow-sm"
                    >
                      Apply <HiArrowRight size={11} />
                    </a>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <div className="h-16 w-16 rounded-2xl bg-[#eef2ff] flex items-center justify-center">
                <BsBuilding size={28} className="text-[#4f46e5] opacity-50" />
              </div>
              <p className="text-sm font-medium text-slate-500">Select a company to view roles</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Companies;
