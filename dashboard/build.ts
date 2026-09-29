import { rm } from "node:fs/promises";

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
