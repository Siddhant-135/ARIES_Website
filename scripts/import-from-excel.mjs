#!/usr/bin/env node
/**
 * Import member/team data from an Excel (.xlsx) file.
 *
 * - Reads rows using column names from import-config.json
 * - Finds Google Drive links in the photo column (or any cell)
 * - Downloads images to public/images/members/{slug}.{ext}
 * - Writes content/members/{slug}.json and optionally patches content/team.json
 *
 * Usage:
 *   node scripts/import-from-excel.mjs path/to/responses.xlsx
 *   node scripts/import-from-excel.mjs path/to/responses.xlsx --config scripts/import-config.json
 *   node scripts/import-from-excel.mjs path/to/responses.xlsx --dry-run
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DEFAULT_CONFIG = {
  sheet: 0,
  columns: {
    name: "Name",
    role: "Role",
    tagline: "Tagline",
    year: "Year",
    location: "Location",
    photo: "Photo",
    github: "GitHub",
    linkedin: "LinkedIn",
    email: "Email",
    resume: "Resume",
  },
};

function usage() {
  console.log(`Usage: node scripts/import-from-excel.mjs <file.xlsx> [options]

Options:
  --config <path>   Column mapping JSON (default: scripts/import-config.json)
  --dry-run         Parse rows and print actions without writing files
  --skip-team       Do not update content/team.json
  --help            Show this help
`);
}

function parseArgs(argv) {
  const args = { file: null, config: null, dryRun: false, skipTeam: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    }
    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (arg === "--skip-team") {
      args.skipTeam = true;
      continue;
    }
    if (arg === "--config") {
      args.config = argv[++i];
      continue;
    }
    if (!arg.startsWith("-") && !args.file) {
      args.file = arg;
      continue;
    }
    console.error(`Unknown argument: ${arg}`);
    usage();
    process.exit(1);
  }
  if (!args.file) {
    usage();
    process.exit(1);
  }
  return args;
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Extract a Google Drive file ID from common share / form-upload URLs. */
export function extractDriveFileId(input) {
  if (!input || typeof input !== "string") return null;
  const url = input.trim();
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/open\?id=([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/uc\?.*[?&]id=([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extensionFromContentType(contentType) {
  if (!contentType) return ".jpg";
  const ct = contentType.split(";")[0].trim().toLowerCase();
  const map = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/heic": ".heic",
    "image/heif": ".heif",
  };
  return map[ct] ?? ".jpg";
}

function extensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"].includes(ext)) {
      return ext === ".jpeg" ? ".jpg" : ext;
    }
  } catch {
    // ignore
  }
  return null;
}

/** Download a publicly shared Drive file; handles the large-file confirm token. */
export async function downloadDriveFile(fileId) {
  const baseUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  let res = await fetch(baseUrl, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Drive download failed (${res.status}) for file ${fileId}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    const html = await res.text();
    const confirmMatch =
      html.match(/confirm=([0-9A-Za-z_]+)/) ??
      html.match(/name="confirm"\s+value="([0-9A-Za-z_]+)"/);
    if (confirmMatch) {
      const confirmUrl = `${baseUrl}&confirm=${confirmMatch[1]}`;
      res = await fetch(confirmUrl, { redirect: "follow" });
      if (!res.ok) {
        throw new Error(`Drive confirm download failed (${res.status}) for file ${fileId}`);
      }
    } else {
      throw new Error(
        `Drive link for ${fileId} is not publicly downloadable. Share it as "Anyone with the link".`,
      );
    }
  }

  const finalType = res.headers.get("content-type") ?? contentType;
  if (finalType.includes("text/html")) {
    throw new Error(
      `Drive link for ${fileId} returned HTML instead of an image. Check sharing permissions.`,
    );
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const ext =
    extensionFromUrl(res.url) ??
    extensionFromContentType(finalType);

  return { buffer, ext, contentType: finalType };
}

function loadConfig(configPath) {
  const resolved = configPath
    ? path.resolve(process.cwd(), configPath)
    : path.join(__dirname, "import-config.json");

  if (!fs.existsSync(resolved)) {
    console.warn(`Config not found at ${resolved}; using built-in defaults.`);
    console.warn(`Copy scripts/import-config.example.json → scripts/import-config.json to customize.\n`);
    return structuredClone(DEFAULT_CONFIG);
  }

  const userConfig = JSON.parse(fs.readFileSync(resolved, "utf8"));
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    columns: { ...DEFAULT_CONFIG.columns, ...userConfig.columns },
  };
}

function readWorkbookRows(filePath, sheetIndex) {
  const workbook = XLSX.readFile(path.resolve(filePath), { cellDates: true });
  const sheetName = workbook.SheetNames[sheetIndex];
  if (!sheetName) {
    throw new Error(`Sheet index ${sheetIndex} not found. Available: ${workbook.SheetNames.join(", ")}`);
  }
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
}

function cellValue(row, columnName) {
  if (!columnName) return "";
  const value = row[columnName];
  return value == null ? "" : String(value).trim();
}

function findDriveLink(row, photoColumn) {
  const direct = cellValue(row, photoColumn);
  if (extractDriveFileId(direct)) return direct;

  for (const value of Object.values(row)) {
    const text = value == null ? "" : String(value).trim();
    if (extractDriveFileId(text)) return text;
  }
  return "";
}

function buildSocials(row, columns) {
  const socials = [];
  const pairs = [
    ["GitHub", columns.github],
    ["LinkedIn", columns.linkedin],
    ["Email", columns.email],
  ];

  for (const [label, col] of pairs) {
    const raw = cellValue(row, col);
    if (!raw) continue;
    const url =
      label === "Email"
        ? raw.startsWith("mailto:") ? raw : `mailto:${raw}`
        : raw;
    socials.push({ label, url });
  }
  return socials;
}

function defaultMemberJson({ slug, name, role, tagline, year, location, avatar, resumeUrl, socials }) {
  return {
    slug,
    name,
    role: role || "Member, ARIES",
    tagline: tagline || "",
    year: year || undefined,
    location: location || "IIT Delhi",
    avatar,
    resumeUrl: resumeUrl || undefined,
    socials,
    blocks: [],
  };
}

/** Map spreadsheet Post values to team.json placement. */
function resolveTeamPlacement(post) {
  const normalized = post.trim().toLowerCase();
  if (normalized === "oc" || normalized === "co-oc" || normalized === "research lead") {
    return { section: "coreTeam", role: post.trim() };
  }
  if (normalized === "coordinator" || normalized === "research coordinator") {
    return { section: "coordinators", role: post.trim() };
  }
  if (normalized === "executive") {
    return { section: "executives", group: "BRAIN", role: "Executive" };
  }
  if (normalized === "research executive") {
    return { section: "executives", group: "CANVAS", role: "Research Executive" };
  }
  return { section: "coordinators", role: post.trim() || "Member" };
}

function emptyYear(yearLabel) {
  return { year: yearLabel, coreTeam: [], coordinators: [], executives: [] };
}

function addToYear(yearEntry, placement, memberRef) {
  if (placement.section === "coreTeam") {
    yearEntry.coreTeam.push({ ...memberRef, role: placement.role });
    return;
  }
  if (placement.section === "coordinators") {
    yearEntry.coordinators.push({ ...memberRef, role: placement.role });
    return;
  }
  const groupName = placement.group ?? "GENERAL";
  let group = yearEntry.executives.find((g) => g.group === groupName);
  if (!group) {
    group = { group: groupName, members: [] };
    yearEntry.executives.push(group);
  }
  group.members.push({ ...memberRef, role: placement.role });
}

function uniqueSlug(name, post, usedSlugs, email) {
  const candidates = [
    slugify(name),
    slugify(`${name}-${post}`),
    email ? slugify(email.split("@")[0]) : null,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!usedSlugs.has(candidate)) {
      usedSlugs.add(candidate);
      return candidate;
    }
  }

  let i = 2;
  const base = slugify(name) || "member";
  while (usedSlugs.has(`${base}-${i}`)) i += 1;
  const slug = `${base}-${i}`;
  usedSlugs.add(slug);
  return slug;
}

