import { supabase } from "../config/supabase.config.js";

const demoJobs = [
  { id: "d1", job_title: "Frontend Developer", company_name: "TechNova", company_logo_link: "", job_location: "San Francisco, CA", job_type: "Full-time", job_working_des: "Remote", job_description: "<p>Build modern web interfaces using React and Tailwind CSS. Work with a cross-functional team to deliver high-quality user experiences.</p><ul><li>3+ years React experience</li><li>Strong CSS/Tailwind skills</li><li>REST API integration</li></ul>", job_link: "#", posted_date: "2024-05-20", domain: "Engineering", applicants: "142" },
  { id: "d2", job_title: "Backend Engineer", company_name: "CloudNine SaaS", company_logo_link: "", job_location: "Remote", job_type: "Full-time", job_working_des: "Remote", job_description: "<p>Design and build scalable APIs and microservices using Node.js and MongoDB. Own backend architecture decisions.</p><ul><li>Node.js & Express</li><li>MongoDB / PostgreSQL</li><li>Docker & CI/CD</li></ul>", job_link: "#", posted_date: "2024-05-18", domain: "Engineering", applicants: "98" },
  { id: "d3", job_title: "Product Designer", company_name: "GreenGrid Energy", company_logo_link: "", job_location: "Portland, OR", job_type: "Full-time", job_working_des: "Hybrid", job_description: "<p>Lead end-to-end product design from research to high-fidelity prototypes. Collaborate with engineering and product teams.</p><ul><li>Figma proficiency</li><li>User research experience</li><li>Design systems knowledge</li></ul>", job_link: "#", posted_date: "2024-05-15", domain: "Design", applicants: "76" },
  { id: "d4", job_title: "Data Analyst", company_name: "Apex Logistics", company_logo_link: "", job_location: "Chicago, IL", job_type: "Full-time", job_working_des: "On-site", job_description: "<p>Analyze large datasets to drive business decisions. Build dashboards and reports using SQL and Python.</p><ul><li>SQL & Python</li><li>Tableau / Power BI</li><li>Statistical analysis</li></ul>", job_link: "#", posted_date: "2024-05-12", domain: "Analytics", applicants: "54" },
  { id: "d5", job_title: "DevOps Engineer", company_name: "Nebula Stream", company_logo_link: "", job_location: "Seattle, WA", job_type: "Full-time", job_working_des: "Remote", job_description: "<p>Manage cloud infrastructure on AWS. Automate deployments and maintain CI/CD pipelines for a fast-moving engineering team.</p><ul><li>AWS / GCP</li><li>Kubernetes & Terraform</li><li>GitHub Actions</li></ul>", job_link: "#", posted_date: "2024-05-10", domain: "Infrastructure", applicants: "61" },
  { id: "d6", job_title: "AI Research Scientist", company_name: "BioHealth AI", company_logo_link: "", job_location: "Boston, MA", job_type: "Full-time", job_working_des: "Hybrid", job_description: "<p>Research and develop machine learning models for healthcare applications. Publish findings and collaborate with clinical teams.</p><ul><li>PyTorch / TensorFlow</li><li>NLP & Computer Vision</li><li>PhD preferred</li></ul>", job_link: "#", posted_date: "2024-05-08", domain: "AI/ML", applicants: "33" },
  { id: "d7", job_title: "Security Analyst", company_name: "Ironclad Security", company_logo_link: "", job_location: "Washington, D.C.", job_type: "Full-time", job_working_des: "On-site", job_description: "<p>Monitor and respond to security incidents. Conduct vulnerability assessments and penetration testing across enterprise systems.</p><ul><li>SIEM tools</li><li>Penetration testing</li><li>Security certifications (CISSP/CEH)</li></ul>", job_link: "#", posted_date: "2024-05-05", domain: "Security", applicants: "47" },
  { id: "d8", job_title: "Unity Developer", company_name: "Velocity Games", company_logo_link: "", job_location: "Vancouver, BC", job_type: "Full-time", job_working_des: "Remote", job_description: "<p>Build immersive game experiences using Unity. Work with artists and designers to bring game concepts to life.</p><ul><li>Unity & C#</li><li>3D/2D game development</li><li>Performance optimization</li></ul>", job_link: "#", posted_date: "2024-05-01", domain: "Gaming", applicants: "89" },
];

export const getAllJobs = async (req, res) => {
  try {
    const { data, error } = await supabase.from("job_listing_tbl").select("*");

    // If Supabase errors or returns empty, fall back to demo jobs
    if (error || !data || data.length === 0) {
      return res.status(200).json(demoJobs);
    }

    res.status(200).json(data);
  } catch (err) {
    // On any failure, return demo jobs so the UI always has content
    res.status(200).json(demoJobs);
  }
};
