import { test, expect } from "bun:test";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { copyReelAssets, REEL_ASSETS } from "./reel-assets";

test("publish only complete runtime assets and exclude source tooling and private notes", async () => {
  const root = await mkdtemp(join(tmpdir(), "skillify-reel-assets-"));
  try {
    const source = join(root, "source");
    const destination = join(root, "dist", "reel");
    for (const file of [...REEL_ASSETS, "render.mjs", "verify.mjs", "private-note.txt"]) {
      await mkdir(dirname(join(source, file)), { recursive: true });
      await writeFile(join(source, file), `fixture:${file}`);
    }
    expect(await copyReelAssets(source, destination)).toBe(true);
    expect(await readFile(join(destination, "player.html"), "utf8")).toBe("fixture:player.html");
    expect(await readFile(join(destination, "fonts", "Rubik.ttf"), "utf8")).toBe("fixture:fonts/Rubik.ttf");
    const names = await readdir(destination);
    for (const name of ["render.mjs", "verify.mjs", "private-note.txt"]) expect(names.includes(name)).toBe(false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("absent reel is optional, incomplete reel fails before publication", async () => {
  const root = await mkdtemp(join(tmpdir(), "skillify-reel-incomplete-"));
  try {
    const source = join(root, "source");
    const destination = join(root, "dist", "reel");
    expect(await copyReelAssets(source, destination)).toBe(false);
    await mkdir(source);
    await writeFile(join(source, "player.html"), "fixture");
    await expect(copyReelAssets(source, destination)).rejects.toThrow();
    await expect(readdir(destination)).rejects.toThrow();
    await writeFile(join(source, "skillify-cinematic.mp4"), "fixture");
    await expect(copyReelAssets(source, destination)).rejects.toThrow();
    await expect(readdir(destination)).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
