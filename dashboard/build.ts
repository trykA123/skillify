import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { copyReelAssets } from "./reel-assets";

await rm(new URL("./dist", import.meta.url), { recursive: true, force: true });
const out = await Bun.build({
  entrypoints: ["./index.html"],
  outdir: "./dist",
  minify: true,
  publicPath: "./",
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
});
if (!out.success) {
  for (const l of out.logs) console.error(l);
  process.exit(1);
}
for (const o of out.outputs) console.log(`${o.path.replace(process.cwd() + "/", "")}  ${(o.size / 1024).toFixed(1)} KB`);
if (await copyReelAssets(
  fileURLToPath(new URL("../docs/cinematic-reel-v2/", import.meta.url)),
  fileURLToPath(new URL("./dist/reel/", import.meta.url)),
)) console.log("dist/reel/  cinematic film and player");
