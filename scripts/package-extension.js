import { mkdir, rm, cp } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
const out = join(dist, "focusledger.zip");
const temp = join(dist, "focusledger");

await rm(dist, { recursive: true, force: true });
await mkdir(temp, { recursive: true });
await Promise.all([
  cp(join(root, "manifest.json"), join(temp, "manifest.json")),
  cp(join(root, "src"), join(temp, "src"), { recursive: true }),
  cp(join(root, "assets"), join(temp, "assets"), { recursive: true })
]);

await zipDirectory(temp, out);
console.log(`Packaged ${out}`);

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
