/**
 * Content schemas. All site data in /content conforms to these types.
 * Agents: update here first if adding fields, then the JSON, then the UI.
 */

/* ---------- Members / profiles ---------- */

export type ProfileBlockType =
  | "tools"
  | "achievements"
  | "projects"
  | "coursework"
  | "hobbies"
  | "internships"
  | "research"
  | "text";

export type ProfileBlock = {
  id: string;
  type: ProfileBlockType;
  /** "full" = spans whole row; "half" = packs 2-up on desktop */
  span: "full" | "half";
  title?: string;
  data: unknown;
};

export type Achievement = {
  year: string;
  title: string;
  org: string;
  description: string;
};

export type ProfileProject = {
  name: string;
  description: string;
  tags: string[];
  links: { label: string; url: string }[];
  image?: string;
};

export type CourseworkItem = { name: string; topics: string };
export type InternshipItem = { role: string; org?: string; description: string };

export type Member = {
  slug: string;
  name: string;
  role: string; // e.g. "Executive, ARIES"
  tagline: string;
  year?: string; // e.g. "3rd Year, MAE"
  location?: string; // e.g. "IIT Delhi"
  avatar?: string; // image path; falls back to initials
  resumeUrl?: string;
  socials: { label: string; url: string }[];
  blocks: ProfileBlock[];
};

/* ---------- Projects ---------- */

/** Contributor on a project — member slug, alumni, or external (non-ARIES). */
export type ProjectContributor = {
  name: string;
  kind: "member" | "alumni" | "external";
  /** Present when kind is "member" (and optionally for alumni with a known slug). */
  slug?: string;
};

export type Project = {
  slug: string;
  name: string;
  accent?: string; // accent word in the title, e.g. "Call AI"
  tagline: string;
  description: string;
  category: string; // e.g. "AI / ML", "Hackathon", "Publication"
  tags: string[];
  techStack?: string[];
  features?: { title: string; description: string }[];
  highlights?: { title: string; description: string }[];
  screenshots?: { title: string; description: string; image?: string }[];
  links?: { label: string; url: string }[];
  /** Member slugs (legacy) or rich contributor refs. */
  contributors?: Array<string | ProjectContributor>;
  image?: string;
  video?: string; // short clip URL (mp4/webm)
  featured?: boolean;
  about?: string; // long-form "About the Project" text
};

/* ---------- Events ---------- */

export type AriesEvent = {
  slug: string;
  title: string;
  type: "Talk" | "Workshop" | "Hackathon" | "External";
  date: string; // ISO date
  startTime?: string;
  endTime?: string;
  venue?: string;
  description: string;
  body?: string; // long description for the detail page
  image?: string;
  video?: string; // short clip URL (mp4/webm)
  links: { label: string; url: string }[];
};

/* ---------- Resources ---------- */

export type Resource = {
  title: string;
  description: string;
  type: "Tool" | "Book" | "Course" | "Tutorial" | "Dataset";
  url: string;
  addedOn: string; // ISO date
  featured?: boolean;
  image?: string;
};

/* ---------- Team ---------- */

export type TeamMemberRef = {
  name: string;
  role: string;
  slug?: string; // links to /:slug profile when present
  photo?: string;
};

export type TeamYear = {
  year: string; // "2026-27"
  photo?: string;
  coreTeam: TeamMemberRef[];
  coordinators: TeamMemberRef[];
  executives: { group: string; members: TeamMemberRef[] }[];
};

export type Alumnus = {
  name: string;
  role: string; // current role
  org: string;
  photo?: string;
  slug?: string;
};

export type TeamData = {
  years: TeamYear[];
  alumni: Alumnus[];
};
