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

function main() {
  console.log("Loading content...");
  const topics = loadContent("topics", TOPIC_REQUIRED_FIELDS);
  const skills = loadContent("skills", SKILL_REQUIRED_FIELDS);
  console.log(`  ${topics.length} topics, ${skills.length} skills`);

  console.log("Reading source files...");
  const styles = fs.readFileSync(path.join(SRC_DIR, "styles.css"), "utf8");
  const appJs = fs.readFileSync(path.join(SRC_DIR, "app.js"), "utf8");
  let template = fs.readFileSync(path.join(SRC_DIR, "index.template.html"), "utf8");

  const contentJs =
    `const TOPICS = ${JSON.stringify(topics)};\n` +
    `const SKILLS = ${JSON.stringify(skills)};\n`;

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
