#!/usr/bin/env node
/**
 * build.js — assembles dist/app.html from src/ and content/.
 *
 * This is deliberately NOT a bundler like webpack/vite: the app is plain
 * HTML/CSS/JS on purpose, so the "build" is just: read the content JSON
 * files, validate they have the fields the app expects, glue them into
 * the app's JS, inline the CSS, and drop it into the HTML template.
 *
 * Run:  node build/build.js
 * Output: dist/app.html — this is the file to publish as the Artifact,
 * and later the file Capacitor wraps for Android. Never hand-edit
 * dist/app.html directly; it's regenerated every run.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content");
const SRC_DIR = path.join(ROOT, "src");
const DIST_DIR = path.join(ROOT, "dist");

const TOPIC_REQUIRED_FIELDS = ["id", "ur", "en", "vocab", "reading", "writing", "grammar"];
const SKILL_REQUIRED_FIELDS = ["id", "ur", "en", "points", "samples", "practice", "prompts"];
const IDIOM_REQUIRED_FIELDS = ["id", "ur", "meaning_ur", "meaning_en", "example_ur", "example_en"];
const READING_SKILL_REQUIRED_FIELDS = ["id", "ur", "en", "shortAnswer", "multipleMatching", "noteMaking"];
const GRAMMAR_LAB_REQUIRED_FIELDS = ["id", "ur", "en", "grammarPoint", "cloze", "transformation"];
const TRANSLATION_REQUIRED_FIELDS = ["id", "ur", "en", "warmup", "passage"];
const SUMMARY_WRITING_REQUIRED_FIELDS = ["id", "ur", "en", "passage", "modelSummary", "checklist"];
const EXTENDED_WRITING_REQUIRED_FIELDS = ["id", "ur", "en", "prompt", "modelResponse", "checklist"];

function loadContent(kind, requiredFields) {
  const dir = path.join(CONTENT_DIR, kind);
  const orderPath = path.join(dir, "_order.json");
  const order = JSON.parse(fs.readFileSync(orderPath, "utf8"));

  const items = order.map((id) => {
    const filePath = path.join(dir, id + ".json");
    if (!fs.existsSync(filePath)) {
      throw new Error(`[${kind}] "${id}" is listed in _order.json but ${id}.json doesn't exist.`);
    }
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (e) {
      throw new Error(`[${kind}] ${id}.json is not valid JSON: ${e.message}`);
    }
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`[${kind}] ${id}.json is missing required field "${field}".`);
      }
    }
    if (data.id !== id) {
      throw new Error(`[${kind}] ${id}.json has "id": "${data.id}" but the filename says "${id}". Keep them matching.`);
    }
    return data;
  });

  // Catch content files that exist but were forgotten in _order.json.
  const allFiles = fs.readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "_order.json");
  const knownIds = new Set(order);
  for (const f of allFiles) {
    const id = f.replace(/\.json$/, "");
    if (!knownIds.has(id)) {
      throw new Error(`[${kind}] ${f} exists but is not listed in _order.json — it would be built silently out of order or dropped. Add "${id}" to _order.json (or delete the file if it's stale).`);
    }
  }

  return items;
}

// Idioms live as one flat JSON array (content/idioms/idioms.json) rather than
// one-file-per-item — there's no per-idiom structure worth splitting out.
function loadFlatContent(kind, fileName, requiredFields) {
  const filePath = path.join(CONTENT_DIR, kind, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`[${kind}] ${fileName} does not exist.`);
  }
  let items;
  try {
    items = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    throw new Error(`[${kind}] ${fileName} is not valid JSON: ${e.message}`);
  }
  if (!Array.isArray(items)) {
    throw new Error(`[${kind}] ${fileName} must be a JSON array.`);
  }
  const seenIds = new Set();
  items.forEach((item, i) => {
    for (const field of requiredFields) {
      if (!(field in item)) {
        throw new Error(`[${kind}] entry ${i} (id: ${item.id || "?"}) is missing required field "${field}".`);
      }
    }
    if (seenIds.has(item.id)) {
      throw new Error(`[${kind}] duplicate id "${item.id}" — every entry needs a unique id.`);
    }
    seenIds.add(item.id);
  });
  return items;
}

function main() {
  console.log("Loading content...");
  const topics = loadContent("topics", TOPIC_REQUIRED_FIELDS);
  const skills = loadContent("skills", SKILL_REQUIRED_FIELDS);
  const idioms = loadFlatContent("idioms", "idioms.json", IDIOM_REQUIRED_FIELDS);
  const readingSkills = loadContent("reading-skills", READING_SKILL_REQUIRED_FIELDS);
  const grammarLab = loadContent("grammar-lab", GRAMMAR_LAB_REQUIRED_FIELDS);
  const translation = loadContent("translation", TRANSLATION_REQUIRED_FIELDS);
  const summaryWriting = loadContent("summary-writing", SUMMARY_WRITING_REQUIRED_FIELDS);
  const extendedWriting = loadContent("extended-writing", EXTENDED_WRITING_REQUIRED_FIELDS);
  console.log(`  ${topics.length} topics, ${skills.length} skills, ${idioms.length} idioms, ${readingSkills.length} reading-skills entries, ${grammarLab.length} grammar-lab entries, ${translation.length} translation entries, ${summaryWriting.length} summary-writing entries, ${extendedWriting.length} extended-writing entries`);

  console.log("Reading source files...");
  const styles = fs.readFileSync(path.join(SRC_DIR, "styles.css"), "utf8");
  const appJs = fs.readFileSync(path.join(SRC_DIR, "app.js"), "utf8");
  let template = fs.readFileSync(path.join(SRC_DIR, "index.template.html"), "utf8");

  const contentJs =
    `const TOPICS = ${JSON.stringify(topics)};\n` +
    `const SKILLS = ${JSON.stringify(skills)};\n` +
    `const IDIOMS = ${JSON.stringify(idioms)};\n` +
    `const READING_SKILLS = ${JSON.stringify(readingSkills)};\n` +
    `const GRAMMAR_LAB = ${JSON.stringify(grammarLab)};\n` +
    `const TRANSLATION = ${JSON.stringify(translation)};\n` +
    `const SUMMARY_WRITING = ${JSON.stringify(summaryWriting)};\n` +
    `const EXTENDED_WRITING = ${JSON.stringify(extendedWriting)};\n`;

  const finalJs = appJs.replace("/* __CONTENT_INJECTION_POINT__ */", contentJs);
  if (finalJs === appJs) {
    throw new Error("Could not find the content injection point in src/app.js — did someone edit that marker comment?");
  }

  let output = template.replace("/* __STYLES_INJECTION_POINT__ */", styles);
  if (output === template) throw new Error("Could not find the styles injection point in src/index.template.html.");
  const beforeScript = output;
  output = output.replace("/* __SCRIPT_INJECTION_POINT__ */", finalJs);
  if (output === beforeScript) throw new Error("Could not find the script injection point in src/index.template.html.");

  fs.mkdirSync(DIST_DIR, { recursive: true });
  const outPath = path.join(DIST_DIR, "app.html");
  fs.writeFileSync(outPath, output);
  console.log(`Wrote ${outPath} (${(output.length / 1024).toFixed(1)} KB)`);
}

main();
