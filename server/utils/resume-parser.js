import path from "node:path";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";

const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express", "MongoDB", "Mongoose",
  "PostgreSQL", "MySQL", "Python", "Java", "C++", "C", "C#", "Go", "Rust", "PHP", "Ruby",
  "HTML", "CSS", "Tailwind CSS", "Bootstrap", "Redux", "GraphQL", "REST API", "Docker",
  "Kubernetes", "AWS", "Azure", "GCP", "Git", "GitHub", "GitLab", "Linux", "Figma", "Supabase",
  "Firebase", "Redis", "Machine Learning", "TensorFlow", "PyTorch", "Data Structures", "Algorithms",
  "DSA", "SQL", "NoSQL", "Jest", "Cypress", "Playwright", "Vite", "Webpack",
];

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");

const dedupeStrings = (values = []) => {
  const seen = new Set();
  return values
    .map((value) => cleanString(value))
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const normalizeDateString = (value) => cleanString(value);

const normalizeWhitespace = (text) =>
  text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, "\n");

const splitLines = (text) =>
  normalizeWhitespace(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const compactUrlText = (text) =>
  text
    .replace(/\s*\.\s*/g, ".")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s*:\s*/g, ":")
    .replace(/\n/g, " ");

const normalizeSocialUrl = (value, domain) => {
  const cleaned = cleanString(value)
    .replace(/[),.;]+$/g, "")
    .replace(/\s+/g, "");

  if (!cleaned) return "";

  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  if (cleaned.toLowerCase().startsWith("www.")) return `https://${cleaned}`;
  if (cleaned.toLowerCase().startsWith(domain)) return `https://${cleaned}`;

  return "";
};

const extractSocialUrl = (text, domain) => {
  const normalized = compactUrlText(text);
  const patterns = [
    new RegExp(`https?:\\/\\/(?:www\\.)?${domain.replace(".", "\\.")}\\/[^\\s|,;]+`, "i"),
    new RegExp(`(?:www\\.)?${domain.replace(".", "\\.")}\\/[^\\s|,;]+`, "i"),
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      return normalizeSocialUrl(match[0], domain);
    }
  }

  return "";
};

const extractPortfolioUrl = (text, excludedUrls = []) => {
  const normalized = compactUrlText(text);
  const matches = normalized.match(/(?:https?:\/\/|www\.)[^\s|,;]+/gi) || [];

  const normalizedExcluded = excludedUrls.filter(Boolean).map((url) => url.toLowerCase());

  return matches
    .map((url) => (/^https?:\/\//i.test(url) ? url : `https://${url}`))
    .map((url) => url.replace(/[),.;]+$/g, ""))
    .find((url) => {
      const lower = url.toLowerCase();
      return !normalizedExcluded.includes(lower) &&
        !lower.includes("linkedin.com/") &&
        !lower.includes("github.com/");
    }) || "";
};

const normalizeExperience = (items = []) =>
  items
    .filter(Boolean)
    .map((item) => ({
      title: cleanString(item.title),
      company: cleanString(item.company),
      type: cleanString(item.type) || "Full-time",
      startDate: normalizeDateString(item.startDate),
      endDate: normalizeDateString(item.endDate),
      current: Boolean(item.current),
    }))
    .filter((item) => item.title || item.company);

const normalizeEducation = (items = []) =>
  items
    .filter(Boolean)
    .map((item) => ({
      institution: cleanString(item.institution),
      degree: cleanString(item.degree),
      field: cleanString(item.field),
      gpa: cleanString(item.gpa),
      startDate: normalizeDateString(item.startDate),
      endDate: normalizeDateString(item.endDate),
      current: Boolean(item.current),
    }))
    .filter((item) => item.institution || item.degree);

const parseJsonResponse = (text) => {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned);
};

const deriveAgeFromDob = (dob) => {
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return "";

  const now = new Date();
  let age = now.getFullYear() - parsed.getFullYear();
  const monthDiff = now.getMonth() - parsed.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < parsed.getDate())) {
    age -= 1;
  }
  return age > 0 ? String(age) : "";
};

const extractFallbackSkills = (text) => {
  const lower = text.toLowerCase();
  return COMMON_SKILLS.filter((skill) => lower.includes(skill.toLowerCase()));
};

const SECTION_ALIASES = {
  summary: ["summary", "professional summary", "profile", "about me", "career objective", "objective"],
  experience: ["experience", "work experience", "professional experience", "employment history", "internship", "internships"],
  education: ["education", "academic background", "academics", "qualification", "qualifications"],
  skills: ["skills", "technical skills", "core skills", "technologies", "tech stack"],
};

const findSectionContent = (lines, sectionNames) => {
  const lowerNames = sectionNames.map((name) => name.toLowerCase());
  const startIndex = lines.findIndex((line) => lowerNames.includes(line.toLowerCase().replace(/[:\-]+$/, "").trim()));
  if (startIndex === -1) return [];

  const collected = [];
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const normalizedLine = lines[i].toLowerCase().replace(/[:\-]+$/, "").trim();
    const isAnotherSection = Object.values(SECTION_ALIASES).some((aliases) => aliases.includes(normalizedLine));
    const looksLikeContact = /linkedin|github|portfolio|@|phone|mobile|contact/i.test(lines[i]);
    if (isAnotherSection || looksLikeContact) break;
    collected.push(lines[i]);
  }

  return collected;
};

