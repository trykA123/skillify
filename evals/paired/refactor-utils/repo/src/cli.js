import { chunk, env, formatBytes, formatDuration, parseDuration, retry, slugify } from "./utils.js";

export async function backup(files, { upload }) {
  const interval = parseDuration(env("BACKUP_INTERVAL", "1h"));
  const batches = chunk(files, 10);
  let bytes = 0;
  for (const batch of batches) {
    await retry(() => upload(batch.map((f) => ({ ...f, key: slugify(f.name) }))));
    bytes += batch.reduce((sum, f) => sum + f.size, 0);
  }
  return `uploaded ${formatBytes(bytes)} in ${batches.length} batches; next run in ${formatDuration(interval)}`;
}
