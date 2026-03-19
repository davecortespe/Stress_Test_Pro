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

export function writeConsultingReportExport({ outJsonPath, outMarkdownPath, spec }) {
  fs.mkdirSync(path.dirname(outJsonPath), { recursive: true });
  fs.writeFileSync(outJsonPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");
  if (outMarkdownPath) {
    fs.mkdirSync(path.dirname(outMarkdownPath), { recursive: true });
    fs.writeFileSync(outMarkdownPath, consultingReportExportToMarkdown(spec), "utf8");
  }
}
