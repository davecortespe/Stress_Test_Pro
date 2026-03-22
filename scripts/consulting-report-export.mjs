import fs from "node:fs";
import path from "node:path";

function cloneValue(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "object") {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
}

function formatLabelFromKey(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildArtifactRecord(artifactId, artifactPath, exists) {
  return {
    artifact_id: artifactId,
    artifact_path: artifactPath,
    status: exists ? "present" : "missing"
  };
}

function buildItem(label, contentRef, sourceValue) {
  return {
    label,
    content_ref: contentRef,
    source_value: cloneValue(sourceValue)
  };
}

function buildTextGroup(groupLabel, filePath, entries) {
  const contentItems = entries.map((entry) =>
    buildItem(entry.label, `${filePath}#/${entry.pointer}`, entry.value)
  );
  return {
    group_label: groupLabel,
    content_refs: contentItems.map((item) => item.content_ref),
    content_items: contentItems
  };
}

function buildMetricGroup(groupLabel, filePath, metrics, metricKeys) {
  const safeMetrics = metrics && typeof metrics === "object" ? metrics : {};
  const contentItems = metricKeys.map((metricKey) =>
    buildItem(metricKey, `${filePath}#/globalMetrics/${metricKey}`, safeMetrics[metricKey] ?? null)
  );
  return {
    group_label: groupLabel,
    content_refs: contentItems.map((item) => item.content_ref),
    content_items: contentItems
  };
}

function buildStepMetricGroups(filePath, graph, nodeMetrics, nodeIds) {
  const labelById = new Map((graph?.nodes ?? []).map((node) => [node.id, node.label]));
  return nodeIds.map((nodeId) => {
    const stepMetrics = nodeMetrics?.[nodeId] ?? {};
    const metricKeys = [
      "utilization",
      "headroom",
      "queueRisk",
      "queueDepth",
      "wipQty",
      "completedQty",
      "idleWaitHours",
      "idleWaitPct",
      "leadTimeMinutes",
      "capacityPerHour",
      "bottleneckIndex",
      "bottleneckFlag",
      "status"
    ];
    const contentItems = metricKeys.map((metricKey) =>
      buildItem(metricKey, `${filePath}#/nodeMetrics/${nodeId}/${metricKey}`, stepMetrics[metricKey] ?? null)
    );
    return {
      group_label: labelById.get(nodeId) ?? nodeId,
      content_refs: contentItems.map((item) => item.content_ref),
      content_items: contentItems
    };
  });
}

function buildAssumptionsGroup(filePath, assumptions) {
  const safeAssumptions = Array.isArray(assumptions) ? assumptions : [];
  return {
    group_label: "Assumptions Log",
    content_refs: safeAssumptions.map((_, index) => `${filePath}#/assumptions/${index}`),
    content_items: safeAssumptions.map((assumption, index) =>
      buildItem(
        assumption.id ?? `assumption_${index + 1}`,
        `${filePath}#/assumptions/${index}`,
        assumption
      )
    )
  };
}

function buildMissingGroup(groupLabel, artifactPath, note) {
  return {
    group_label: groupLabel,
    content_refs: [artifactPath],
    content_items: [buildItem("status", artifactPath, note)]
  };
}

function chunk(array, size) {
  const result = [];
  for (let index = 0; index < array.length; index += size) {
    result.push(array.slice(index, index + size));
  }
  return result;
}

function markdownValue(value) {
  if (value === null || value === undefined) {
    return "`null`";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return `\`${String(value)}\``;
  }
  return `\`${JSON.stringify(value)}\``;
}

function htmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "section";
}

function htmlValue(value) {
  if (value === null || value === undefined) {
    return '<span class="value-null">null</span>';
  }
  if (typeof value === "object") {
    return `<code>${htmlEscape(JSON.stringify(value, null, 2))}</code>`;
  }
  return htmlEscape(value);
}

