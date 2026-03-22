import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

// ── Types ──────────────────────────────────────────────────────────────────

interface Frontmatter {
  [key: string]: string | undefined;
}

interface RefFile {
  filename: string;
  path: string;
  title: string;
  body: string;
}

interface Skill {
  dirName: string;
  name: string;
  description: string;
  entryPoint: string;
  body: string;
  refs: RefFile[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const SKILLS_DIR = join(process.cwd(), "skills");
const LLMS_PATH = join(process.cwd(), "llms.txt");

const HEADER = "# deBridge Agent Skills";
const SUMMARY = [
  "> Cross-chain DeFi agent skills for bridging, swapping, signing, and",
  "> monitoring across 20+ EVM chains and Solana. Use with deBridge MCP",
  "> server, SDK, or CLI.",
].join("\n");

function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const raw = match[1];
  const body = match[2];
  const fm: Frontmatter = {};

  let currentKey = "";
  let currentValue = "";
  let multiline = false;

  for (const line of raw.split("\n")) {
    if (multiline) {
      if (/^\s/.test(line)) {
        currentValue += " " + line.trim();
        continue;
      } else {
        fm[currentKey] = currentValue.trim();
        multiline = false;
      }
    }

    const kvMatch = line.match(/^(\w[\w.-]*):\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();
      if (val === ">" || val === "|") {
        multiline = true;
        currentValue = "";
      } else {
        fm[currentKey] = val.replace(/^["']|["']$/g, "");
      }
    }
  }
  if (multiline) fm[currentKey] = currentValue.trim();

  return { frontmatter: fm, body };
}

/** Extract link order from SKILL.md body for reference sorting */
function extractLinkOrder(body: string): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  const regex = /\[([^\]]*)\]\(([\w-]+\.md)\)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(body)) !== null) {
    const filename = m[2];
    if (!seen.has(filename)) {
      seen.add(filename);
      order.push(filename);
    }
  }
  return order;
}

/** Sort files by order of first appearance in SKILL.md body */
function sortByLinkOrder(files: string[], linkOrder: string[]): string[] {
  const orderMap = new Map(linkOrder.map((f, i) => [f, i]));
  return [...files].sort((a, b) => {
    const ia = orderMap.get(a) ?? Infinity;
    const ib = orderMap.get(b) ?? Infinity;
    if (ia !== ib) return ia - ib;
    return a.localeCompare(b);
  });
}

/** Truncate description to first sentence or 120 chars */
function truncateDescription(desc: string): string {
  const sentenceMatch = desc.match(/^[^.!?]+[.!?]/);
  const sentence = sentenceMatch ? sentenceMatch[0] : desc;
  if (sentence.length <= 120) return sentence;
  return sentence.slice(0, 117) + "...";
}

// ── Discovery ─────────────────────────────────────────────────────────────

function discoverSkills(): Skill[] {
  if (!existsSync(SKILLS_DIR)) {
    console.error(`Skills directory not found: ${SKILLS_DIR}`);
    process.exit(1);
  }

  const dirs = readdirSync(SKILLS_DIR).filter((entry) =>
    statSync(join(SKILLS_DIR, entry)).isDirectory() &&
    existsSync(join(SKILLS_DIR, entry, "SKILL.md"))
  );

  const skillOrder = ["common", ...dirs.filter((d) => d !== "common").sort()];
  const orderedDirs = skillOrder.filter((d) => dirs.includes(d));

  const skills: Skill[] = [];

  for (const dirName of orderedDirs) {
    const skillDir = join(SKILLS_DIR, dirName);
    const content = readFileSync(join(skillDir, "SKILL.md"), "utf-8");

    if (content.trim().length === 0) {
      console.log(`  – ${dirName} (skipped — empty)`);
      continue;
    }

    const { frontmatter, body } = parseFrontmatter(content);
    if (!frontmatter.name || !frontmatter.description) {
      console.log(`  – ${dirName} (skipped — missing frontmatter)`);
      continue;
    }

    // Discover and sort sibling reference files
    const siblingFiles = readdirSync(skillDir)
      .filter((f) => f.endsWith(".md") && f !== "SKILL.md" && f !== "AGENTS.md")
      .sort();

    const linkOrder = extractLinkOrder(body);
    const orderedFiles = sortByLinkOrder(siblingFiles, linkOrder);

    const refs: RefFile[] = [];
    for (const filename of orderedFiles) {
      const refContent = readFileSync(join(skillDir, filename), "utf-8");
      const { frontmatter: refFm, body: refBody } = parseFrontmatter(refContent);
      refs.push({
        filename,
        path: `skills/${dirName}/${filename}`,
        title: refFm.title || filename.replace(/\.md$/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        body: refBody,
      });
    }

    skills.push({
      dirName,
      name: frontmatter.name,
      description: frontmatter.description,
      entryPoint: `skills/${dirName}/SKILL.md`,
      body,
      refs,
    });

    console.log(`  ✓ ${dirName} (${refs.length} reference${refs.length !== 1 ? "s" : ""})`);
  }

  return skills;
}

// ── Generators ────────────────────────────────────────────────────────────

function generateLlmsTxt(skills: Skill[]): string {
  const lines: string[] = [];

  lines.push(HEADER);
  lines.push("");
  lines.push(SUMMARY);
  lines.push("");

  // Skills section
  lines.push("## Skills");
  lines.push("");
  for (const s of skills) {
    const desc = truncateDescription(s.description);
    lines.push(`- [${s.name}](${s.entryPoint}): ${desc}`);
  }
  lines.push("");

  // Optional section — all reference files
  const allRefs = skills.flatMap((s) => s.refs);
  if (allRefs.length > 0) {
    lines.push("## Optional");
    lines.push("");
    for (const s of skills) {
      for (const ref of s.refs) {
        lines.push(`- [${ref.title}](${ref.path})`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ── Main ──────────────────────────────────────────────────────────────────

function main(): void {
  const skills = discoverSkills();

  if (skills.length === 0) {
    console.error("No skills found");
    process.exit(1);
  }

  const llmsTxt = generateLlmsTxt(skills);
  const checkMode = process.argv.includes("--check");

  if (checkMode) {
    const existing = existsSync(LLMS_PATH) ? readFileSync(LLMS_PATH, "utf-8") : "";
    if (existing === llmsTxt) {
      console.log(`\n✓ ${LLMS_PATH} is up to date`);
    } else {
      console.error(`\n✗ ${LLMS_PATH} is out of date — run \`npm run build:llmstxt\` and commit`);
      process.exit(1);
    }
  } else {
    writeFileSync(LLMS_PATH, llmsTxt, "utf-8");
    const llmsLines = llmsTxt.split("\n").length;
    console.log(`\nWrote ${LLMS_PATH} (${llmsLines} lines, ${skills.length} skills)`);
  }
}

main();
