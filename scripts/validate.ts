import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

// ── Types ──────────────────────────────────────────────────────────────────

interface Frontmatter {
  name?: string;
  description?: string;
  [key: string]: unknown;
}

interface SkillInfo {
  dirName: string;
  dirPath: string;
  skillMdPath: string;
  skillMdContent: string;
  frontmatter: Frontmatter;
  body: string;
  bodyLines: number;
  siblingMdFiles: string[]; // .md files in skill dir, excluding SKILL.md
}

interface Result {
  skill: string;
  rule: string;
  pass: boolean;
  message?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const SKILLS_DIR = join(process.cwd(), "skills");

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

function extractMarkdownLinks(body: string): string[] {
  const links: string[] = [];
  const regex = /\[([^\]]*)\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(body)) !== null) {
    const href = m[2];
    // skip http(s) links and anchors
    if (!href.startsWith("http") && !href.startsWith("#")) {
      links.push(href);
    }
  }
  return links;
}

function extractCrossSkillRefs(body: string): string[] {
  const refs: string[] = [];
  const regex = /\.\.\/([\w-]+)\/SKILL\.md/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(body)) !== null) {
    refs.push(m[1]);
  }
  return [...new Set(refs)];
}

/**
 * Extract only dependency-direction cross-skill refs (PREREQUISITE and
 * MANDATORY lines, workflow steps). Excludes navigation tables (lines
 * starting with |) and "After Setup" / informational sections.
 */
function extractDependencyRefs(body: string): string[] {
  const refs: string[] = [];
  const regex = /\.\.\/([\w-]+)\/SKILL\.md/g;

  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    // Skip markdown table rows (navigation/quick reference)
    if (trimmed.startsWith("|")) continue;
    // Skip forward/hand-off references (sequential pipeline navigation)
    const lower = trimmed.toLowerCase();
    if (/\b(after|then|proceed|hand off|monitor|track)\b/.test(lower)) continue;

    let m: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((m = regex.exec(line)) !== null) {
      refs.push(m[1]);
    }
  }
  return [...new Set(refs)];
}

function getFirstNonEmptyBodyLine(body: string): string {
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) return trimmed;
  }
  return "";
}

function discoverSkills(): SkillInfo[] {
  if (!existsSync(SKILLS_DIR)) {
    console.error(`Skills directory not found: ${SKILLS_DIR}`);
    process.exit(1);
  }

  const skills: SkillInfo[] = [];
  for (const entry of readdirSync(SKILLS_DIR)) {
    const dirPath = join(SKILLS_DIR, entry);
    if (!statSync(dirPath).isDirectory()) continue;

    const skillMdPath = join(dirPath, "SKILL.md");
    if (!existsSync(skillMdPath)) continue;

    const skillMdContent = readFileSync(skillMdPath, "utf-8");
    const { frontmatter, body } = parseFrontmatter(skillMdContent);

    const siblingMdFiles = readdirSync(dirPath)
      .filter((f) => f.endsWith(".md") && f !== "SKILL.md" && f !== "AGENTS.md")
      .sort();

    skills.push({
      dirName: entry,
      dirPath,
      skillMdPath,
      skillMdContent,
      frontmatter,
      body,
      bodyLines: body.split("\n").length,
      siblingMdFiles,
    });
  }
  return skills;
}

// ── Rule Implementations ───────────────────────────────────────────────────

function checkNameHasPrefix(skill: SkillInfo): Result {
  const name = skill.frontmatter.name;
  return {
    skill: skill.dirName,
    rule: "name-has-prefix",
    pass: typeof name === "string" && name.startsWith("debridge-"),
    message: name ? `name="${name}"` : "missing name field",
  };
}

function checkNameFormat(skill: SkillInfo): Result {
  const name = skill.frontmatter.name;
  const valid = typeof name === "string" && /^debridge-[a-z]+(-[a-z]+)*$/.test(name);
  return {
    skill: skill.dirName,
    rule: "name-format",
    pass: valid,
    message: name ? `name="${name}"` : "missing name field",
  };
}

function checkDirNameFormat(skill: SkillInfo): Result {
  const dir = skill.dirName;
  const valid = /^[a-z]+(-[a-z]+)*$/.test(dir) && !dir.startsWith("debridge-");
  return {
    skill: skill.dirName,
    rule: "dir-name-format",
    pass: valid,
    message: dir.startsWith("debridge-") ? "directory should not have debridge- prefix" : undefined,
  };
}

