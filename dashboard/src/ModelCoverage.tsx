import { data, modelName } from "./lib";
import { Card } from "./ui";

export function ModelCoverage() {
  return (
    <Card title="Model coverage" sub="Field feedback and paired benchmarks are separate evidence. Models without paired results have no comparison score. Model IDs and versions remain separate.">
      <div className="scroll-x">
        <table className="tbl" aria-label="Model coverage">
          <thead>
            <tr>
              <th scope="col">Model</th>
              <th scope="col">Harness</th>
              <th scope="col" className="n">Field runs</th>
              <th scope="col">Paired evals</th>
            </tr>
          </thead>
          <tbody>
            {data.modelCoverage.map((m) => (
              <tr key={m.model}>
                <td>{modelName(m.model)}</td>
                <td>{m.harnesses.join(", ") || "Not recorded"}</td>
                <td className="n">{m.fieldRuns}</td>
                <td>{m.paired ? "Recorded" : "Not recorded"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
