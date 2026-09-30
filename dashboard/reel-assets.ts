import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";

export const REEL_ASSETS = [
  "player.html",
  "index.html",
  "film.mjs",
  "timeline.mjs",
  "skillify-cinematic.mp4",
  "preview.mp4",
  "captions.vtt",
  "poster.jpg",
  "contact-sheet.jpg",
  "fonts/Rubik.ttf",
  "fonts/Rubik-OFL.txt",
  "fonts/JetBrainsMono.ttf",
  "fonts/JetBrainsMono-OFL.txt",
] as const;

export async function copyReelAssets(source: string, destination: string) {
  try {
    await stat(source);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
  for (const file of REEL_ASSETS) {
    if (!(await stat(join(source, file))).isFile()) throw new Error(`Missing reel asset: ${file}`);
  }
  for (const file of REEL_ASSETS) {
    const target = join(destination, file);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(join(source, file), target);
  }
  return true;
}