function checkRequiredFrontmatter(skill: SkillInfo): Result {
  const hasName = typeof skill.frontmatter.name === "string" && skill.frontmatter.name.length > 0;
  const hasDesc =
    typeof skill.frontmatter.description === "string" && skill.frontmatter.description.length > 0;
  const missing = [!hasName && "name", !hasDesc && "description"].filter(Boolean);
  return {
    skill: skill.dirName,
    rule: "required-frontmatter",
    pass: hasName && hasDesc,
    message: missing.length ? `missing: ${missing.join(", ")}` : undefined,
  };
}

function checkDescriptionQuality(skill: SkillInfo): Result {
  const desc = skill.frontmatter.description || "";
  return {
    skill: skill.dirName,
    rule: "description-quality",
    pass: desc.length >= 30,
    message: `${desc.length} chars (min 30)`,
  };
}

function checkDescriptionHasTriggers(skill: SkillInfo): Result {
  const desc = (skill.frontmatter.description || "").toLowerCase();
  const hasTrigger =
    desc.includes("use when") ||
    desc.includes("triggers:") ||
    desc.includes("use before") ||
    desc.includes("use this") ||
    /\b(bridge|swap|sign|detect|setup|monitor|execute|create|track)\b/.test(desc);
  return {
    skill: skill.dirName,
    rule: "description-has-triggers",
    pass: hasTrigger,
    message: hasTrigger ? undefined : "no trigger phrases found in description",
  };
}

function checkBodyLength(skill: SkillInfo): Result {
  return {
    skill: skill.dirName,
    rule: "body-length",
    pass: skill.bodyLines <= 500,
    message: `${skill.bodyLines} lines (max 500)`,
  };
}

function checkReferenceLength(skill: SkillInfo): Result[] {
  const results: Result[] = [];
  for (const file of skill.siblingMdFiles) {
    const content = readFileSync(join(skill.dirPath, file), "utf-8");
    const lines = content.split("\n").length;
    results.push({
      skill: skill.dirName,
      rule: "reference-length",
      pass: lines <= 300,
      message: `${file}: ${lines} lines (max 300)`,
    });
  }
  return results;
}

function checkReferencesExist(skill: SkillInfo): Result[] {
  const results: Result[] = [];
  const links = extractMarkdownLinks(skill.body);

  for (const link of links) {
    // skip cross-skill refs (handled separately)
    if (link.startsWith("../")) continue;

    const targetPath = join(skill.dirPath, link);
    const exists = existsSync(targetPath);
    results.push({
      skill: skill.dirName,
      rule: "references-exist",
      pass: exists,
      message: exists ? link : `${link} — file not found`,
    });
  }
  return results;
}

function checkReferencesAreSiblings(skill: SkillInfo): Result[] {
  const results: Result[] = [];
  const links = extractMarkdownLinks(skill.body);

  for (const link of links) {
    if (link.startsWith("../")) continue; // cross-skill refs are allowed
    const hasSubdir = link.includes("/");
    results.push({
      skill: skill.dirName,
      rule: "references-are-siblings",
      pass: !hasSubdir,
      message: hasSubdir ? `${link} — must be a sibling, not in subdirectory` : link,
    });
  }
  return results;
}

function checkNoOrphanReferences(skill: SkillInfo): Result[] {
  const results: Result[] = [];
  const bodyLower = skill.body.toLowerCase();

  for (const file of skill.siblingMdFiles) {
    const linked = bodyLower.includes(file.toLowerCase());
    results.push({
      skill: skill.dirName,
      rule: "no-orphan-references",
      pass: linked,
      message: linked ? file : `${file} — not linked from SKILL.md`,
    });
  }
  return results;
}

function checkPrerequisitePresent(skill: SkillInfo): Result {
  if (skill.dirName === "common") {
    return { skill: skill.dirName, rule: "prerequisite-present", pass: true, message: "exempt" };
  }
  const firstLine = getFirstNonEmptyBodyLine(skill.body);
  const has = firstLine.toUpperCase().includes("PREREQUISITE");
  return {
    skill: skill.dirName,
    rule: "prerequisite-present",
    pass: has,
    message: has ? undefined : "body must start with PREREQUISITE line",
  };
}

// ── Content Rules ──────────────────────────────────────────────────────────

