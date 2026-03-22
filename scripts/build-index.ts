import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

// ── Types ──────────────────────────────────────────────────────────────────

interface Frontmatter {
  [key: string]: string | undefined;
}

interface SkillEntry {
  name: string;
  description: string;
  entry_point: string;
  references: string[];
  scripts?: string[];
}

interface SkillIndex {
  schema_version: string;
  name: string;
  description: string;
  homepage: string;
  skills: SkillEntry[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const SKILLS_DIR = join(process.cwd(), "skills");
const OUTPUT_PATH = join(SKILLS_DIR, "index.json");

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

// ── Build ──────────────────────────────────────────────────────────────────

function main(): void {
  if (!existsSync(SKILLS_DIR)) {
    console.error(`Skills directory not found: ${SKILLS_DIR}`);
    process.exit(1);
  }

  const dirs = readdirSync(SKILLS_DIR).filter((entry) =>
    statSync(join(SKILLS_DIR, entry)).isDirectory() &&
    existsSync(join(SKILLS_DIR, entry, "SKILL.md"))
  );

  // Order: common first (prerequisite), then alphabetical
  const skillOrder = ["common", ...dirs.filter((d) => d !== "common").sort()];
  const orderedDirs = skillOrder.filter((d) => dirs.includes(d));

  const skills: SkillEntry[] = [];
  const skipped: string[] = [];

  for (const dirName of orderedDirs) {
    const skillDir = join(SKILLS_DIR, dirName);
    const content = readFileSync(join(skillDir, "SKILL.md"), "utf-8");

    if (content.trim().length === 0) {
      skipped.push(dirName);
      console.log(`  – ${dirName} (skipped — empty)`);
      continue;
    }

    const { frontmatter } = parseFrontmatter(content);
    if (!frontmatter.name || !frontmatter.description) {
      skipped.push(dirName);
      console.log(`  – ${dirName} (skipped — missing frontmatter)`);
      continue;
    }

    // Discover sibling reference files
    const refs = readdirSync(skillDir)
      .filter((f) => f.endsWith(".md") && f !== "SKILL.md" && f !== "AGENTS.md")
      .sort()
      .map((f) => `skills/${dirName}/${f}`);

    // Discover bundled scripts
    const scriptsDir = join(skillDir, "scripts");
    const scripts = existsSync(scriptsDir) && statSync(scriptsDir).isDirectory()
      ? readdirSync(scriptsDir)
          .filter((f) => f.endsWith(".ts") || f.endsWith(".js") || f.endsWith(".py") || f.endsWith(".sh"))
          .sort()
          .map((f) => `skills/${dirName}/scripts/${f}`)
      : [];

    const entry: SkillEntry = {
      name: frontmatter.name,
      description: frontmatter.description,
      entry_point: `skills/${dirName}/SKILL.md`,
      references: refs,
    };
    if (scripts.length > 0) {
      entry.scripts = scripts;
    }
    skills.push(entry);

    const parts = [`${refs.length} ref${refs.length !== 1 ? "s" : ""}`];
    if (scripts.length > 0) parts.push(`${scripts.length} script${scripts.length !== 1 ? "s" : ""}`);
    console.log(`  ✓ ${dirName} (${parts.join(", ")})`);
  }

  const index: SkillIndex = {
    schema_version: "1.0",
    name: "debridge",
    description: "deBridge cross-chain DeFi agent skills — bridge, swap, sign, and monitor across 20+ chains.",
    homepage: "https://agents.debridge.com",
    skills,
  };

  const output = JSON.stringify(index, null, 2) + "\n";
  const checkMode = process.argv.includes("--check");

  if (checkMode) {
    const existing = existsSync(OUTPUT_PATH) ? readFileSync(OUTPUT_PATH, "utf-8") : "";
    if (existing === output) {
      console.log(`\n✓ ${OUTPUT_PATH} is up to date`);
    } else {
      console.error(`\n✗ ${OUTPUT_PATH} is out of date — run \`npm run build:index\` and commit`);
      process.exit(1);
    }
  } else {
    writeFileSync(OUTPUT_PATH, output, "utf-8");
    console.log(`\nWrote ${OUTPUT_PATH} (${skills.length} skills)`);
  }

  if (skipped.length > 0) {
    console.log(`Skipped: ${skipped.join(", ")}`);
  }
}

main();
