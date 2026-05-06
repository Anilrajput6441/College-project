import React, { useEffect, useState } from "react";
import { CiLocationOn, CiCalendarDate, CiSearch } from "react-icons/ci";
import { BsBriefcase, BsPeople } from "react-icons/bs";
import { HiArrowRight, HiCheck, HiX } from "react-icons/hi";
import api from "../lib/api";
import CoverLetterModal from "./CoverLetterModal";
import { getInitials, resolveLogoUrl, toDisplayLogoUrl } from "../lib/jobLogos";

// Local fallback jobs — shown when API/Supabase is unavailable
const LOCAL_DEMO_JOBS = [
  { id: "d1", jobTitle: "Frontend Developer",    companyName: "TechNova",          companyLogo: "", jobGeo: "San Francisco, CA",  jobType: "Full-time",  jobLevel: "Remote",   url: "#", postedDate: "2024-05-20", domain: "Engineering",     applicants: "142", jobDescription: "<p>Build modern web interfaces using React and Tailwind CSS. Work with a cross-functional team to deliver high-quality user experiences.</p><ul><li>3+ years React experience</li><li>Strong CSS/Tailwind skills</li><li>REST API integration</li></ul>" },
  { id: "d2", jobTitle: "Backend Engineer",       companyName: "CloudNine SaaS",    companyLogo: "", jobGeo: "Remote",              jobType: "Full-time",  jobLevel: "Remote",   url: "#", postedDate: "2024-05-18", domain: "Engineering",     applicants: "98",  jobDescription: "<p>Design and build scalable APIs and microservices using Node.js and MongoDB. Own backend architecture decisions.</p><ul><li>Node.js & Express</li><li>MongoDB / PostgreSQL</li><li>Docker & CI/CD</li></ul>" },
  { id: "d3", jobTitle: "Product Designer",       companyName: "GreenGrid Energy",  companyLogo: "", jobGeo: "Portland, OR",        jobType: "Full-time",  jobLevel: "Hybrid",   url: "#", postedDate: "2024-05-15", domain: "Design",          applicants: "76",  jobDescription: "<p>Lead end-to-end product design from research to high-fidelity prototypes. Collaborate with engineering and product teams.</p><ul><li>Figma proficiency</li><li>User research experience</li><li>Design systems knowledge</li></ul>" },
  { id: "d4", jobTitle: "Data Analyst",           companyName: "Apex Logistics",    companyLogo: "", jobGeo: "Chicago, IL",         jobType: "Full-time",  jobLevel: "On-site",  url: "#", postedDate: "2024-05-12", domain: "Analytics",       applicants: "54",  jobDescription: "<p>Analyze large datasets to drive business decisions. Build dashboards and reports using SQL and Python.</p><ul><li>SQL & Python</li><li>Tableau / Power BI</li><li>Statistical analysis</li></ul>" },
  { id: "d5", jobTitle: "DevOps Engineer",        companyName: "Nebula Stream",     companyLogo: "", jobGeo: "Seattle, WA",         jobType: "Full-time",  jobLevel: "Remote",   url: "#", postedDate: "2024-05-10", domain: "Infrastructure",  applicants: "61",  jobDescription: "<p>Manage cloud infrastructure on AWS. Automate deployments and maintain CI/CD pipelines for a fast-moving engineering team.</p><ul><li>AWS / GCP</li><li>Kubernetes & Terraform</li><li>GitHub Actions</li></ul>" },
  { id: "d6", jobTitle: "AI Research Scientist",  companyName: "BioHealth AI",      companyLogo: "", jobGeo: "Boston, MA",          jobType: "Full-time",  jobLevel: "Hybrid",   url: "#", postedDate: "2024-05-08", domain: "AI/ML",           applicants: "33",  jobDescription: "<p>Research and develop machine learning models for healthcare applications. Publish findings and collaborate with clinical teams.</p><ul><li>PyTorch / TensorFlow</li><li>NLP & Computer Vision</li><li>PhD preferred</li></ul>" },
  { id: "d7", jobTitle: "Security Analyst",       companyName: "Ironclad Security", companyLogo: "", jobGeo: "Washington, D.C.",    jobType: "Full-time",  jobLevel: "On-site",  url: "#", postedDate: "2024-05-05", domain: "Security",        applicants: "47",  jobDescription: "<p>Monitor and respond to security incidents. Conduct vulnerability assessments and penetration testing across enterprise systems.</p><ul><li>SIEM tools</li><li>Penetration testing</li><li>CISSP/CEH preferred</li></ul>" },
  { id: "d8", jobTitle: "Unity Developer",        companyName: "Velocity Games",    companyLogo: "", jobGeo: "Vancouver, BC",       jobType: "Full-time",  jobLevel: "Remote",   url: "#", postedDate: "2024-05-01", domain: "Gaming",          applicants: "89",  jobDescription: "<p>Build immersive game experiences using Unity. Work with artists and designers to bring game concepts to life.</p><ul><li>Unity & C#</li><li>3D/2D game development</li><li>Performance optimization</li></ul>" },
  { id: "d9", jobTitle: "Full Stack Engineer",    companyName: "BioHealth AI",      companyLogo: "", jobGeo: "Boston, MA",          jobType: "Contract",  jobLevel: "Remote",   url: "#", postedDate: "2024-04-28", domain: "Engineering",     applicants: "115", jobDescription: "<p>Own full-stack features from database to UI. Work in a fast-paced startup environment building health-tech products.</p><ul><li>React + Node.js</li><li>PostgreSQL</li><li>AWS deployment</li></ul>" },
  { id: "d10",jobTitle: "Growth Marketer",        companyName: "Stellar Media",     companyLogo: "", jobGeo: "New York, NY",        jobType: "Full-time",  jobLevel: "Hybrid",   url: "#", postedDate: "2024-04-25", domain: "Marketing",       applicants: "203", jobDescription: "<p>Drive user acquisition and retention through data-driven marketing campaigns across paid and organic channels.</p><ul><li>SEO/SEM expertise</li><li>A/B testing</li><li>Analytics tools</li></ul>" },
];

