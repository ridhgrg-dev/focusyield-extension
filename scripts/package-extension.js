import { mkdir, rm, cp, readFile, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
const out = join(dist, "focusyield.zip");
const temp = join(dist, "focusyield");

await bumpAppVersion();
await rm(dist, { recursive: true, force: true });
await mkdir(temp, { recursive: true });
await Promise.all([
  cp(join(root, "manifest.json"), join(temp, "manifest.json")),
  cp(join(root, "src"), join(temp, "src"), { recursive: true }),
  cp(join(root, "assets"), join(temp, "assets"), { recursive: true })
]);

await zipDirectory(temp, out);
console.log(`Packaged ${out}`);

async function bumpAppVersion() {
  const pkgPath = join(root, "package.json");
  const manifestPath = join(root, "manifest.json");
  const pkgData = JSON.parse(await readFile(pkgPath, "utf8"));
  const manifestData = JSON.parse(await readFile(manifestPath, "utf8"));

  const oldVersion = pkgData.version;
  const newVersion = incrementPatchVersion(oldVersion);
  pkgData.version = newVersion;
  manifestData.version = newVersion;

  await writeFile(pkgPath, JSON.stringify(pkgData, null, 2) + "\n", "utf8");
  await writeFile(manifestPath, JSON.stringify(manifestData, null, 2) + "\n", "utf8");

  console.log(`Bumped version ${oldVersion} -> ${newVersion}`);
}

function incrementPatchVersion(version) {
  const parts = version.split(".");
  if (parts.length !== 3) {
    throw new Error(`Unsupported version format: ${version}`);
  }
  const [major, minor, patch] = parts.map((part) => Number(part));
  if ([major, minor, patch].some((value) => Number.isNaN(value))) {
    throw new Error(`Unsupported version format: ${version}`);
  }
  return `${major}.${minor}.${patch + 1}`;
}

function zipDirectory(source, destination) {
  return new Promise((resolve, reject) => {
    const zip = spawn("zip", ["-r", destination, "."], { cwd: source, stdio: ["ignore", "pipe", "pipe"] });
    zip.stdout.pipe(createWriteStream("/dev/null"));
    zip.stderr.on("data", (data) => process.stderr.write(data));
    zip.on("error", reject);
    zip.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`zip exited with ${code}`));
    });
  });
}