export function buildConsultingReportExport({
  dashboardConfig,
  compiledForecast,
  scenarioCommitted,
  resultMetrics,
  operationalDiagnosis,
  sourceArtifacts = {}
}) {
  const dashboardPath = sourceArtifacts.dashboardConfigPath ?? "models/dashboard_config.json";
  const compiledPath = sourceArtifacts.compiledForecastPath ?? "models/active/compiled_forecast_model.json";
  const scenarioPath = sourceArtifacts.scenarioCommittedPath ?? "models/active/scenario_committed.json";
  const metricsPath = sourceArtifacts.resultMetricsPath ?? "models/active/result_metrics.json";
  const diagnosisPath = sourceArtifacts.operationalDiagnosisPath ?? "models/active/operational_diagnosis.json";
  const diagnosisMarkdownPath = sourceArtifacts.operationalDiagnosisMarkdownPath ?? "models/active/operational_diagnosis.md";

  const sourceArtifactRecords = [
    buildArtifactRecord("dashboard_config", dashboardPath, Boolean(dashboardConfig)),
    buildArtifactRecord("compiled_forecast_model", compiledPath, Boolean(compiledForecast)),
    buildArtifactRecord("scenario_committed", scenarioPath, Boolean(scenarioCommitted)),
    buildArtifactRecord("result_metrics", metricsPath, Boolean(resultMetrics)),
    buildArtifactRecord("operational_diagnosis", diagnosisPath, Boolean(operationalDiagnosis)),
    buildArtifactRecord("operational_diagnosis_markdown", diagnosisMarkdownPath, Boolean(sourceArtifacts.operationalDiagnosisMarkdown))
  ];

  const exportTitle = `${dashboardConfig?.appTitle ?? compiledForecast?.metadata?.name ?? "Forecast"} - Executive Report Export`;
  const diagnosisAvailable = Boolean(operationalDiagnosis);
  const metricsAvailable = Boolean(resultMetrics);
  const orderedNodeIds = (compiledForecast?.graph?.nodes ?? []).map((node) => node.id);
  const stepMetricChunks = chunk(orderedNodeIds, 4);
  const pages = [];

  pages.push({
    page_number: 1,
    page_title: dashboardConfig?.appTitle ?? "Forecast Report",
    section: "Cover",
    layout_type: "cover_title_status",
    content_groups: [
      buildTextGroup("Title Block", dashboardPath, [
        { label: "appTitle", pointer: "appTitle", value: dashboardConfig?.appTitle ?? null },
        { label: "subtitle", pointer: "subtitle", value: dashboardConfig?.subtitle ?? null }
      ]),
      buildTextGroup("Report Status", diagnosisPath, [
        { label: "status", pointer: "status", value: operationalDiagnosis?.status ?? null },
        { label: "confidence", pointer: "confidence", value: operationalDiagnosis?.confidence ?? null }
      ])
    ],
    formatting_notes: [
      "Use a restrained cover layout with title, subtitle, and status strip only.",
      "Keep the page visually sparse with strong whitespace and no dense tables."
    ],
    reviewer_notes: [
      "This page should orient the reader quickly without restating the full diagnosis."
    ]
  });

  pages.push({
    page_number: 2,
    page_title: "Executive Summary",
    section: "Executive Summary",
    layout_type: "executive_summary_three_block",
    content_groups: diagnosisAvailable
      ? [
          buildTextGroup("Current State", diagnosisPath, [
            { label: "statusSummary", pointer: "statusSummary", value: operationalDiagnosis.statusSummary }
          ]),
          buildTextGroup("Primary Constraint", diagnosisPath, [
            { label: "primaryConstraint", pointer: "primaryConstraint", value: operationalDiagnosis.primaryConstraint }
          ]),
          buildTextGroup("Recommended Action", diagnosisPath, [
            { label: "recommendedAction", pointer: "recommendedAction", value: operationalDiagnosis.recommendedAction }
          ])
        ]
      : [buildMissingGroup("Executive Summary", diagnosisPath, "Operational diagnosis artifact missing.")],
    formatting_notes: [
      "Treat each source sentence as its own executive block.",
      "Do not rewrite or compress the wording; only improve hierarchy."
    ],
    reviewer_notes: [
      "Use this page for leadership readout and preserve the source sentences exactly."
    ]
  });

  pages.push({
    page_number: 3,
    page_title: "Current System Context",
    section: "Context / Problem Statement",
    layout_type: "context_overview_with_metrics",
    content_groups: [
      buildTextGroup("Model Context", compiledPath, [
        { label: "name", pointer: "metadata/name", value: compiledForecast?.metadata?.name ?? null },
        { label: "mode", pointer: "metadata/mode", value: compiledForecast?.metadata?.mode ?? null },
        { label: "units", pointer: "metadata/units", value: compiledForecast?.metadata?.units ?? null }
      ]),
      buildMetricGroup(
        "Current Global Metrics",
        metricsPath,
        resultMetrics?.globalMetrics,
        [
          "simElapsedHours",
          "globalThroughput",
          "totalCompletedOutputPieces",
          "totalWipQty",
          "totalLeadTimeMinutes",
          "bottleneckMigration",
          "bottleneckIndex",
          "brittleness"
        ]
      )
    ],
    formatting_notes: [
      "Use a clean two-zone layout: context on the left, key numeric evidence on the right.",
      "Keep raw metric labels visible so reviewers can trace them back to source artifacts."
    ],
    reviewer_notes: [
      "This page should frame the operating state before deeper diagnosis pages."
    ]
  });

  pages.push({
    page_number: 4,
    page_title: "Operational Diagnosis",
    section: "Analysis / Diagnostic Findings",
    layout_type: "diagnosis_storyline",
    content_groups: diagnosisAvailable
      ? [
          buildTextGroup("Constraint Definition", diagnosisPath, [
            { label: "primaryConstraint", pointer: "primaryConstraint", value: operationalDiagnosis.primaryConstraint },
            {
              label: "constraintMechanism",
              pointer: "constraintMechanism",
              value: operationalDiagnosis.constraintMechanism
            }
          ]),
          buildTextGroup("Downstream Effects", diagnosisPath, [
            { label: "downstreamEffects", pointer: "downstreamEffects", value: operationalDiagnosis.downstreamEffects }
          ])
        ]
      : [buildMissingGroup("Operational Diagnosis", diagnosisPath, "Operational diagnosis artifact missing.")],
    formatting_notes: [
      "One diagnostic storyline per page: constraint, mechanism, and downstream effects.",
      "Use stacked callout blocks rather than long continuous paragraphs."
    ],
    reviewer_notes: [
      "Keep this page tightly tied to the source diagnosis fields without adding interpretation."
    ]
  });

  pages.push({
    page_number: 5,
    page_title: "Implications and Opportunity Lens",
    section: "Implications / Opportunities",
    layout_type: "implications_with_callouts",
    content_groups: diagnosisAvailable
      ? [
          buildTextGroup("Business Implications", diagnosisPath, [
            {
              label: "economicInterpretation",
              pointer: "economicInterpretation",
              value: operationalDiagnosis.economicInterpretation
            }
          ]),
          buildTextGroup("AI Opportunity Lens", diagnosisPath, [
            {
              label: "dataAlreadyExists",
              pointer: "aiOpportunityLens/dataAlreadyExists",
              value: operationalDiagnosis.aiOpportunityLens?.dataAlreadyExists ?? null
            },
            {
              label: "manualPatternDecisions",
              pointer: "aiOpportunityLens/manualPatternDecisions",
              value: operationalDiagnosis.aiOpportunityLens?.manualPatternDecisions ?? null
            },
            {
              label: "predictiveGap",
              pointer: "aiOpportunityLens/predictiveGap",
              value: operationalDiagnosis.aiOpportunityLens?.predictiveGap ?? null
            },
            {
              label: "tribalKnowledge",
              pointer: "aiOpportunityLens/tribalKnowledge",
              value: operationalDiagnosis.aiOpportunityLens?.tribalKnowledge ?? null
            },
            {
              label: "visibilityGap",
              pointer: "aiOpportunityLens/visibilityGap",
              value: operationalDiagnosis.aiOpportunityLens?.visibilityGap ?? null
            }
          ])
        ]
      : [buildMissingGroup("Implications", diagnosisPath, "Operational diagnosis artifact missing.")],
    formatting_notes: [
      "Use one implication block and one structured lens block with consistent callout styling.",
      "Preserve all uncertainty and cautionary wording."
    ],
    reviewer_notes: [
      "This page should remain credible and restrained rather than promotional."
    ]
  });

  pages.push({
    page_number: 6,
    page_title: "Recommendations and Next Steps",
    section: "Recommendations / Next Steps",
    layout_type: "recommendation_with_guidance",
    content_groups: diagnosisAvailable
      ? [
          buildTextGroup("Recommended Action", diagnosisPath, [
            { label: "recommendedAction", pointer: "recommendedAction", value: operationalDiagnosis.recommendedAction }
          ]),
          buildTextGroup("Scenario Guidance", diagnosisPath, [
            { label: "scenarioGuidance", pointer: "scenarioGuidance", value: operationalDiagnosis.scenarioGuidance }
          ]),
          buildTextGroup("Confidence", diagnosisPath, [
            { label: "confidence", pointer: "confidence", value: operationalDiagnosis.confidence },
            { label: "confidenceNote", pointer: "confidenceNote", value: operationalDiagnosis.confidenceNote }
          ])
        ]
      : [buildMissingGroup("Recommendations", diagnosisPath, "Operational diagnosis artifact missing.")],
    formatting_notes: [
      "Place the action on the page as the dominant block and supporting guidance beneath it.",
      "Keep confidence and evidence-gap wording visible rather than burying it in footer notes."
    ],
    reviewer_notes: [
      "This page is suitable for discussion of immediate next moves without changing source wording."
    ]
  });

  pages.push({
    page_number: 7,
    page_title: "Global Metric Appendix",
    section: "Appendix / Evidence",
    layout_type: "appendix_metric_table",
    content_groups: metricsAvailable
      ? [
          buildMetricGroup(
            "Global Metrics",
            metricsPath,
            resultMetrics.globalMetrics,
            Object.keys(resultMetrics.globalMetrics ?? {})
          )
        ]
      : [buildMissingGroup("Global Metrics", metricsPath, "Result metrics artifact missing.")],
    formatting_notes: [
      "Use an appendix-style metric table with strong alignment and ample row spacing.",
      "Keep raw metric keys and values fully traceable to the source file."
    ],
    reviewer_notes: [
      "This page is intended for evidence review, not for introducing new narrative."
    ]
  });

  stepMetricChunks.forEach((nodeIds, chunkIndex) => {
    pages.push({
      page_number: pages.length + 1,
      page_title: `Detailed Step Metrics (${chunkIndex + 1}/${stepMetricChunks.length})`,
      section: "Appendix / Evidence",
      layout_type: "appendix_step_metric_grid",
      content_groups: metricsAvailable
        ? buildStepMetricGroups(metricsPath, compiledForecast?.graph, resultMetrics?.nodeMetrics, nodeIds)
        : [buildMissingGroup("Detailed Step Metrics", metricsPath, "Result metrics artifact missing.")],
      formatting_notes: [
        "Group step cards in process order and keep each step label exactly as shown in the model.",
        "Use compact appendix cards to avoid rewriting the step evidence into prose."
      ],
      reviewer_notes: [
        "These pages provide back-up evidence and should remain easy to scan during client review."
      ]
    });
  });

  pages.push({
    page_number: pages.length + 1,
    page_title: "Evidence Gaps and Assumptions",
    section: "Appendix / Evidence",
    layout_type: "appendix_gaps_and_assumptions",
    content_groups: [
      diagnosisAvailable
        ? buildTextGroup("Confidence and Gaps", diagnosisPath, [
            { label: "confidence", pointer: "confidence", value: operationalDiagnosis.confidence },
            { label: "confidenceNote", pointer: "confidenceNote", value: operationalDiagnosis.confidenceNote }
          ])
        : buildMissingGroup("Confidence and Gaps", diagnosisPath, "Operational diagnosis artifact missing."),
      Array.isArray(compiledForecast?.assumptions) && compiledForecast.assumptions.length > 0
        ? buildAssumptionsGroup(compiledPath, compiledForecast.assumptions)
        : buildMissingGroup("Assumptions Log", compiledPath, "No assumptions were available in the compiled forecast artifact.")
    ],
    formatting_notes: [
      "Present evidence gaps and assumptions as a clean appendix rather than hiding them in narrative pages.",
      "Make uncertainty explicit and easy for reviewers to audit."
    ],
    reviewer_notes: [
      "This page should remain visible in the export package even when assumptions are sparse."
    ]
  });

  const sections = [];
  const sectionMap = new Map();
  for (const page of pages) {
    const current = sectionMap.get(page.section);
    if (current) {
      current.pages.push(page.page_number);
      continue;
    }
    const sectionEntry = {
      section_title: page.section,
      purpose:
        page.section === "Cover"
          ? "Orient the reader with title, status, and report framing."
          : page.section === "Executive Summary"
            ? "Surface the primary message without changing the source wording."
            : page.section === "Context / Problem Statement"
              ? "Frame the operating context and current system evidence."
              : page.section === "Analysis / Diagnostic Findings"
                ? "Present the current diagnosis as a structured storyline."
                : page.section === "Implications / Opportunities"
                  ? "Group business implications and opportunity framing from existing content."
                  : page.section === "Recommendations / Next Steps"
                    ? "Present the current recommendation and guidance without rewriting."
                    : "Provide supporting evidence, assumptions, and traceability.",
      pages: [page.page_number]
    };
    sectionMap.set(page.section, sectionEntry);
    sections.push(sectionEntry);
  }

  return {
    export_title: exportTitle,
    export_mode: "consulting_grade_organization",
    source_artifacts: sourceArtifactRecords,
    sections,
    pages,
    export_notes: [
      "Content preserved from source artifacts.",
      "Organization improved without rewriting analysis.",
      "Section flow is optimized for executive review and manual refinement.",
      "Evidence gaps and uncertainty statements are preserved as part of the export package."
    ],
    presenter_notes: [
      "Open with the Executive Summary and move supporting evidence into appendix pages unless discussion requires detail.",
      "Use the appendix pages for traceability when reviewers challenge numbers, assumptions, or confidence levels."
    ],
    reviewer_notes: [
      "All content blocks retain a source reference for auditability.",
      "Layout assignments are intended for slide or page templates and can be refined without changing content."
    ],
    scenario_snapshot: cloneValue(scenarioCommitted ?? null)
  };
}

