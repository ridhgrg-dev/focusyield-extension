import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
const required = [
  "manifest_version",
  "name",
  "version",
  "action",
  "background"
];

const missing = required.filter((key) => !manifest[key]);
if (missing.length) {
  throw new Error(`Manifest missing: ${missing.join(", ")}`);
}

if (manifest.manifest_version !== 3) {
  throw new Error("Chrome extensions should use Manifest V3.");
}

const files = [
  manifest.action.default_popup,
  manifest.background.service_worker,
  "src/options.html",
  "src/upgrade.html",
  "src/blocked.html"
];

await Promise.all(files.map((file) => readFile(file, "utf8")));
console.log("Extension checks passed.");
