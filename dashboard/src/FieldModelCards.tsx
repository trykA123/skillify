import { data, dur, kfmt, modelName, type Usage } from "./lib";
import { Card } from "./ui";

const metrics = [
  { key: "tokens", label: "Tokens / run", format: kfmt },
  { key: "tools", label: "Tool calls / run", format: kfmt },
  { key: "ms", label: "Time / run", format: dur },
] as const;

function RecordedUsage({ value, total, format }: { value: Usage["tokens"]; total: number; format: (value: number) => string }) {
  return value.median === null ? "Not recorded" : <>{format(value.median)} <span className="muted small">· {value.recorded} of {total} recorded</span></>;
}

export function FieldModelCards() {
  return data.fieldModels.map((m) => (
    <Card key={m.model} className="field-model" title={modelName(m.model)} sub={`${m.fieldRuns} field runs · ${m.harnesses.join(", ") || "harness not recorded"}`}>
      <p className="muted small">No paired benchmark</p>
      <dl className="kv">
        <dt>Cost per run</dt><dd>Not recorded</dd>
        <dt>Score improvement</dt><dd>Not measured</dd>
        <dt>Field verdicts</dt><dd>{m.verdicts.helped} helped · {m.verdicts.neutral} neutral · {m.verdicts.hurt} hurt</dd>
        <dt>Catches reported</dt><dd>{m.evidence.catchCount} concrete · {m.evidence.catchRecorded} of {m.evidence.helped} helped runs recorded</dd>
        {metrics.map(({ key, label, format }) => (
          <div key={key} style={{ display: "contents" }}>
            <dt>{label}</dt><dd><RecordedUsage value={m.usage[key]} total={m.fieldRuns} format={format} /></dd>
          </div>
        ))}
      </dl>
      <p className="wc muted small">Field verdicts are agent reports. Cost and score comparisons appear when paired results are recorded.</p>
    </Card>
  ));
}