async function main() {
  const args = parseArgs(process.argv);
  const config = loadConfig(args.config);
  const rows = readWorkbookRows(args.file, config.sheet);

  if (rows.length === 0) {
    console.log("No rows found in the spreadsheet.");
    return;
  }

  const membersDir = path.join(ROOT, "content", "members");
  const imagesDir = path.join(ROOT, "public", "images", "members");
  const teamPath = path.join(ROOT, "content", "team.json");

  if (!args.dryRun) {
    fs.mkdirSync(membersDir, { recursive: true });
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  let teamData = null;
  let yearEntry = null;
  const yearLabel = config.team?.year;
  if (!args.skipTeam && fs.existsSync(teamPath)) {
    teamData = JSON.parse(fs.readFileSync(teamPath, "utf8"));
    if (yearLabel && config.team?.replaceYear) {
      teamData.years = teamData.years.filter((y) => y.year !== yearLabel);
      yearEntry = emptyYear(yearLabel);
      teamData.years.unshift(yearEntry);
    }
  } else if (yearLabel) {
    yearEntry = emptyYear(yearLabel);
  }

  const results = [];
  const usedSlugs = new Set();

  for (const row of rows) {
    const name = cellValue(row, config.columns.name);
    const post = cellValue(row, config.columns.role);
    if (!name || name.toLowerCase() === "tbd") continue;

    const email = cellValue(row, config.columns.email);
    const slug = uniqueSlug(name, post, usedSlugs, email);
    if (!slug) {
      console.warn(`Skipping row with invalid name: ${JSON.stringify(name)}`);
      continue;
    }

    const driveUrl = findDriveLink(row, config.columns.photo);
    const fileId = extractDriveFileId(driveUrl);
    let avatar;
    let imagePath;

    if (fileId) {
      if (args.dryRun) {
        avatar = `/images/members/${slug}.jpg`;
        imagePath = path.join(imagesDir, `${slug}.jpg`);
        console.log(`[dry-run] Would download Drive image ${fileId} → ${imagePath}`);
      } else {
        try {
          const { buffer, ext } = await downloadDriveFile(fileId);
          imagePath = path.join(imagesDir, `${slug}${ext}`);
          fs.writeFileSync(imagePath, buffer);
          avatar = `/images/members/${slug}${ext}`;
          console.log(`Downloaded photo for ${name} → ${avatar}`);
        } catch (err) {
          console.warn(`Photo download failed for ${name}: ${err.message}`);
        }
      }
    } else if (driveUrl) {
      console.warn(`Could not parse Drive file ID for ${name}: ${driveUrl}`);
    }

    const member = defaultMemberJson({
      slug,
      name,
      role: post || "Member, ARIES",
      tagline: cellValue(row, config.columns.tagline),
      year: cellValue(row, config.columns.year),
      location: cellValue(row, config.columns.location),
      avatar,
      resumeUrl: cellValue(row, config.columns.resume),
      socials: buildSocials(row, config.columns),
    });

    const memberPath = path.join(membersDir, `${slug}.json`);
    if (args.dryRun) {
      console.log(`[dry-run] Would write ${memberPath}`);
    } else {
      fs.writeFileSync(memberPath, `${JSON.stringify(member, null, 2)}\n`);
      console.log(`Wrote member profile → content/members/${slug}.json`);
    }

    if (yearEntry && post) {
      addToYear(yearEntry, resolveTeamPlacement(post), {
        name,
        slug,
        photo: avatar,
      });
    }

    results.push({ slug, name, avatar: avatar ?? null });
  }

  if (teamData && !args.skipTeam) {
    if (args.dryRun) {
      console.log("[dry-run] Would update content/team.json");
    } else {
      fs.writeFileSync(teamPath, `${JSON.stringify(teamData, null, 2)}\n`);
      console.log("Updated content/team.json");
    }
  }

  console.log(`\nDone. Processed ${results.length} member(s).`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
