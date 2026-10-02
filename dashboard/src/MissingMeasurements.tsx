import { missingModels, modelName } from "./lib";

export function MissingMeasurements({ tasks }: { tasks?: string[] }) {
  const models = missingModels(tasks);
  if (!models.length) return null;
  return <p className="muted small missing-measurements">Paired measurements not recorded: {models.map((m) => modelName(m.model)).join(", ")}.</p>;
}