export function consultingReportExportToMarkdown(spec) {
  const lines = [
    `# ${spec.export_title}`,
    "",
    `Mode: \`${spec.export_mode}\``,
    "",
    "## Sections"
  ];

  for (const section of spec.sections ?? []) {
    lines.push(`- **${section.section_title}**: ${section.purpose} (pages ${section.pages.join(", ")})`);
  }

  lines.push("", "## Pages");

  for (const page of spec.pages ?? []) {
    lines.push("", `### ${page.page_number}. ${page.page_title}`);
    lines.push(`- Section: ${page.section}`);
    lines.push(`- Layout: \`${page.layout_type}\``);
    lines.push("- Content groups:");
    for (const group of page.content_groups ?? []) {
      lines.push(`  - ${group.group_label}`);
      for (const item of group.content_items ?? []) {
        lines.push(`    - ${item.label} [${item.content_ref}]: ${markdownValue(item.source_value)}`);
      }
    }
    if ((page.formatting_notes ?? []).length > 0) {
      lines.push("- Formatting notes:");
      for (const note of page.formatting_notes) {
        lines.push(`  - ${note}`);
      }
    }
    if ((page.reviewer_notes ?? []).length > 0) {
      lines.push("- Reviewer notes:");
      for (const note of page.reviewer_notes) {
        lines.push(`  - ${note}`);
      }
    }
  }

  if ((spec.export_notes ?? []).length > 0) {
    lines.push("", "## Export Notes");
    for (const note of spec.export_notes) {
      lines.push(`- ${note}`);
    }
  }

  if ((spec.presenter_notes ?? []).length > 0) {
    lines.push("", "## Presenter Notes");
    for (const note of spec.presenter_notes) {
      lines.push(`- ${note}`);
    }
  }

  if ((spec.reviewer_notes ?? []).length > 0) {
    lines.push("", "## Reviewer Notes");
    for (const note of spec.reviewer_notes) {
      lines.push(`- ${note}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function renderContentItem(item) {
  return `
    <div class="content-item">
      <div class="content-item-label">${htmlEscape(item.label)}</div>
      <div class="content-item-ref">${htmlEscape(item.content_ref)}</div>
      <div class="content-item-value">${htmlValue(item.source_value)}</div>
    </div>
  `;
}

function renderContentGroup(group) {
  return `
    <section class="content-group">
      <div class="content-group-label">${htmlEscape(group.group_label)}</div>
      <div class="content-group-refs">${(group.content_refs ?? []).map((ref) => `<span>${htmlEscape(ref)}</span>`).join("")}</div>
      <div class="content-group-items">
        ${(group.content_items ?? []).map((item) => renderContentItem(item)).join("")}
      </div>
    </section>
  `;
}

function renderPage(page) {
  return `
    <section id="${slugify(page.section)}-${page.page_number}" class="slide slide-layout-${htmlEscape(page.layout_type)}">
      <header class="slide-header">
        <div class="slide-kicker">${htmlEscape(page.section)}</div>
        <h2>${htmlEscape(page.page_title)}</h2>
        <div class="slide-page-number">Page ${page.page_number}</div>
      </header>
      <div class="slide-content">
        ${(page.content_groups ?? []).map((group) => renderContentGroup(group)).join("")}
      </div>
      <div class="slide-footer">
        ${(page.formatting_notes ?? []).map((note) => `<span>${htmlEscape(note)}</span>`).join("")}
      </div>
    </section>
  `;
}

export function consultingReportExportToHtml(spec) {
  const sectionNav = (spec.sections ?? [])
    .map(
      (section) => `
        <li>
          <a href="#${slugify(section.section_title)}-${section.pages?.[0] ?? 1}">${htmlEscape(section.section_title)}</a>
          <span>pages ${section.pages.join(", ")}</span>
        </li>
      `
    )
    .join("");

  const pages = (spec.pages ?? []).map((page) => renderPage(page)).join("");
  const sourceArtifacts = (spec.source_artifacts ?? [])
    .map(
      (artifact) => `
        <li>
          <span>${htmlEscape(artifact.artifact_id)}</span>
          <code>${htmlEscape(artifact.artifact_path)}</code>
          <strong>${htmlEscape(artifact.status)}</strong>
        </li>
      `
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${htmlEscape(spec.export_title)}</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #07111d;
      --panel: #0d1726;
      --panel-2: #122033;
      --ink: #f2f6fd;
      --muted: #98a7be;
      --line: rgba(120, 153, 193, 0.28);
      --accent: #7bcfe3;
      --accent-2: #f0c451;
      --danger: #ff7b9c;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; background: radial-gradient(circle at 18% 0%, rgba(123, 207, 227, 0.12), transparent 30%), linear-gradient(180deg, #06101c, #040811); color: var(--ink); font-family: "IBM Plex Sans", system-ui, sans-serif; }
    body { padding: 24px; }
    .deck {
      display: grid;
      gap: 18px;
      max-width: 1600px;
      margin: 0 auto;
    }
    .cover {
      display: grid;
      gap: 16px;
      padding: 28px;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(15, 26, 41, 0.96), rgba(8, 16, 28, 0.96));
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.32);
    }
    .cover h1 {
      margin: 0;
      font-size: clamp(2rem, 4vw, 3.5rem);
      line-height: 1.05;
    }
    .cover-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      color: var(--muted);
      font-size: 0.9rem;
    }
    .cover-meta span,
    .section-chip,
    .page-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: rgba(12, 20, 32, 0.72);
    }
    .cover-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
    }
    .panel {
      border: 1px solid var(--line);
      border-radius: 16px;
      background: rgba(8, 16, 26, 0.82);
      padding: 18px;
    }
    .panel h2, .panel h3 {
      margin: 0 0 10px;
    }
    .section-list, .source-list {
      display: grid;
      gap: 10px;
      padding: 0;
      margin: 0;
      list-style: none;
    }
    .section-list li, .source-list li {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: rgba(9, 18, 29, 0.7);
    }
    .section-list span, .source-list code, .source-list strong { color: var(--muted); font-size: 0.88rem; }
    .section-list a { color: var(--ink); text-decoration: none; font-weight: 600; }
    .slide {
      break-inside: avoid;
      page-break-inside: avoid;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(15, 25, 40, 0.96), rgba(8, 16, 28, 0.96));
      padding: 20px;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
      display: grid;
      gap: 16px;
      margin-top: 18px;
    }
    .slide-header {
      display: grid;
      gap: 6px;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(120, 153, 193, 0.16);
    }
    .slide-kicker {
      color: var(--accent);
      font-size: 0.74rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 700;
    }
    .slide h2 {
      margin: 0;
      font-size: 1.65rem;
      line-height: 1.15;
    }
    .slide-page-number { color: var(--muted); font-size: 0.88rem; }
    .slide-content {
      display: grid;
      gap: 14px;
    }
    .content-group {
      border: 1px solid rgba(120, 153, 193, 0.2);
      border-radius: 14px;
      background: rgba(9, 17, 28, 0.7);
      padding: 14px;
    }
    .content-group-label {
      color: var(--accent-2);
      font-size: 0.8rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .content-group-refs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }
    .content-group-refs span {
      font-size: 0.72rem;
      color: var(--muted);
      border: 1px solid rgba(120, 153, 193, 0.18);
      padding: 4px 8px;
      border-radius: 999px;
    }
    .content-group-items {
      display: grid;
      gap: 10px;
    }
    .content-item {
      border: 1px solid rgba(120, 153, 193, 0.16);
      border-radius: 12px;
      background: rgba(7, 13, 22, 0.72);
      padding: 12px;
    }
    .content-item-label { color: var(--accent); font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .content-item-ref { color: var(--muted); font-size: 0.72rem; margin-top: 4px; word-break: break-word; }
    .content-item-value {
      margin-top: 10px;
      font-size: 0.95rem;
      line-height: 1.55;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .content-item-value code {
      display: block;
      white-space: pre-wrap;
      margin: 0;
      color: #d8e7f5;
    }
    .value-null {
      color: var(--danger);
      font-style: italic;
    }
    .slide-footer {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding-top: 6px;
      color: var(--muted);
      font-size: 0.78rem;
      border-top: 1px solid rgba(120, 153, 193, 0.14);
    }
    .slide-layout-cover_title_status .slide-content,
    .slide-layout-executive_summary_three_block .slide-content {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .slide-layout-executive_summary_three_block .slide-content > .content-group:first-child {
      grid-column: 1 / -1;
    }
    .slide-layout-context_overview_with_metrics .slide-content,
    .slide-layout-implications_with_callouts .slide-content,
    .slide-layout-recommendation_with_guidance .slide-content {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .slide-layout-diagnosis_storyline .slide-content {
      grid-template-columns: 1fr;
    }
    .slide-layout-appendix_metric_table .slide-content,
    .slide-layout-appendix_step_metric_grid .slide-content {
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    }
    .slide-layout-appendix_gaps_and_assumptions .slide-content {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .callout {
      border-left: 4px solid var(--accent-2);
      padding-left: 12px;
    }
    @media print {
      body { padding: 0; background: #fff; color: #000; }
      .deck { gap: 0; max-width: none; }
      .cover, .slide {
        border-radius: 0;
        box-shadow: none;
        margin: 0;
        page-break-after: always;
      }
      .cover { min-height: 100vh; }
    }
    @media (max-width: 920px) {
      .cover-grid,
      .slide-layout-cover_title_status .slide-content,
      .slide-layout-executive_summary_three_block .slide-content,
      .slide-layout-context_overview_with_metrics .slide-content,
      .slide-layout-implications_with_callouts .slide-content,
      .slide-layout-recommendation_with_guidance .slide-content,
      .slide-layout-appendix_gaps_and_assumptions .slide-content {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main class="deck">
    <section class="cover">
      <div class="cover-meta">
        <span>Consulting-grade organization export</span>
        <span>${htmlEscape(spec.export_mode)}</span>
      </div>
      <h1>${htmlEscape(spec.export_title)}</h1>
      <div class="cover-grid">
        <div class="panel">
          <h2>Section Outline</h2>
          <ul class="section-list">
            ${sectionNav}
          </ul>
        </div>
        <div class="panel">
          <h2>Source Artifacts</h2>
          <ul class="source-list">
            ${sourceArtifacts}
          </ul>
        </div>
      </div>
    </section>
    ${pages}
  </main>
</body>
</html>`;
}

export function writeConsultingReportExport({ outJsonPath, outMarkdownPath, outHtmlPath, spec }) {
  fs.mkdirSync(path.dirname(outJsonPath), { recursive: true });
  fs.writeFileSync(outJsonPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");
  if (outMarkdownPath) {
    fs.mkdirSync(path.dirname(outMarkdownPath), { recursive: true });
    fs.writeFileSync(outMarkdownPath, consultingReportExportToMarkdown(spec), "utf8");
  }
  if (outHtmlPath) {
    fs.mkdirSync(path.dirname(outHtmlPath), { recursive: true });
    fs.writeFileSync(outHtmlPath, consultingReportExportToHtml(spec), "utf8");
  }
}