function checkNoHardcodedKeys(skill: SkillInfo): Result[] {
  const results: Result[] = [];
  const allFiles = ["SKILL.md", ...skill.siblingMdFiles];

  // Pattern: 0x followed by exactly 64 hex chars (private key length)
  const privKeyRegex = /0x[0-9a-fA-F]{64}\b/;

  for (const file of allFiles) {
    const content = readFileSync(join(skill.dirPath, file), "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (privKeyRegex.test(line)) {
        // allow obvious placeholders
        if (/0x0{64}/.test(line)) continue;
        results.push({
          skill: skill.dirName,
          rule: "no-hardcoded-keys",
          pass: false,
          message: `${file}:${i + 1} — possible hardcoded private key`,
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({ skill: skill.dirName, rule: "no-hardcoded-keys", pass: true });
  }
  return results;
}

function checkNoAbsolutePaths(skill: SkillInfo): Result[] {
  const results: Result[] = [];
  const allFiles = ["SKILL.md", ...skill.siblingMdFiles];
  const absPathRegex = /(?:\/Users\/\w|\/home\/\w|C:\\Users\\)/;

  for (const file of allFiles) {
    const content = readFileSync(join(skill.dirPath, file), "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      if (absPathRegex.test(lines[i])) {
        results.push({
          skill: skill.dirName,
          rule: "no-absolute-paths",
          pass: false,
          message: `${file}:${i + 1} — machine-specific absolute path`,
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({ skill: skill.dirName, rule: "no-absolute-paths", pass: true });
  }
  return results;
}

function checkMcpFallbackPresent(skill: SkillInfo): Result {
  // Only trigger for skills that CALL MCP tools (indicated by "Call mcp__debridge__"
  // pattern or MCP tool names in workflow steps), not skills that merely reference
  // MCP tool names in descriptive context.
  const body = skill.body;
  const callsMcp =
    /Call mcp__debridge__/i.test(body) ||
    /call.*`mcp__debridge__/i.test(body) ||
    // Check for MCP tool references outside of table rows (tables are descriptive)
    body.split("\n").some((line) => {
      const trimmed = line.trim();
      return !trimmed.startsWith("|") && /mcp__debridge__\w+/.test(trimmed) && /step|call|probe|check/i.test(trimmed);
    });

  if (!callsMcp) {
    return {
      skill: skill.dirName,
      rule: "mcp-fallback-present",
      pass: true,
      message: "no MCP calls — rule not applicable",
    };
  }

  const lower = body.toLowerCase();
  const hasFallback =
    lower.includes("unavailable") ||
    lower.includes("not found") ||
    lower.includes("fallback") ||
    lower.includes("sdk-fallback");

  return {
    skill: skill.dirName,
    rule: "mcp-fallback-present",
    pass: hasFallback,
    message: hasFallback ? undefined : "calls MCP tools but has no fallback section",
  };
}

function checkAmountsAreStrings(skill: SkillInfo): Result[] {
  const results: Result[] = [];
  const allFiles = ["SKILL.md", ...skill.siblingMdFiles];
  // Match amount/value assignments with bare numbers (not quoted)
  // e.g. amount: 100 or value: 1000000 but not amount: "100"
  const bareAmountRegex = /\b(?:amount|value|srcChainTokenInAmount|tokenInAmount)\s*[:=]\s*(\d{2,})\b/;

  for (const file of allFiles) {
    const content = readFileSync(join(skill.dirPath, file), "utf-8");
    const lines = content.split("\n");
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock && bareAmountRegex.test(line)) {
        results.push({
          skill: skill.dirName,
          rule: "amounts-are-strings",
          pass: false,
          message: `${file}:${i + 1} — amount should be a quoted string`,
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({ skill: skill.dirName, rule: "amounts-are-strings", pass: true });
  }
  return results;
}

// ── Cross-Referencing Rules ────────────────────────────────────────────────

function checkCrossRefsResolve(skill: SkillInfo): Result[] {
  const results: Result[] = [];
  const refs = extractCrossSkillRefs(skill.body);

  for (const ref of refs) {
    const targetDir = join(SKILLS_DIR, ref);
    const targetSkill = join(targetDir, "SKILL.md");
    const exists = existsSync(targetSkill);
    results.push({
      skill: skill.dirName,
      rule: "cross-refs-resolve",
      pass: exists,
      message: exists ? `../${ref}/SKILL.md` : `../${ref}/SKILL.md — skill not found`,
    });
  }

  if (results.length === 0) {
    results.push({ skill: skill.dirName, rule: "cross-refs-resolve", pass: true, message: "no cross-refs" });
  }
  return results;
}

function checkCommonIsPrereq(skill: SkillInfo): Result {
  if (skill.dirName === "common") {
    return { skill: skill.dirName, rule: "common-is-prereq", pass: true, message: "exempt" };
  }
  const refs = skill.body.includes("../common/SKILL.md");
  return {
    skill: skill.dirName,
    rule: "common-is-prereq",
    pass: refs,
    message: refs ? undefined : "must reference ../common/SKILL.md as prerequisite",
  };
}

function checkNoCircularRefs(skills: SkillInfo[]): Result[] {
  // Build adjacency graph from dependency refs only (not navigation tables).
  // Exclude `common` as a source — it is the shared prerequisite hub that
  // legitimately references all other skills while being referenced back.
  const graph = new Map<string, string[]>();
  for (const skill of skills) {
    if (skill.dirName === "common") {
      graph.set(skill.dirName, []); // common has no outgoing dependency edges
    } else {
      graph.set(skill.dirName, extractDependencyRefs(skill.body));
    }
  }

  // DFS cycle detection
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(node: string, path: string[]): void {
    if (inStack.has(node)) {
      const cycleStart = path.indexOf(node);
      cycles.push(path.slice(cycleStart).concat(node));
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    inStack.add(node);
    for (const neighbor of graph.get(node) || []) {
      dfs(neighbor, [...path, node]);
    }
    inStack.delete(node);
  }

  for (const skill of skills) {
    dfs(skill.dirName, []);
  }

  if (cycles.length === 0) {
    return [{ skill: "*", rule: "no-circular-refs", pass: true }];
  }

  return cycles.map((cycle) => ({
    skill: cycle[0],
    rule: "no-circular-refs",
    pass: false,
    message: `circular reference: ${cycle.join(" → ")}`,
  }));
}

// ── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  const skills = discoverSkills();

  if (skills.length === 0) {
    console.error("No skills found in", SKILLS_DIR);
    process.exit(1);
  }

  console.log(`Validating ${skills.length} skills...\n`);

  const results: Result[] = [];

  for (const skill of skills) {
    // Skip empty SKILL.md files (no frontmatter at all)
    if (skill.skillMdContent.trim().length === 0) {
      results.push({
        skill: skill.dirName,
        rule: "required-frontmatter",
        pass: false,
        message: "SKILL.md is empty",
      });
      continue;
    }

    // Structural
    results.push(checkNameHasPrefix(skill));
    results.push(checkNameFormat(skill));
    results.push(checkDirNameFormat(skill));
    results.push(checkRequiredFrontmatter(skill));
    results.push(checkDescriptionQuality(skill));
    results.push(checkDescriptionHasTriggers(skill));
    results.push(checkBodyLength(skill));
    results.push(...checkReferenceLength(skill));
    results.push(...checkReferencesExist(skill));
    results.push(...checkReferencesAreSiblings(skill));
    results.push(...checkNoOrphanReferences(skill));
    results.push(checkPrerequisitePresent(skill));

    // Content
    results.push(...checkNoHardcodedKeys(skill));
    results.push(...checkNoAbsolutePaths(skill));
    results.push(checkMcpFallbackPresent(skill));
    results.push(...checkAmountsAreStrings(skill));

    // Cross-referencing
    results.push(...checkCrossRefsResolve(skill));
    results.push(checkCommonIsPrereq(skill));
  }

  // Global cross-referencing
  results.push(...checkNoCircularRefs(skills));

  // Output
  let passed = 0;
  let failed = 0;

  for (const r of results) {
    if (r.pass) {
      passed++;
      // Only print failures and summary for clean output; use --verbose for all
      if (process.argv.includes("--verbose")) {
        console.log(`  \x1b[32m✓\x1b[0m ${r.skill}: ${r.rule}${r.message ? ` — ${r.message}` : ""}`);
      }
    } else {
      failed++;
      console.log(`  \x1b[31m✗\x1b[0m ${r.skill}: ${r.rule}${r.message ? ` — ${r.message}` : ""}`);
    }
  }

  console.log(`\nResults: \x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
