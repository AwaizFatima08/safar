#!/usr/bin/env node
/**
 * gemini_image.js — build-time image generation helper for Urdu Safar.
 *
 * Calls the Gemini API to generate one image from a text prompt and saves
 * it as a PNG. Never used at runtime in the shipped app (see the "Gemini
 * image generation" note in docs/new-categories-design-3248.md) — the API
 * key lives in .secrets/gemini_api_key, gitignored, read here at build time
 * only.
 *
 * Usage:
 *   node scripts/gemini_image.js "<prompt text>" <output-path.png> [model]
 *
 * model defaults to gemini-2.5-flash-image.
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const KEY_PATH = path.join(ROOT, ".secrets", "gemini_api_key");

function main() {
  const [, , prompt, outPath, model] = process.argv;
  if (!prompt || !outPath) {
    console.error("Usage: node scripts/gemini_image.js \"<prompt>\" <output.png> [model]");
    process.exit(1);
  }
  const apiKey = fs.readFileSync(KEY_PATH, "utf8").trim();
  const modelName = model || "gemini-2.5-flash-image";

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
  });

  const options = {
    hostname: "generativelanguage.googleapis.com",
    path: `/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  };

  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      let json;
      try {
        json = JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse response:", data.slice(0, 500));
        process.exit(1);
      }
      if (json.error) {
        console.error("Gemini API error:", JSON.stringify(json.error));
        process.exit(1);
      }
      const parts = json.candidates?.[0]?.content?.parts || [];
      const imgPart = parts.find((p) => p.inlineData);
      if (!imgPart) {
        console.error("No image in response:", JSON.stringify(json).slice(0, 500));
        process.exit(1);
      }
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, Buffer.from(imgPart.inlineData.data, "base64"));
      console.log(`Wrote ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
    });
  });

  req.on("error", (e) => {
    console.error("Request failed:", e.message);
    process.exit(1);
  });

  req.write(body);
  req.end();
}

main();
