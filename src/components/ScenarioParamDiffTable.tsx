import type { ParameterGroup, ScenarioLibraryEntry } from "../types/contracts";

interface ScenarioParamDiffTableProps {
  entryA: ScenarioLibraryEntry;
  entryB: ScenarioLibraryEntry;
  parameterGroups: ParameterGroup[];
}

interface DiffRow {
  groupLabel: string;
  fieldLabel: string;
  valueA: string;
  valueB: string;
}

function displayValue(value: number | string | undefined): string {
  if (value === undefined || value === null) return "—";
  return String(value);
}

function buildDiffRows(
  entryA: ScenarioLibraryEntry,
  entryB: ScenarioLibraryEntry,
  parameterGroups: ParameterGroup[]
): DiffRow[] {
  const rows: DiffRow[] = [];
  for (const group of parameterGroups) {
    for (const field of group.fields) {
      const valA = entryA.scenario[field.key];
      const valB = entryB.scenario[field.key];
      const strA = displayValue(valA);
      const strB = displayValue(valB);
      if (strA !== strB) {
        rows.push({
          groupLabel: group.label,
          fieldLabel: field.label,
          valueA: strA,
          valueB: strB
        });
      }
    }
  }
  return rows;
}

export function ScenarioParamDiffTable({ entryA, entryB, parameterGroups }: ScenarioParamDiffTableProps) {
  const rows = buildDiffRows(entryA, entryB, parameterGroups);

  if (rows.length === 0) {
    return (
      <div className="param-diff-shell">
        <p className="param-diff-title">Parameter Diff</p>
        <div className="param-diff-identical-notice">
          <strong>No input changes detected.</strong>
          <p>
            All tracked parameters are identical. Any output differences likely reflect
            simulation variability rather than a modeled process change.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="param-diff-shell">
      <p className="param-diff-title">Parameter Diff — inputs that changed</p>
      <div className="param-diff-table-wrap">
        <table className="compare-table param-diff-table">
          <thead>
            <tr>
              <th className="param-diff-group-col">Group</th>
              <th>Parameter</th>
              <th className="compare-scenario-col">
                <span className="compare-col-name">{entryA.scenarioName}</span>
              </th>
              <th className="compare-scenario-col">
                <span className="compare-col-name">{entryB.scenarioName}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="param-diff-group-cell">{row.groupLabel}</td>
                <td className="compare-metric-label">{row.fieldLabel}</td>
                <td className="compare-value-cell compare-baseline">{row.valueA}</td>
                <td className="compare-value-cell">{row.valueB}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