const looksLikeDateRange = (line) =>
  /(20\d{2}|19\d{2}|\bpresent\b|\bcurrent\b|\bjan\b|\bfeb\b|\bmar\b|\bapr\b|\bmay\b|\bjun\b|\bjul\b|\baug\b|\bsep\b|\boct\b|\bnov\b|\bdec\b)/i.test(line);

const extractSummary = (lines) => {
  const sectionLines = findSectionContent(lines, SECTION_ALIASES.summary);
  if (sectionLines.length > 0) return sectionLines.slice(0, 4).join(" ");

  return lines
    .slice(0, 12)
    .filter((line) => line.length > 40 && !/@|linkedin|github|education|experience|skills/i.test(line))
    .slice(0, 2)
    .join(" ");
};

const extractEducationFallback = (lines) => {
  const sectionLines = findSectionContent(lines, SECTION_ALIASES.education);
  if (sectionLines.length === 0) return [];

  const education = [];
  for (let i = 0; i < sectionLines.length; i += 1) {
    const line = sectionLines[i];
    if (!line) continue;

    if (/b\.?tech|bachelor|master|m\.?tech|b\.?e|bsc|msc|phd|diploma/i.test(line)) {
      const next = sectionLines[i + 1] || "";
      education.push({
        institution: /university|college|school|institute/i.test(next) ? next : "",
        degree: line,
        field: "",
        gpa: "",
        startDate: "",
        endDate: "",
        current: /present|current/i.test(`${line} ${next}`),
      });
      if (next) i += 1;
    } else if (/university|college|school|institute/i.test(line)) {
      education.push({
        institution: line,
        degree: "",
        field: "",
        gpa: "",
        startDate: "",
        endDate: "",
        current: false,
      });
    }
  }

  return education;
};

const extractExperienceFallback = (lines) => {
  const sectionLines = findSectionContent(lines, SECTION_ALIASES.experience);
  if (sectionLines.length === 0) return [];

  const experience = [];
  for (let i = 0; i < sectionLines.length; i += 1) {
    const line = sectionLines[i];
    if (!line) continue;

    if (/engineer|developer|intern|analyst|consultant|designer|manager|associate|lead|architect/i.test(line)) {
      const companyLine = sectionLines[i + 1] || "";
      const dateLine = sectionLines[i + 2] || "";

      experience.push({
        title: line,
        company: !looksLikeDateRange(companyLine) ? companyLine : "",
        type: /intern/i.test(`${line} ${companyLine}`) ? "Internship" : "Full-time",
        startDate: looksLikeDateRange(dateLine)
          ? dateLine
          : looksLikeDateRange(companyLine)
            ? companyLine
            : "",
        endDate: "",
        current: /present|current/i.test(`${companyLine} ${dateLine}`),
      });

      if (dateLine && looksLikeDateRange(dateLine)) {
        i += 2;
      } else if (companyLine) {
        i += 1;
      }
    } else if (looksLikeDateRange(line) && experience.length > 0 && !experience[experience.length - 1].startDate) {
      experience[experience.length - 1].startDate = line;
      experience[experience.length - 1].current = /present|current/i.test(line);
    }
  }

  return experience.filter((item) => item.title || item.company);
};

const scoreEntries = (entries = [], keys = []) =>
  entries.reduce(
    (total, entry) =>
      total + keys.reduce((sum, key) => sum + (cleanString(entry?.[key]) ? 1 : 0), 0),
    0,
  );

const chooseRicherEntries = (primary = [], fallback = [], keys = []) => {
  const primaryScore = scoreEntries(primary, keys);
  const fallbackScore = scoreEntries(fallback, keys);
  return primaryScore >= fallbackScore ? primary : fallback;
};

const mergeParsedData = (primary = {}, fallback = {}) => ({
  ...fallback,
  ...primary,
  designation: cleanString(primary.designation) || cleanString(fallback.designation),
  summary: cleanString(primary.summary) || cleanString(fallback.summary),
  linkedin: cleanString(primary.linkedin) || cleanString(fallback.linkedin),
  github: cleanString(primary.github) || cleanString(fallback.github),
  portfolio: cleanString(primary.portfolio) || cleanString(fallback.portfolio),
  skills: Array.isArray(primary.skills) && primary.skills.length > 0 ? primary.skills : fallback.skills || [],
  experience: chooseRicherEntries(primary.experience || [], fallback.experience || [], ["title", "company", "startDate"]),
  education: chooseRicherEntries(primary.education || [], fallback.education || [], ["institution", "degree", "field"]),
});

