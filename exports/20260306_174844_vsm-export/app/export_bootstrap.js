window.__EXPORT_BUNDLE_DATA__ = {
  "dashboardConfig": {
    "appTitle": "Table Manufacturing",
    "subtitle": "Constraint-based line forecast (non-DES)",
    "parameterGroups": [
      {
        "groupId": "demand",
        "label": "Demand",
        "fields": [
          {
            "key": "demandMultiplier",
            "label": "Demand Multiplier",
            "type": "slider",
            "min": 0.6,
            "max": 1.6,
            "step": 0.05,
            "unit": "x",
            "defaultValue": 1
          },
          {
            "key": "mixProfile",
            "label": "Mix Profile",
            "type": "dropdown",
            "options": [
              "balanced",
              "family-A-heavy",
              "family-B-heavy"
            ],
            "defaultValue": "balanced"
          }
        ]
      },
      {
        "groupId": "capacity",
        "label": "Capacity",
        "fields": [
          {
            "key": "staffingMultiplier",
            "label": "Staffing Multiplier",
            "type": "slider",
            "min": 0.7,
            "max": 1.3,
            "step": 0.05,
            "unit": "x",
            "defaultValue": 1
          },
          {
            "key": "equipmentMultiplier",
            "label": "Equipment Multiplier",
            "type": "slider",
            "min": 0.7,
            "max": 1.4,
            "step": 0.05,
            "unit": "x",
            "defaultValue": 1
          },
          {
            "key": "unplannedDowntimePct",
            "label": "Unplanned Downtime",
            "type": "number",
            "min": 0,
            "max": 40,
            "step": 0.5,
            "unit": "%",
            "defaultValue": 7
          },
          {
            "key": "setupPenaltyMultiplier",
            "label": "Setup Penalty",
            "type": "slider",
            "min": 0.7,
            "max": 1.8,
            "step": 0.05,
            "unit": "x",
            "defaultValue": 1
          }
        ]
      },
      {
        "groupId": "process-behavior",
        "label": "Process Behavior",
        "fields": [
          {
            "key": "ctMultiplier",
            "label": "Cycle Time Multiplier",
            "type": "slider",
            "min": 0.75,
            "max": 1.6,
            "step": 0.05,
            "unit": "x",
            "defaultValue": 1
          },
          {
            "key": "variabilityMultiplier",
            "label": "Variability",
            "type": "slider",
            "min": 0.6,
            "max": 1.7,
            "step": 0.05,
            "unit": "x",
            "defaultValue": 1
          }
        ]
      },
      {
        "groupId": "interventions",
        "label": "Interventions",
        "fields": [
          {
            "key": "simulationHorizonHours",
            "label": "Simulation Horizon",
            "type": "dropdown",
            "options": [
              "8",
              "16",
              "24"
            ],
            "unit": "hr",
            "defaultValue": "8"
          },
          {
            "key": "bottleneckReliefUnits",
            "label": "Bottleneck Relief (+units)",
            "type": "number",
            "min": 0,
            "max": 6,
            "step": 1,
            "defaultValue": 1
          }
        ]
      }
    ],
    "kpis": [
      {
        "key": "forecastThroughput",
        "label": "Forecast Throughput / hr",
        "format": "number",
        "decimals": 1
      },
      {
        "key": "totalCompletedOutputPieces",
        "label": "Total Completed Output Pieces",
        "format": "number",
        "decimals": 0
      },
      {
        "key": "totalWipQty",
        "label": "Total WIP",
        "format": "number",
        "decimals": 0
      },
      {
        "key": "worstCaseTouchTime",
        "label": "Worst-case Touch Time",
        "format": "duration",
        "decimals": 1
      },
      {
        "key": "totalLeadTimeMinutes",
        "label": "Total Lead Time",
        "format": "duration",
        "decimals": 1
      },
      {
        "key": "leadTimeDeltaMinutes",
        "label": "Lead Time Delta",
        "format": "delta",
        "decimals": 1
      },
      {
        "key": "waitSharePct",
        "label": "Wait Share",
        "format": "percent",
        "decimals": 1
      },
      {
        "key": "leadTimeTopContributor",
        "label": "Lead Time Driver",
        "format": "text"
      },
      {
        "key": "throughputDelta",
        "label": "Relief Delta / hr",
        "format": "delta",
        "decimals": 1
      },
      {
        "key": "bottleneckMigration",
        "label": "Bottleneck Migration",
        "format": "text"
      },
      {
        "key": "bottleneckIndex",
        "label": "Bottleneck Index",
        "format": "percent",
        "decimals": 0
      },
      {
        "key": "brittleness",
        "label": "Brittleness",
        "format": "percent",
        "decimals": 0
      }
    ],
    "nodeCardFields": [
      "utilization",
      "queueDepth",
      "status",
      "wipQty"
    ],
    "graphStyle": {
      "edgeAnimation": "flow",
      "showProbabilities": true
    }
  },
  "vsmGraph": {
    "metadata": {
      "name": "VSM strict transcription (image)",
      "units": "days",
      "source": "User-provided VSM image (strict transcription, 2026-03-06)"
    },
    "nodes": [
      {
        "id": "form_filling",
        "label": "Form & Filling",
        "type": "process",
        "boxData": {
          "ctRaw": "2 days",
          "changeoverRaw": null,
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Target days: 2",
            "Status dot: green"
          ]
        }
      },
      {
        "id": "inspection",
        "label": "Inspection",
        "type": "process",
        "boxData": {
          "ctRaw": "1 days",
          "changeoverRaw": null,
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Target days: 2",
            "Status dot: green"
          ]
        }
      },
      {
        "id": "packaging",
        "label": "Packaging",
        "type": "process",
        "boxData": {
          "ctRaw": "2 days",
          "changeoverRaw": null,
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Target days: 4",
            "Status dot: green"
          ]
        }
      },
      {
        "id": "functional_test",
        "label": "Functional Test",
        "type": "process",
        "boxData": {
          "ctRaw": "4 days",
          "changeoverRaw": null,
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Target days: 10",
            "Status dot: green"
          ]
        }
      },
      {
        "id": "coa",
        "label": "COA",
        "type": "process",
        "boxData": {
          "ctRaw": "2 days",
          "changeoverRaw": null,
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Target days: 4",
            "Status dot: green"
          ]
        }
      },
      {
        "id": "release",
        "label": "Release",
        "type": "process",
        "boxData": {
          "ctRaw": "1 days",
          "changeoverRaw": null,
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Target days: 2",
            "Status dot: green"
          ]
        }
      },
      {
        "id": "sterile_brr_mfg",
        "label": "Sterile BRR Mfg",
        "type": "process",
        "boxData": {
          "ctRaw": "4 days",
          "changeoverRaw": null,
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Target days: 6",
            "Status dot: green"
          ]
        }
      },
      {
        "id": "sterile_brr_qa",
        "label": "Sterile BRR QA",
        "type": "process",
        "boxData": {
          "ctRaw": "8 days",
          "changeoverRaw": null,
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Target days: 9",
            "Status dot: green"
          ]
        }
      },
      {
        "id": "insp_brr_mfg",
        "label": "Insp BRR MFG",
        "type": "process",
        "boxData": {
          "ctRaw": "2 days",
          "changeoverRaw": null,
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Target days: 5",
            "Status dot: green"
          ]
        }
      },
      {
        "id": "insp_brr_qa",
        "label": "Insp BRR QA",
        "type": "process",
        "boxData": {
          "ctRaw": "7 days",
          "changeoverRaw": null,
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Target days: 5",
            "Status dot: red"
          ]
        }
      },
      {
        "id": "pkg_mfg_brr",
        "label": "PKG Mfg BRR",
        "type": "process",
        "boxData": {
          "ctRaw": "1 days",
          "changeoverRaw": null,
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Target days: 5",
            "Status dot: green"
          ]
        }
      },
      {
        "id": "pkg_qa_brr",
        "label": "PKG QA BRR",
        "type": "process",
        "boxData": {
          "ctRaw": "6 days",
          "changeoverRaw": null,
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Target days: 5",
            "Status dot: red"
          ]
        }
      }
    ],
    "edges": [
      {
        "from": "form_filling",
        "to": "inspection",
        "probability": 1,
        "waitRaw": "5"
      },
      {
        "from": "inspection",
        "to": "packaging",
        "probability": 1,
        "waitRaw": "15"
      },
      {
        "from": "packaging",
        "to": "functional_test",
        "probability": 1,
        "waitRaw": null
      },
      {
        "from": "functional_test",
        "to": "coa",
        "probability": 1,
        "waitRaw": null
      },
      {
        "from": "coa",
        "to": "release",
        "probability": 1,
        "waitRaw": null
      },
      {
        "from": "release",
        "to": "sterile_brr_mfg",
        "probability": 1,
        "waitRaw": "2.5"
      },
      {
        "from": "sterile_brr_mfg",
        "to": "sterile_brr_qa",
        "probability": 1,
        "waitRaw": "5"
      },
      {
        "from": "sterile_brr_qa",
        "to": "insp_brr_mfg",
        "probability": 1,
        "waitRaw": null
      },
      {
        "from": "insp_brr_mfg",
        "to": "insp_brr_qa",
        "probability": 1,
        "waitRaw": "1"
      },
      {
        "from": "insp_brr_qa",
        "to": "pkg_mfg_brr",
        "probability": 1,
        "waitRaw": null
      },
      {
        "from": "pkg_mfg_brr",
        "to": "pkg_qa_brr",
        "probability": 1,
        "waitRaw": "1"
      }
    ],
    "startNodes": [
      "form_filling"
    ],
    "endNodes": [
      "pkg_qa_brr"
    ]
  },
  "masterData": {
    "products": [],
    "equipment": [
      {
        "equipmentType": "Form & Filling",
        "count": null,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "Workers/equipment count not visible."
      },
      {
        "equipmentType": "Inspection",
        "count": null,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "Workers/equipment count not visible."
      },
      {
        "equipmentType": "Packaging",
        "count": null,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "Workers/equipment count not visible."
      },
      {
        "equipmentType": "Functional Test",
        "count": null,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "Workers/equipment count not visible."
      },
      {
        "equipmentType": "COA",
        "count": null,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "Workers/equipment count not visible."
      },
      {
        "equipmentType": "Release",
        "count": null,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "Workers/equipment count not visible."
      },
      {
        "equipmentType": "Sterile BRR Mfg",
        "count": null,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "Workers/equipment count not visible."
      },
      {
        "equipmentType": "Sterile BRR QA",
        "count": null,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "Workers/equipment count not visible."
      },
      {
        "equipmentType": "Insp BRR MFG",
        "count": null,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "Workers/equipment count not visible."
      },
      {
        "equipmentType": "Insp BRR QA",
        "count": null,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "Workers/equipment count not visible."
      },
      {
        "equipmentType": "PKG Mfg BRR",
        "count": null,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "Workers/equipment count not visible."
      },
      {
        "equipmentType": "PKG QA BRR",
        "count": null,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "Workers/equipment count not visible."
      }
    ],
    "processing": [
      {
        "stepId": "form_filling",
        "equipmentType": "Form & Filling",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 2880,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": "5 (between Form & Filling and Inspection)"
        },
        "leadTimeMinutes": 2880,
        "leadTimeRaw": "Target days: 2",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": null,
        "sourceText": "Target days: 2; C.T. (Median): 2 days"
      },
      {
        "stepId": "inspection",
        "equipmentType": "Inspection",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 1440,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": "15 (between Inspection and Packaging)"
        },
        "leadTimeMinutes": 2880,
        "leadTimeRaw": "Target days: 2",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": null,
        "sourceText": "Target days: 2; C.T. (Median): 1 days"
      },
      {
        "stepId": "packaging",
        "equipmentType": "Packaging",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 2880,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": null
        },
        "leadTimeMinutes": 5760,
        "leadTimeRaw": "Target days: 4",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": null,
        "sourceText": "Target days: 4; C.T. (Median): 2 days"
      },
      {
        "stepId": "functional_test",
        "equipmentType": "Functional Test",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 5760,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": null
        },
        "leadTimeMinutes": 14400,
        "leadTimeRaw": "Target days: 10",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": null,
        "sourceText": "Target days: 10; C.T. (Median): 4 days"
      },
      {
        "stepId": "coa",
        "equipmentType": "COA",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 2880,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": null
        },
        "leadTimeMinutes": 5760,
        "leadTimeRaw": "Target days: 4",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": null,
        "sourceText": "Target days: 4; C.T. (Median): 2 days"
      },
      {
        "stepId": "release",
        "equipmentType": "Release",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 1440,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": "2.5 (between Release and Sterile BRR Mfg)"
        },
        "leadTimeMinutes": 2880,
        "leadTimeRaw": "Target days: 2",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": null,
        "sourceText": "Target days: 2; C.T. (Median): 1 days"
      },
      {
        "stepId": "sterile_brr_mfg",
        "equipmentType": "Sterile BRR Mfg",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 5760,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": "5 (between Sterile BRR Mfg and Sterile BRR QA)"
        },
        "leadTimeMinutes": 8640,
        "leadTimeRaw": "Target days: 6",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": null,
        "sourceText": "Target days: 6; C.T. (Median): 4 days"
      },
      {
        "stepId": "sterile_brr_qa",
        "equipmentType": "Sterile BRR QA",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 11520,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": null
        },
        "leadTimeMinutes": 12960,
        "leadTimeRaw": "Target days: 9",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": null,
        "sourceText": "Target days: 9; C.T. (Median): 8 days"
      },
      {
        "stepId": "insp_brr_mfg",
        "equipmentType": "Insp BRR MFG",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 2880,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": "1 (between Insp BRR MFG and Insp BRR QA)"
        },
        "leadTimeMinutes": 7200,
        "leadTimeRaw": "Target days: 5",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": null,
        "sourceText": "Target days: 5; C.T. (Median): 2 days"
      },
      {
        "stepId": "insp_brr_qa",
        "equipmentType": "Insp BRR QA",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 10080,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": null
        },
        "leadTimeMinutes": 7200,
        "leadTimeRaw": "Target days: 5",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": null,
        "sourceText": "Target days: 5; C.T. (Median): 7 days"
      },
      {
        "stepId": "pkg_mfg_brr",
        "equipmentType": "PKG Mfg BRR",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 1440,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": "1 (between PKG Mfg BRR and PKG QA BRR)"
        },
        "leadTimeMinutes": 7200,
        "leadTimeRaw": "Target days: 5",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": null,
        "sourceText": "Target days: 5; C.T. (Median): 1 days"
      },
      {
        "stepId": "pkg_qa_brr",
        "equipmentType": "PKG QA BRR",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 8640,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": null
        },
        "leadTimeMinutes": 7200,
        "leadTimeRaw": "Target days: 5",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": null,
        "sourceText": "Target days: 5; C.T. (Median): 6 days"
      }
    ],
    "assumptions": [
      {
        "id": "strict-001",
        "severity": "warning",
        "text": "All worker and equipment counts are not visible in the image; equipment.count and workers are null."
      },
      {
        "id": "strict-002",
        "severity": "warning",
        "text": "No per-step changeover fields are visible in the image; changeover.time is null for all steps."
      },
      {
        "id": "strict-003",
        "severity": "warning",
        "text": "Parallel procedure counts are not visible in process boxes; parallelProcedures is null for all steps."
      },
      {
        "id": "strict-004",
        "severity": "warning",
        "text": "Inter-step triangle values are visible but units are not shown; stored as raw wait text only."
      },
      {
        "id": "strict-005",
        "severity": "warning",
        "text": "Day-based values are normalized to minutes using 1 day = 1440 minutes for forecast math."
      },
      {
        "id": "strict-006",
        "severity": "blocker",
        "text": "Demand rate, product mix, lot-size policy, shift hours, and uptime are not visible in the image."
      }
    ]
  },
  "compiledForecastModel": {
    "version": "0.2.0",
    "generatedAt": "2026-03-06T22:42:51.325Z",
    "metadata": {
      "name": "VSM strict transcription (image)",
      "units": "per-hour",
      "mode": "constraint-forecast-non-des"
    },
    "graph": {
      "metadata": {
        "name": "VSM strict transcription (image)",
        "units": "days",
        "source": "User-provided VSM image (strict transcription, 2026-03-06)"
      },
      "nodes": [
        {
          "id": "form_filling",
          "label": "Form & Filling",
          "type": "process",
          "boxData": {
            "ctRaw": "2 days",
            "changeoverRaw": null,
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Target days: 2",
              "Status dot: green"
            ]
          }
        },
        {
          "id": "inspection",
          "label": "Inspection",
          "type": "process",
          "boxData": {
            "ctRaw": "1 days",
            "changeoverRaw": null,
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Target days: 2",
              "Status dot: green"
            ]
          }
        },
        {
          "id": "packaging",
          "label": "Packaging",
          "type": "process",
          "boxData": {
            "ctRaw": "2 days",
            "changeoverRaw": null,
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Target days: 4",
              "Status dot: green"
            ]
          }
        },
        {
          "id": "functional_test",
          "label": "Functional Test",
          "type": "process",
          "boxData": {
            "ctRaw": "4 days",
            "changeoverRaw": null,
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Target days: 10",
              "Status dot: green"
            ]
          }
        },
        {
          "id": "coa",
          "label": "COA",
          "type": "process",
          "boxData": {
            "ctRaw": "2 days",
            "changeoverRaw": null,
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Target days: 4",
              "Status dot: green"
            ]
          }
        },
        {
          "id": "release",
          "label": "Release",
          "type": "process",
          "boxData": {
            "ctRaw": "1 days",
            "changeoverRaw": null,
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Target days: 2",
              "Status dot: green"
            ]
          }
        },
        {
          "id": "sterile_brr_mfg",
          "label": "Sterile BRR Mfg",
          "type": "process",
          "boxData": {
            "ctRaw": "4 days",
            "changeoverRaw": null,
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Target days: 6",
              "Status dot: green"
            ]
          }
        },
        {
          "id": "sterile_brr_qa",
          "label": "Sterile BRR QA",
          "type": "process",
          "boxData": {
            "ctRaw": "8 days",
            "changeoverRaw": null,
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Target days: 9",
              "Status dot: green"
            ]
          }
        },
        {
          "id": "insp_brr_mfg",
          "label": "Insp BRR MFG",
          "type": "process",
          "boxData": {
            "ctRaw": "2 days",
            "changeoverRaw": null,
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Target days: 5",
              "Status dot: green"
            ]
          }
        },
        {
          "id": "insp_brr_qa",
          "label": "Insp BRR QA",
          "type": "process",
          "boxData": {
            "ctRaw": "7 days",
            "changeoverRaw": null,
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Target days: 5",
              "Status dot: red"
            ]
          }
        },
        {
          "id": "pkg_mfg_brr",
          "label": "PKG Mfg BRR",
          "type": "process",
          "boxData": {
            "ctRaw": "1 days",
            "changeoverRaw": null,
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Target days: 5",
              "Status dot: green"
            ]
          }
        },
        {
          "id": "pkg_qa_brr",
          "label": "PKG QA BRR",
          "type": "process",
          "boxData": {
            "ctRaw": "6 days",
            "changeoverRaw": null,
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Target days: 5",
              "Status dot: red"
            ]
          }
        }
      ],
      "edges": [
        {
          "from": "form_filling",
          "to": "inspection",
          "probability": 1,
          "waitRaw": "5"
        },
        {
          "from": "inspection",
          "to": "packaging",
          "probability": 1,
          "waitRaw": "15"
        },
        {
          "from": "packaging",
          "to": "functional_test",
          "probability": 1,
          "waitRaw": null
        },
        {
          "from": "functional_test",
          "to": "coa",
          "probability": 1,
          "waitRaw": null
        },
        {
          "from": "coa",
          "to": "release",
          "probability": 1,
          "waitRaw": null
        },
        {
          "from": "release",
          "to": "sterile_brr_mfg",
          "probability": 1,
          "waitRaw": "2.5"
        },
        {
          "from": "sterile_brr_mfg",
          "to": "sterile_brr_qa",
          "probability": 1,
          "waitRaw": "5"
        },
        {
          "from": "sterile_brr_qa",
          "to": "insp_brr_mfg",
          "probability": 1,
          "waitRaw": null
        },
        {
          "from": "insp_brr_mfg",
          "to": "insp_brr_qa",
          "probability": 1,
          "waitRaw": "1"
        },
        {
          "from": "insp_brr_qa",
          "to": "pkg_mfg_brr",
          "probability": 1,
          "waitRaw": null
        },
        {
          "from": "pkg_mfg_brr",
          "to": "pkg_qa_brr",
          "probability": 1,
          "waitRaw": "1"
        }
      ],
      "startNodes": [
        "form_filling"
      ],
      "endNodes": [
        "pkg_qa_brr"
      ]
    },
    "inputs": [
      {
        "key": "demandMultiplier",
        "label": "Demand Multiplier",
        "type": "number",
        "defaultValue": 1,
        "min": 0.6,
        "max": 1.8,
        "step": 0.05
      },
      {
        "key": "mixProfile",
        "label": "Mix Profile",
        "type": "select",
        "defaultValue": "balanced",
        "options": [
          "balanced",
          "station-1-heavy",
          "final-step-heavy"
        ]
      },
      {
        "key": "staffingMultiplier",
        "label": "Staffing Multiplier",
        "type": "number",
        "defaultValue": 1,
        "min": 0.7,
        "max": 1.4,
        "step": 0.05
      },
      {
        "key": "equipmentMultiplier",
        "label": "Equipment Multiplier",
        "type": "number",
        "defaultValue": 1,
        "min": 0.7,
        "max": 1.4,
        "step": 0.05
      },
      {
        "key": "unplannedDowntimePct",
        "label": "Unplanned Downtime",
        "type": "number",
        "defaultValue": 7,
        "min": 0,
        "max": 35,
        "step": 0.5
      },
      {
        "key": "ctMultiplier",
        "label": "Cycle Time Multiplier",
        "type": "number",
        "defaultValue": 1,
        "min": 0.75,
        "max": 1.6,
        "step": 0.05
      },
      {
        "key": "setupPenaltyMultiplier",
        "label": "Setup Penalty",
        "type": "number",
        "defaultValue": 1,
        "min": 0.5,
        "max": 1.8,
        "step": 0.05
      },
      {
        "key": "variabilityMultiplier",
        "label": "Variability Multiplier",
        "type": "number",
        "defaultValue": 1,
        "min": 0.6,
        "max": 1.8,
        "step": 0.05
      },
      {
        "key": "simulationHorizonHours",
        "label": "Simulation Horizon",
        "type": "select",
        "defaultValue": "8",
        "options": [
          "8",
          "16",
          "24"
        ]
      },
      {
        "key": "bottleneckReliefUnits",
        "label": "Bottleneck Relief (+units)",
        "type": "number",
        "defaultValue": 1,
        "min": 0,
        "max": 6,
        "step": 1
      }
    ],
    "inputDefaults": {
      "demandRatePerHour": 0.0047,
      "demandMultiplier": 1,
      "mixProfile": "balanced",
      "staffingMultiplier": 1,
      "equipmentMultiplier": 1,
      "unplannedDowntimePct": 7,
      "ctMultiplier": 1,
      "setupPenaltyMultiplier": 1,
      "variabilityMultiplier": 1,
      "simulationHorizonHours": "8",
      "bottleneckReliefUnits": 1
    },
    "stepModels": [
      {
        "stepId": "form_filling",
        "label": "Form & Filling",
        "equipmentType": "Form & Filling",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 2880,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 2880,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 2880,
        "effectiveCapacityPerHour": 0.0208,
        "baseline": {
          "demandRatePerHour": 0.0047,
          "utilization": 0.226,
          "headroom": 0.774,
          "queueRisk": 0.0068,
          "bottleneckIndex": 0.114,
          "status": "healthy"
        }
      },
      {
        "stepId": "inspection",
        "label": "Inspection",
        "equipmentType": "Inspection",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 1440,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 2880,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 1440,
        "effectiveCapacityPerHour": 0.0417,
        "baseline": {
          "demandRatePerHour": 0.0047,
          "utilization": 0.1127,
          "headroom": 0.8873,
          "queueRisk": 0.0015,
          "bottleneckIndex": 0.0563,
          "status": "healthy"
        }
      },
      {
        "stepId": "packaging",
        "label": "Packaging",
        "equipmentType": "Packaging",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 2880,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 5760,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 2880,
        "effectiveCapacityPerHour": 0.0208,
        "baseline": {
          "demandRatePerHour": 0.0047,
          "utilization": 0.226,
          "headroom": 0.774,
          "queueRisk": 0.0068,
          "bottleneckIndex": 0.114,
          "status": "healthy"
        }
      },
      {
        "stepId": "functional_test",
        "label": "Functional Test",
        "equipmentType": "Functional Test",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 5760,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 14400,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 5760,
        "effectiveCapacityPerHour": 0.0104,
        "baseline": {
          "demandRatePerHour": 0.0047,
          "utilization": 0.4519,
          "headroom": 0.5481,
          "queueRisk": 0.0384,
          "bottleneckIndex": 0.2349,
          "status": "healthy"
        }
      },
      {
        "stepId": "coa",
        "label": "COA",
        "equipmentType": "COA",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 2880,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 5760,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 2880,
        "effectiveCapacityPerHour": 0.0208,
        "baseline": {
          "demandRatePerHour": 0.0047,
          "utilization": 0.226,
          "headroom": 0.774,
          "queueRisk": 0.0068,
          "bottleneckIndex": 0.114,
          "status": "healthy"
        }
      },
      {
        "stepId": "release",
        "label": "Release",
        "equipmentType": "Release",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 1440,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 2880,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 1440,
        "effectiveCapacityPerHour": 0.0417,
        "baseline": {
          "demandRatePerHour": 0.0047,
          "utilization": 0.1127,
          "headroom": 0.8873,
          "queueRisk": 0.0015,
          "bottleneckIndex": 0.0563,
          "status": "healthy"
        }
      },
      {
        "stepId": "sterile_brr_mfg",
        "label": "Sterile BRR Mfg",
        "equipmentType": "Sterile BRR Mfg",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 5760,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 8640,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 5760,
        "effectiveCapacityPerHour": 0.0104,
        "baseline": {
          "demandRatePerHour": 0.0047,
          "utilization": 0.4519,
          "headroom": 0.5481,
          "queueRisk": 0.0384,
          "bottleneckIndex": 0.2349,
          "status": "healthy"
        }
      },
      {
        "stepId": "sterile_brr_qa",
        "label": "Sterile BRR QA",
        "equipmentType": "Sterile BRR QA",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 11520,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 12960,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 11520,
        "effectiveCapacityPerHour": 0.0052,
        "baseline": {
          "demandRatePerHour": 0.0047,
          "utilization": 0.9038,
          "headroom": 0.0962,
          "queueRisk": 0.8762,
          "bottleneckIndex": 0.6936,
          "status": "risk"
        }
      },
      {
        "stepId": "insp_brr_mfg",
        "label": "Insp BRR MFG",
        "equipmentType": "Insp BRR MFG",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 2880,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 7200,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 2880,
        "effectiveCapacityPerHour": 0.0208,
        "baseline": {
          "demandRatePerHour": 0.0047,
          "utilization": 0.226,
          "headroom": 0.774,
          "queueRisk": 0.0068,
          "bottleneckIndex": 0.114,
          "status": "healthy"
        }
      },
      {
        "stepId": "insp_brr_qa",
        "label": "Insp BRR QA",
        "equipmentType": "Insp BRR QA",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 10080,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 7200,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 10080,
        "effectiveCapacityPerHour": 0.006,
        "baseline": {
          "demandRatePerHour": 0.0047,
          "utilization": 0.7833,
          "headroom": 0.2167,
          "queueRisk": 0.2921,
          "bottleneckIndex": 0.4703,
          "status": "healthy"
        }
      },
      {
        "stepId": "pkg_mfg_brr",
        "label": "PKG Mfg BRR",
        "equipmentType": "PKG Mfg BRR",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 1440,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 7200,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 1440,
        "effectiveCapacityPerHour": 0.0417,
        "baseline": {
          "demandRatePerHour": 0.0047,
          "utilization": 0.1127,
          "headroom": 0.8873,
          "queueRisk": 0.0015,
          "bottleneckIndex": 0.0563,
          "status": "healthy"
        }
      },
      {
        "stepId": "pkg_qa_brr",
        "label": "PKG QA BRR",
        "equipmentType": "PKG QA BRR",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 8640,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 7200,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 8640,
        "effectiveCapacityPerHour": 0.0069,
        "baseline": {
          "demandRatePerHour": 0.0047,
          "utilization": 0.6812,
          "headroom": 0.3188,
          "queueRisk": 0.1501,
          "bottleneckIndex": 0.3799,
          "status": "healthy"
        }
      }
    ],
    "baseline": {
      "demandRatePerHour": 0.0047,
      "lineCapacityPerHour": 0.0052,
      "bottleneckStepId": "sterile_brr_qa",
      "globalMetrics": {
        "throughput": 0.0047,
        "forecastThroughput": 0.0047,
        "throughputDelta": 0,
        "bottleneckMigration": "baseline only",
        "bottleneckIndex": 0.6936,
        "brittleness": 0.3976,
        "avgQueueRisk": 0.1189,
        "totalWipQty": 19.1317,
        "worstCaseTouchTime": 57600,
        "totalLeadTimeMinutes": 343218.2141,
        "leadTimeDeltaMinutes": 0,
        "waitSharePct": 0.2475,
        "leadTimeTopContributor": "Sterile BRR QA"
      },
      "nodeMetrics": {
        "form_filling": {
          "utilization": 0.226,
          "headroom": 0.774,
          "queueRisk": 0.0068,
          "queueDepth": 0.0816,
          "wipQty": 0.0816,
          "completedQty": 0,
          "leadTimeMinutes": 5995.4722,
          "capacityPerHour": 0.0208,
          "bottleneckIndex": 0.114,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "inspection": {
          "utilization": 0.1127,
          "headroom": 0.8873,
          "queueRisk": 0.0015,
          "queueDepth": 0.0177,
          "wipQty": 0.0177,
          "completedQty": 0,
          "leadTimeMinutes": 4345.4928,
          "capacityPerHour": 0.0417,
          "bottleneckIndex": 0.0563,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "packaging": {
          "utilization": 0.226,
          "headroom": 0.774,
          "queueRisk": 0.0068,
          "queueDepth": 0.0816,
          "wipQty": 0.0816,
          "completedQty": 0,
          "leadTimeMinutes": 8875.4722,
          "capacityPerHour": 0.0208,
          "bottleneckIndex": 0.114,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "functional_test": {
          "utilization": 0.4519,
          "headroom": 0.5481,
          "queueRisk": 0.0384,
          "queueDepth": 0.4611,
          "wipQty": 0.4611,
          "completedQty": 0,
          "leadTimeMinutes": 22820.4227,
          "capacityPerHour": 0.0104,
          "bottleneckIndex": 0.2349,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "coa": {
          "utilization": 0.226,
          "headroom": 0.774,
          "queueRisk": 0.0068,
          "queueDepth": 0.0816,
          "wipQty": 0.0816,
          "completedQty": 0,
          "leadTimeMinutes": 8875.4722,
          "capacityPerHour": 0.0208,
          "bottleneckIndex": 0.114,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "release": {
          "utilization": 0.1127,
          "headroom": 0.8873,
          "queueRisk": 0.0015,
          "queueDepth": 0.0177,
          "wipQty": 0.0177,
          "completedQty": 0,
          "leadTimeMinutes": 4345.4928,
          "capacityPerHour": 0.0417,
          "bottleneckIndex": 0.0563,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "sterile_brr_mfg": {
          "utilization": 0.4519,
          "headroom": 0.5481,
          "queueRisk": 0.0384,
          "queueDepth": 0.4611,
          "wipQty": 0.4611,
          "completedQty": 0,
          "leadTimeMinutes": 17060.4227,
          "capacityPerHour": 0.0104,
          "bottleneckIndex": 0.2349,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "sterile_brr_qa": {
          "utilization": 0.9038,
          "headroom": 0.0962,
          "queueRisk": 0.8762,
          "queueDepth": 11.9409,
          "wipQty": 11.9409,
          "completedQty": 0,
          "leadTimeMinutes": 162259.7707,
          "capacityPerHour": 0.0052,
          "bottleneckIndex": 0.6936,
          "bottleneckFlag": true,
          "status": "critical"
        },
        "insp_brr_mfg": {
          "utilization": 0.226,
          "headroom": 0.774,
          "queueRisk": 0.0068,
          "queueDepth": 0.0816,
          "wipQty": 0.0816,
          "completedQty": 0,
          "leadTimeMinutes": 10315.4722,
          "capacityPerHour": 0.0208,
          "bottleneckIndex": 0.114,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "insp_brr_qa": {
          "utilization": 0.7833,
          "headroom": 0.2167,
          "queueRisk": 0.2921,
          "queueDepth": 4.088,
          "wipQty": 4.088,
          "completedQty": 0,
          "leadTimeMinutes": 58159.9679,
          "capacityPerHour": 0.006,
          "bottleneckIndex": 0.4703,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "pkg_mfg_brr": {
          "utilization": 0.1127,
          "headroom": 0.8873,
          "queueRisk": 0.0015,
          "queueDepth": 0.0177,
          "wipQty": 0.0177,
          "completedQty": 0,
          "leadTimeMinutes": 8665.4928,
          "capacityPerHour": 0.0417,
          "bottleneckIndex": 0.0563,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "pkg_qa_brr": {
          "utilization": 0.6812,
          "headroom": 0.3188,
          "queueRisk": 0.1501,
          "queueDepth": 1.8008,
          "wipQty": 1.8008,
          "completedQty": 0,
          "leadTimeMinutes": 31499.2628,
          "capacityPerHour": 0.0069,
          "bottleneckIndex": 0.3799,
          "bottleneckFlag": false,
          "status": "healthy"
        }
      }
    },
    "assumptions": [
      {
        "id": "compile-001",
        "severity": "warning",
        "text": "Demand rate is not shown in the VSM image; baseline demandRatePerHour is set to 90% of computed line capacity."
      },
      {
        "id": "compile-002",
        "severity": "warning",
        "text": "Station=n text is interpreted as effective parallel units during forecast compilation."
      },
      {
        "id": "compile-003",
        "severity": "warning",
        "text": "A lot-size assumption of 40 units is used to convert visible C/O minutes into per-unit setup penalty."
      },
      {
        "id": "compile-004",
        "severity": "warning",
        "text": "Where C/O is null or ambiguous in strict transcription, setup penalty contribution is set to zero in forecast equations."
      },
      {
        "id": "compile-005",
        "severity": "warning",
        "text": "Default variability CV is set to 0.18 for all steps because step-level variability is not shown in the image."
      },
      {
        "id": "compile-006",
        "severity": "warning",
        "text": "Step lead time values not visible in the image are stored as null in master data and treated as 0 minutes in aggregate lead-time calculations."
      },
      {
        "id": "compile-007",
        "severity": "info",
        "text": "Queue risk, bottleneck index, brittleness, and migration outputs are deterministic non-DES heuristics for rapid forecast recompute."
      }
    ]
  },
  "scenarioCommitted": {
    "demandRatePerHour": 0.0047,
    "demandMultiplier": 1,
    "mixProfile": "balanced",
    "staffingMultiplier": 1,
    "equipmentMultiplier": 1,
    "unplannedDowntimePct": 7,
    "ctMultiplier": 1,
    "setupPenaltyMultiplier": 1,
    "variabilityMultiplier": 1,
    "simulationHorizonHours": "8",
    "bottleneckReliefUnits": 1
  }
};
window.__EXPORT_COMMITTED_SCENARIO__ = window.__EXPORT_BUNDLE_DATA__.scenarioCommitted;
