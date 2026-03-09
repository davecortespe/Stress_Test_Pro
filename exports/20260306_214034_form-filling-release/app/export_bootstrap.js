window.__EXPORT_BUNDLE_DATA__ = {
  "dashboardConfig": {
    "appTitle": "Form & Filling to Release Forecast",
    "subtitle": "Constraint-based bottleneck forecast (non-DES)",
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
      },
      {
        "key": "throughputDelta",
        "label": "Relief Delta / hr",
        "format": "delta",
        "decimals": 1
      }
    ],
    "nodeCardFields": [
      "utilization",
      "wipQty",
      "completedQty",
      "status"
    ],
    "graphStyle": {
      "edgeAnimation": "flow",
      "showProbabilities": true
    }
  },
  "vsmGraph": {
    "metadata": {
      "name": "Bottleneck Forecast Flow",
      "units": "days",
      "source": "User-provided VSM image (strict transcription, 2026-03-07)"
    },
    "nodes": [
      {
        "id": "form_and_filling",
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
          "waitRaw": "2.5 (after Release, destination not labeled)",
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Target days: 2",
            "Status dot: green"
          ]
        }
      }
    ],
    "edges": [
      {
        "from": "form_and_filling",
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
      }
    ],
    "startNodes": [
      "form_and_filling"
    ],
    "endNodes": [
      "release"
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
      }
    ],
    "processing": [
      {
        "stepId": "form_and_filling",
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
          "raw": "5 (between Form & Filling and Inspection; unit not shown)"
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
          "raw": "15 (between Inspection and Packaging; unit not shown)"
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
          "raw": "2.5 (after Release; destination not shown; unit not shown)"
        },
        "leadTimeMinutes": 2880,
        "leadTimeRaw": "Target days: 2",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": null,
        "sourceText": "Target days: 2; C.T. (Median): 1 days"
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
        "text": "Inter-step triangle values are visible but units are not shown; waits are stored as raw text only."
      },
      {
        "id": "strict-005",
        "severity": "warning",
        "text": "A post-Release triangle value of 2.5 is visible, but no destination/units are shown; stored as raw unresolved wait text on Release."
      },
      {
        "id": "strict-006",
        "severity": "warning",
        "text": "Day-based values are normalized to minutes using 1 day = 1440 minutes for forecast math."
      },
      {
        "id": "strict-007",
        "severity": "blocker",
        "text": "Demand rate, product mix, lot-size policy, shift hours, and uptime are not visible in the image."
      }
    ]
  },
  "compiledForecastModel": {
    "version": "0.2.0",
    "generatedAt": "2026-03-07T02:36:49.930Z",
    "metadata": {
      "name": "Bottleneck Forecast Flow",
      "units": "per-hour",
      "mode": "constraint-forecast-non-des"
    },
    "graph": {
      "metadata": {
        "name": "Bottleneck Forecast Flow",
        "units": "days",
        "source": "User-provided VSM image (strict transcription, 2026-03-07)"
      },
      "nodes": [
        {
          "id": "form_and_filling",
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
            "waitRaw": "2.5 (after Release, destination not labeled)",
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Target days: 2",
              "Status dot: green"
            ]
          }
        }
      ],
      "edges": [
        {
          "from": "form_and_filling",
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
        }
      ],
      "startNodes": [
        "form_and_filling"
      ],
      "endNodes": [
        "release"
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
      "demandRatePerHour": 0.0094,
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
        "stepId": "form_and_filling",
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
          "demandRatePerHour": 0.0094,
          "utilization": 0.4519,
          "headroom": 0.5481,
          "queueRisk": 0.0384,
          "bottleneckIndex": 0.2349,
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
          "demandRatePerHour": 0.0094,
          "utilization": 0.2254,
          "headroom": 0.7746,
          "queueRisk": 0.0068,
          "bottleneckIndex": 0.1137,
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
          "demandRatePerHour": 0.0094,
          "utilization": 0.4519,
          "headroom": 0.5481,
          "queueRisk": 0.0384,
          "bottleneckIndex": 0.2349,
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
          "demandRatePerHour": 0.0094,
          "utilization": 0.9038,
          "headroom": 0.0962,
          "queueRisk": 0.8762,
          "bottleneckIndex": 0.6936,
          "status": "risk"
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
          "demandRatePerHour": 0.0094,
          "utilization": 0.4519,
          "headroom": 0.5481,
          "queueRisk": 0.0384,
          "bottleneckIndex": 0.2349,
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
          "demandRatePerHour": 0.0094,
          "utilization": 0.2254,
          "headroom": 0.7746,
          "queueRisk": 0.0068,
          "bottleneckIndex": 0.1137,
          "status": "healthy"
        }
      }
    ],
    "baseline": {
      "demandRatePerHour": 0.0094,
      "lineCapacityPerHour": 0.0104,
      "bottleneckStepId": "functional_test",
      "globalMetrics": {
        "throughput": 0.0094,
        "forecastThroughput": 0.0094,
        "throughputDelta": 0,
        "bottleneckMigration": "baseline only",
        "bottleneckIndex": 0.6936,
        "brittleness": 0.4201,
        "avgQueueRisk": 0.1675,
        "totalWipQty": 13.4867,
        "worstCaseTouchTime": 17280,
        "totalLeadTimeMinutes": 124954.138,
        "leadTimeDeltaMinutes": 0,
        "waitSharePct": 0.2766,
        "leadTimeTopContributor": "Functional Test"
      },
      "nodeMetrics": {
        "form_and_filling": {
          "utilization": 0.4519,
          "headroom": 0.5481,
          "queueRisk": 0.0384,
          "queueDepth": 0.4611,
          "wipQty": 0.4611,
          "completedQty": 0,
          "leadTimeMinutes": 7090.2113,
          "capacityPerHour": 0.0208,
          "bottleneckIndex": 0.2349,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "inspection": {
          "utilization": 0.2254,
          "headroom": 0.7746,
          "queueRisk": 0.0068,
          "queueDepth": 0.0812,
          "wipQty": 0.0812,
          "completedQty": 0,
          "leadTimeMinutes": 4436.8093,
          "capacityPerHour": 0.0417,
          "bottleneckIndex": 0.1137,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "packaging": {
          "utilization": 0.4519,
          "headroom": 0.5481,
          "queueRisk": 0.0384,
          "queueDepth": 0.4611,
          "wipQty": 0.4611,
          "completedQty": 0,
          "leadTimeMinutes": 9970.2113,
          "capacityPerHour": 0.0208,
          "bottleneckIndex": 0.2349,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "functional_test": {
          "utilization": 0.9038,
          "headroom": 0.0962,
          "queueRisk": 0.8762,
          "queueDepth": 11.9409,
          "wipQty": 11.9409,
          "completedQty": 0,
          "leadTimeMinutes": 89049.8854,
          "capacityPerHour": 0.0104,
          "bottleneckIndex": 0.6936,
          "bottleneckFlag": true,
          "status": "critical"
        },
        "coa": {
          "utilization": 0.4519,
          "headroom": 0.5481,
          "queueRisk": 0.0384,
          "queueDepth": 0.4611,
          "wipQty": 0.4611,
          "completedQty": 0,
          "leadTimeMinutes": 9970.2113,
          "capacityPerHour": 0.0208,
          "bottleneckIndex": 0.2349,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "release": {
          "utilization": 0.2254,
          "headroom": 0.7746,
          "queueRisk": 0.0068,
          "queueDepth": 0.0812,
          "wipQty": 0.0812,
          "completedQty": 0,
          "leadTimeMinutes": 4436.8093,
          "capacityPerHour": 0.0417,
          "bottleneckIndex": 0.1137,
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
  "operationalDiagnosis": {
    "status": "overloaded",
    "statusSummary": "Functional Test is no longer clearing work at the required rate. The system is effectively overloaded, so queue and WIP growth will continue until load is reduced or capacity is added.",
    "primaryConstraint": "Functional Test is the active choke point because work is arriving faster than that step can drain its queue.",
    "constraintMechanism": "Functional Test has enough average capacity on paper, but bunching is compressing work into peaks. That makes the queue spike faster than the step can recover between waves.",
    "downstreamEffects": "Throughput is running about 6% below required rate, WIP has built to roughly 13 units, total lead time is now about 124954.1 minutes, and operators should expect more expediting, rescheduling, and service risk if this state persists.",
    "economicInterpretation": "This is creating hidden capacity loss of roughly 6% versus required output. The likely business impact is overtime pressure, slower inventory availability, and missed throughput that has to be recovered later.",
    "recommendedAction": "Reduce effective cycle time at Functional Test with standard work, faster changeovers, or error removal before spending on larger structural changes.",
    "scenarioGuidance": "Scenario comparison is limited. Current outputs do not show a materially better tested scenario than the active case.",
    "aiOpportunityLens": {
      "dataAlreadyExists": "Utilization, queue, WIP, and lead-time data already exist here but are usually reviewed as separate metrics instead of as one flow signal.",
      "manualPatternDecisions": "Labor rebalance, release timing, and expediting decisions are still manual even though the patterns are repetitive and detectable from the same simulation outputs.",
      "predictiveGap": "Most current reporting is backward-looking. The diagnosis should be used to flag where the next queue spike or throughput miss is likely before the floor feels it.",
      "tribalKnowledge": "If step recovery depends on supervisor memory, shift handoff notes, or email threads, that is acting like an unstructured operating database.",
      "visibilityGap": "When operators cannot see where queue pressure will propagate next, the business leaks profit through avoidable delay, premium labor, and hidden capacity loss."
    },
    "confidence": "low",
    "confidenceNote": "Confidence is low because key inputs are incomplete. Missing or weak fields: demand rate/product mix, parallel procedures, changeover/setup times, lot-size policy."
  },
  "scenarioCommitted": {
    "demandRatePerHour": 0.0094,
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