const normalizeJob = (job) => ({
  id:             job.id              || job.job_link   || Math.random().toString(36).substr(2, 9),
  jobTitle:       job.job_title       || "Untitled Position",
  companyName:    job.company_name    || "Unknown Company",
  companyLogo:    toDisplayLogoUrl(resolveLogoUrl(job)),
  companyPage:    job.company_page_link || "",
  jobGeo:         job.job_location    || "Location not specified",
  jobDescription: job.job_description || "",
  jobType:        job.job_type        || "Full-time",
  jobLevel:       job.job_working_des || "Not specified",
  url:            job.job_link        || "#",
  postedDate:     job.posted_date     || "",
  domain:         job.domain          || job.company_sector || "",
  applicants:     job.applicants      || "",
  sector:         job.company_sector  || "",
});

const tagColors = [
  "bg-[#eef2ff] text-[#4f46e5]",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-600",
  "bg-sky-50 text-sky-700",
];

const LogoOrInitials = ({ logo, name, size = "h-12 w-12" }) => {
  const [failedLogo, setFailedLogo] = useState("");

  if (logo && failedLogo !== logo) {
    return (
      <img
        src={logo}
        alt={name}
        loading="lazy"
        decoding="async"
        onError={() => setFailedLogo(logo)}
        className={`${size} rounded-2xl object-cover border border-slate-100 flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${size} rounded-2xl bg-[#eef2ff] flex items-center justify-center text-[#4f46e5] font-bold text-sm flex-shrink-0`}>
      {getInitials(name)}
    </div>
  );
};

const DetailChip = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4f46e5] flex-shrink-0">
      {icon}
    </span>
    <div>
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="text-xs font-semibold text-slate-800">{value}</p>
    </div>
  </div>
);