const extractFallbackData = (text) => {
  const normalizedText = normalizeWhitespace(text);
  const lines = splitLines(normalizedText);

  const emailMatch = normalizedText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = normalizedText.match(/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{4,}/);
  const linkedin = extractSocialUrl(normalizedText, "linkedin.com");
  const github = extractSocialUrl(normalizedText, "github.com");
  const portfolio = extractPortfolioUrl(normalizedText, [linkedin, github]);
  const fullName = lines[0] && !lines[0].includes("@") ? lines[0] : "";
  const fullAddress = lines.find((line) => /india|usa|united states|street|road|avenue|nagar|colony|city/i.test(line)) || "";

  return {
    fullName,
    contactEmail: emailMatch?.[0] || "",
    phone: phoneMatch?.[0] || "",
    designation: "",
    age: "",
    dob: "",
    summary: extractSummary(lines),
    fullAddress,
    city: "",
    country: "",
    linkedin,
    github,
    portfolio,
    skills: extractFallbackSkills(normalizedText),
    experience: extractExperienceFallback(lines),
    education: extractEducationFallback(lines),
  };
};

const parseWithGemini = async (resumeText) => {
  if (!genAI) return null;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `
You are a resume parser for technical resumes.
Extract only information that is explicitly present or strongly inferable from the resume text.
Return a strict JSON object with exactly these keys:
{
  "fullName": "",
  "contactEmail": "",
  "phone": "",
  "designation": "",
  "age": "",
  "dob": "",
  "summary": "",
  "fullAddress": "",
  "city": "",
  "country": "",
  "linkedin": "",
  "github": "",
  "portfolio": "",
  "skills": [],
  "experience": [
    {
      "title": "",
      "company": "",
      "type": "",
      "startDate": "",
      "endDate": "",
      "current": false
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": "",
      "gpa": "",
      "startDate": "",
      "endDate": "",
      "current": false
    }
  ]
}

Rules:
- Do not invent data.
- Use empty strings or empty arrays when missing.
- Keep dates as plain strings exactly as they appear when possible.
- "designation" should be the candidate's current or most recent job title or headline.
- "summary" should be a short 1-3 sentence professional summary only if the resume contains enough information.
- For linkedin/github/portfolio, prefer full canonical URLs. If the resume only contains "linkedin.com/in/..." or "github.com/...", return them as full https URLs.

Resume text:
${resumeText}
`;

  const result = await model.generateContent(prompt);
  return parseJsonResponse(result.response.text());
};

export const extractResumeText = async (file) => {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const mime = file.mimetype || "";

  if (mime === "application/pdf" || extension === ".pdf") {
    const pdfData = new Uint8Array(file.buffer);
    const parser = new PDFParse({ data: pdfData });
    const textResult = await parser.getText({ parseHyperlinks: true });
    const infoResult = await parser.getInfo({ parsePageInfo: true, parseHyperlinks: true });
    await parser.destroy();

    const pageLinks = (infoResult.pages || [])
      .flatMap((page) => page.links || [])
      .map((link) => {
        const label = cleanString(link.text);
        const url = cleanString(link.url);
        if (!label && !url) return "";
        if (label && url) return `${label}: ${url}`;
        return label || url;
      })
      .filter(Boolean)
      .join("\n");

    return [textResult.text, pageLinks].filter(Boolean).join("\n");
  }

  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === ".docx"
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }

  if (mime.startsWith("text/") || extension === ".txt") {
    return file.buffer.toString("utf8");
  }

  throw new Error("Unsupported file type. Please upload a PDF, DOCX, or TXT resume.");
};

export const parseResumeData = async (resumeText) => {
  const fallbackData = extractFallbackData(resumeText);

  try {
    const aiData = await parseWithGemini(resumeText);
    if (aiData) return mergeParsedData(aiData, fallbackData);
  } catch (error) {
    console.error("Resume AI parsing failed, using fallback parser:", error.message);
  }

  return fallbackData;
};

export const normalizeParsedResume = (data = {}, fileName = "") => {
  const dob = cleanString(data.dob);
  const age = cleanString(data.age) || deriveAgeFromDob(dob);
  const linkedin = normalizeSocialUrl(data.linkedin, "linkedin.com");
  const github = normalizeSocialUrl(data.github, "github.com");
  const portfolio = cleanString(data.portfolio) && !/^https?:\/\//i.test(cleanString(data.portfolio))
    && /^www\.|^[a-z0-9-]+\.[a-z]{2,}/i.test(cleanString(data.portfolio))
    ? `https://${cleanString(data.portfolio)}`
    : cleanString(data.portfolio);

  return {
    username: cleanString(data.fullName),
    profile: {
      phone: cleanString(data.phone),
      contactEmail: cleanString(data.contactEmail),
      designation: cleanString(data.designation) || cleanString(data.experience?.[0]?.title),
      dob,
      age,
      summary: cleanString(data.summary),
      fullAddress: cleanString(data.fullAddress),
      city: cleanString(data.city),
      country: cleanString(data.country),
      linkedin,
      github,
      portfolio,
      skills: dedupeStrings(data.skills),
      experience: normalizeExperience(data.experience),
      education: normalizeEducation(data.education),
      resumeMeta: {
        fileName: cleanString(fileName),
        parsedAt: new Date(),
      },
    },
  };
};