const FindJobs = () => {
  const [allJobs, setAllJobs]         = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading]         = useState(true);
  // Confirmation modal state
  const [pendingJob, setPendingJob]   = useState(null);
  const [applyStatus, setApplyStatus] = useState(null);
  const [coverLetterJob, setCoverLetterJob] = useState(null);

  // Opens the external URL then shows the confirmation modal
  const handleApplyClick = (job) => {
    window.open(job.url, "_blank", "noopener,noreferrer");
    setPendingJob(job);
    setApplyStatus(null);
  };

  // User confirms they applied — track it in MongoDB
  const handleConfirmApply = async () => {
    if (!pendingJob) return;
    setApplyStatus("loading");
    try {
      const res = await api.post(
        "/apply",
        {
          job: {
            job_link:          pendingJob.url,
            job_title:         pendingJob.jobTitle,
            company_name:      pendingJob.companyName,
            company_logo_link: pendingJob.companyLogo,
            job_location:      pendingJob.jobGeo,
            job_type:          pendingJob.jobType,
            job_working_des:   pendingJob.jobLevel,
            job_description:   pendingJob.jobDescription,
            posted_date:       pendingJob.postedDate,
            domain:            pendingJob.domain,
            applicants:        pendingJob.applicants,
          },
        }
      );
      setApplyStatus(res.data.alreadyApplied ? "duplicate" : "success");
    } catch (err) {
      // 401 = not logged in, still show success-like message for demo
      setApplyStatus(err.response?.status === 401 ? "success" : "error");
    }
  };

  const closeModal = () => {
    setPendingJob(null);
    setApplyStatus(null);
  };

  useEffect(() => {
    api.get("/jobs")
      .then((res) => {
        // Server returns Supabase jobs; falls back to demo if Supabase is empty
        const raw = Array.isArray(res.data) ? res.data : [];
        const jobs = raw.length > 0 ? raw.map(normalizeJob) : LOCAL_DEMO_JOBS;
        setAllJobs(jobs);
        setFilteredJobs(jobs);
        setSelectedJob(jobs[0]);
      })
      .catch(() => {
        // Server unreachable — use client-side demo jobs as last resort
        setAllJobs(LOCAL_DEMO_JOBS);
        setFilteredJobs(LOCAL_DEMO_JOBS);
        setSelectedJob(LOCAL_DEMO_JOBS[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    const q = e.target.value.toLowerCase();
    setSearchQuery(q);
    setFilteredJobs(
      allJobs.filter(
        (j) =>
          j.jobTitle.toLowerCase().includes(q) ||
          j.companyName.toLowerCase().includes(q) ||
          j.jobGeo.toLowerCase().includes(q)
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] px-4 py-6 md:px-8 lg:px-6 lg:py-5 text-slate-900">
      <div className="mx-auto max-w-6xl flex flex-col gap-6 lg:grid lg:grid-cols-[1fr,1.4fr]">

        {/* ── Left: Job List ── */}
        <div className="flex flex-col overflow-hidden rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-2xl shadow-slate-300/50">

          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Find Jobs</h2>
                <p className="text-xs font-light text-slate-400 mt-0.5">
                  {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"} available
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#4f46e5]">
                <BsBriefcase size={11} /> Jobs
              </span>
            </div>
            {/* Search */}
            <div className="relative">
              <CiSearch size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, company or location..."
                value={searchQuery}
                onChange={handleSearch}
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
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <CiSearch size={36} className="mb-2 opacity-40" />
                <p className="text-sm">No jobs found</p>
                <p className="text-xs mt-0.5">Try a different search</p>
              </div>
            ) : (
              filteredJobs.map((job, i) => {
                const active = selectedJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 cursor-pointer transition-all duration-200 ${
                      active
                        ? "border-[#4f46e5] bg-[#eef2ff] shadow-md"
                        : "border-slate-100 bg-white shadow-sm hover:border-[#4f46e5]/30 hover:shadow-md"
                    }`}
                  >
                    <LogoOrInitials logo={job.companyLogo} name={job.companyName} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{job.jobTitle}</p>
                      <p className="text-[11px] text-slate-500 truncate">{job.companyName}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                          <CiLocationOn size={11} />{job.jobGeo}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tagColors[i % tagColors.length]}`}>
                          {job.jobType}
                        </span>
                      </div>
                    </div>
                    {active && (
                      <HiArrowRight size={14} className="text-[#4f46e5] flex-shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: Job Detail ── */}
        <div className="flex flex-col overflow-hidden rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-2xl shadow-slate-300/50">
          {selectedJob ? (
            <>
              {/* Banner + logo */}
              <div className="relative h-28 flex-shrink-0 bg-[linear-gradient(135deg,#03001e,#7303c0,#ec38bc,#fdeff9)]">
                <div className="absolute -bottom-7 left-6">
                  <LogoOrInitials logo={selectedJob.companyLogo} name={selectedJob.companyName} size="h-14 w-14" />
                </div>
              </div>

              {/* Title row */}
              <div className="px-6 pt-10 pb-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-900">{selectedJob.jobTitle}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selectedJob.companyName}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedJob.domain && (
                    <span className="rounded-full bg-[#eef2ff] px-2.5 py-1 text-[11px] font-medium text-[#4f46e5]">
                      {selectedJob.domain}
                    </span>
                  )}
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                    {selectedJob.jobType}
                  </span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                    {selectedJob.jobLevel}
                  </span>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 max-h-[calc(100vh-18rem)]">

                {/* Detail chips */}
                <div className="grid grid-cols-2 gap-2">
                  <DetailChip icon={<CiLocationOn size={16} />}  label="Location"  value={selectedJob.jobGeo} />
                  <DetailChip icon={<BsBriefcase size={14} />}   label="Job Type"  value={selectedJob.jobType} />
                  {selectedJob.postedDate && (
                    <DetailChip icon={<CiCalendarDate size={16} />} label="Posted" value={selectedJob.postedDate} />
                  )}
                  {selectedJob.applicants && (
                    <DetailChip icon={<BsPeople size={14} />} label="Applicants" value={selectedJob.applicants} />
                  )}
                </div>

                {/* Description */}
                {selectedJob.jobDescription && (
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">About this role</h3>
                    <div
                      className="text-xs text-slate-600 leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedJob.jobDescription }}
                    />
                  </div>
                )}

                {/* Cover Letter */}
                <button
                  onClick={() => setCoverLetterJob(selectedJob)}
                  className="flex items-center justify-center gap-2 w-full rounded-2xl border border-[#4f46e5] py-3 text-sm font-medium text-[#4f46e5] hover:bg-[#eef2ff] transition-colors"
                >
                  ✉ Generate Cover Letter
                </button>

                {/* Apply */}
                <button
                  onClick={() => handleApplyClick(selectedJob)}
                  className="flex items-center justify-center gap-2 w-full rounded-2xl bg-[#4f46e5] py-3 text-sm font-medium text-white shadow hover:bg-[#4338ca] transition-colors"
                >
                  Apply Now <HiArrowRight size={15} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <div className="h-16 w-16 rounded-2xl bg-[#eef2ff] flex items-center justify-center">
                <BsBriefcase size={28} className="text-[#4f46e5] opacity-50" />
              </div>
              <p className="text-sm font-medium text-slate-500">Select a job to view details</p>
            </div>
          )}
        </div>

      </div>

      {/* ── Confirmation Modal ── */}
      {pendingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={applyStatus === "loading" ? undefined : closeModal} />

          {/* Modal card */}
          <div className="relative w-full max-w-sm rounded-3xl border-2 border-slate-200/80 bg-white shadow-2xl shadow-slate-300/50 overflow-hidden">
            {/* Accent bar */}
            <div className="h-1.5 w-full bg-[linear-gradient(135deg,#03001e,#7303c0,#ec38bc,#fdeff9)]" />

            <div className="p-6">
              {/* Close */}
              {applyStatus !== "loading" && (
                <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
                  <HiX size={18} />
                </button>
              )}

              {/* Job info */}
              <div className="flex items-center gap-3 mb-5">
                <LogoOrInitials logo={pendingJob.companyLogo} name={pendingJob.companyName} size="h-11 w-11" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{pendingJob.jobTitle}</p>
                  <p className="text-xs text-slate-500 truncate">{pendingJob.companyName}</p>
                </div>
              </div>

              {/* States */}
              {!applyStatus && (
                <>
                  <p className="text-sm font-medium text-slate-800 mb-1">Did you complete your application?</p>
                  <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                    We opened the job page in a new tab. Let us know if you submitted your application so we can track it for you.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleConfirmApply}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#4f46e5] py-2.5 text-sm font-medium text-white hover:bg-[#4338ca] transition-colors shadow-sm"
                    >
                      <HiCheck size={15} /> Yes, I Applied
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-600 hover:bg-white transition-colors"
                    >
                      Not Yet
                    </button>
                  </div>
                </>
              )}

              {applyStatus === "loading" && (
                <div className="flex flex-col items-center py-4 gap-3">
                  <div className="flex gap-1.5">
                    {[0,1,2].map((i) => (
                      <span key={i} className="h-2 w-2 rounded-full bg-[#4f46e5] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">Saving your application...</p>
                </div>
              )}

              {applyStatus === "success" && (
                <div className="flex flex-col items-center py-4 gap-3 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <HiCheck size={24} className="text-emerald-500" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Application Tracked!</p>
                  <p className="text-xs text-slate-400">This job has been added to your applications. Good luck! 🎉</p>
                  <button onClick={closeModal} className="mt-1 rounded-2xl bg-[#4f46e5] px-6 py-2 text-xs font-medium text-white hover:bg-[#4338ca] transition-colors">
                    Done
                  </button>
                </div>
              )}

              {applyStatus === "duplicate" && (
                <div className="flex flex-col items-center py-4 gap-3 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-[#eef2ff] flex items-center justify-center">
                    <HiCheck size={24} className="text-[#4f46e5]" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Already Tracked</p>
                  <p className="text-xs text-slate-400">You've already applied to this job. It's in your applications.</p>
                  <button onClick={closeModal} className="mt-1 rounded-2xl bg-slate-100 px-6 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                    Got it
                  </button>
                </div>
              )}

              {applyStatus === "error" && (
                <div className="flex flex-col items-center py-4 gap-3 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center">
                    <HiX size={24} className="text-red-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Couldn't Save</p>
                  <p className="text-xs text-slate-400">Something went wrong. Please try again.</p>
                  <button onClick={closeModal} className="mt-1 rounded-2xl bg-slate-100 px-6 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── Cover Letter Modal ── */}
      {coverLetterJob && (
        <CoverLetterModal job={coverLetterJob} onClose={() => setCoverLetterJob(null)} />
      )}
    </div>
  );
};

export default FindJobs;
