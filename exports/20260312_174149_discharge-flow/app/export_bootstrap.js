window.__EXPORT_BUNDLE_DATA__ = {
  "dashboardConfig": {
    "appTitle": "Discharge Flow Forecast",
    "subtitle": "LeanStorming Operational Stress Labs",
    "parameterGroups": [
      {
        "groupId": "interventions",
        "label": "Interventions",
        "fields": [
          {
            "key": "sellingPricePerUnit",
            "label": "Transfer Price / Unit",
            "helpText": "Scenario-level transfer price used by the Throughput Analysis module. Missing or zero transfer price blocks throughput economics.",
            "type": "number",
            "min": 0,
            "max": 100000,
            "step": 0.01,
            "unit": "$",
            "defaultValue": 0
          },
          {
            "key": "simulationHorizonHours",
            "label": "Simulation Horizon",
            "helpText": "Calendar time the model will simulate. The clock keeps advancing across working and non-working hours until this horizon is reached.",
            "type": "dropdown",
            "options": [
              {
                "label": "8 hrs",
                "value": "8"
              },
              {
                "label": "16 hrs",
                "value": "16"
              },
              {
                "label": "24 hrs",
                "value": "24"
              },
              {
                "label": "1 week",
                "value": "168"
              },
              {
                "label": "1 month",
                "value": "720"
              }
            ],
            "unit": "hr",
            "defaultValue": "24"
          },
          {
            "key": "activeShiftCount",
            "label": "Operating Shifts",
            "helpText": "Defines how many 8-hour shifts the operation runs each day. One shift runs 8 hours then stops for 16; two shifts run 16 then stop for 8; three shifts run continuously.",
            "type": "dropdown",
            "options": [
              {
                "label": "1 shift",
                "value": "1"
              },
              {
                "label": "2 shifts",
                "value": "2"
              },
              {
                "label": "3 shifts",
                "value": "3"
              }
            ],
            "defaultValue": "3"
          },
          {
            "key": "bottleneckReliefUnits",
            "label": "Bottleneck Relief (+units)",
            "helpText": "Temporary added capacity applied to the current constraint so you can estimate whether extra people, equipment, or parallel slots would stabilize flow.",
            "type": "number",
            "min": 0,
            "max": 6,
            "step": 1,
            "defaultValue": 1
          }
        ]
      },
      {
        "groupId": "demand",
        "label": "Demand",
        "fields": [
          {
            "key": "demandMultiplier",
            "label": "Demand Multiplier",
            "helpText": "Scales incoming demand versus the baseline plan. Use it to test demand surges or lighter-than-expected loading.",
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
            "helpText": "Shifts the product or work mix toward earlier or later steps to see how changing mix moves the constraint.",
            "type": "dropdown",
            "options": [
              "balanced",
              "front-loaded",
              "midstream-heavy",
              "back-loaded"
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
            "helpText": "Scales labor capacity across the line relative to baseline staffing.",
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
            "helpText": "Scales available equipment capacity across the line relative to the baseline number of active assets.",
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
            "helpText": "Percent of time capacity is lost to breakdowns, interruptions, or other unplanned stops.",
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
            "helpText": "Increases or decreases setup-related time loss. Use it to test the impact of more frequent changeovers or improved setup control.",
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
            "helpText": "Scales process cycle times up or down across the model relative to baseline.",
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
            "helpText": "Scales process variability. Higher variability makes queues and unstable flow more likely even when average capacity looks acceptable.",
            "type": "slider",
            "min": 0.6,
            "max": 1.7,
            "step": 0.05,
            "unit": "x",
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
      },
      {
        "key": "totalWipQty",
        "label": "Total WIP",
        "format": "number",
        "decimals": 0
      },
      {
        "key": "totalCompletedOutputPieces",
        "label": "Total Completed Output Pieces",
        "format": "number",
        "decimals": 0
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
      "name": "Discharge Flow Forecast",
      "units": "minutes",
      "source": "User-provided VSM image (strict transcription, 2026-03-12)"
    },
    "nodes": [
      {
        "id": "stage_a",
        "label": "Order entry and RN awareness",
        "type": "process",
        "boxData": {
          "ctRaw": "5 min",
          "changeoverRaw": null,
          "waitRaw": "20 min",
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Stage A",
            "Resources: Provider pool (2), RN pool (5)",
            "Total: 25 min"
          ]
        }
      },
      {
        "id": "stage_b",
        "label": "RN review and patient clinical prep",
        "type": "process",
        "boxData": {
          "ctRaw": "20 min",
          "changeoverRaw": null,
          "waitRaw": "35 min",
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Stage B",
            "Resources: RN pool (5), Tech pool (2)",
            "Total: 55 min"
          ]
        }
      },
      {
        "id": "stage_c",
        "label": "Discharge clearance and med processing",
        "type": "process",
        "boxData": {
          "ctRaw": "22 min",
          "changeoverRaw": null,
          "waitRaw": "60 min",
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Stage C",
            "Resources: RN pool (5), Provider pool (2), Pharmacy pool (1), Case Manager pool (1)",
            "Total: 82 min"
          ]
        }
      },
      {
        "id": "stage_d",
        "label": "Education and paperwork completion",
        "type": "process",
        "boxData": {
          "ctRaw": "23 min",
          "changeoverRaw": null,
          "waitRaw": "25 min",
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Stage D",
            "Resources: RN pool (5), Unit Clerk pool (1)",
            "Total: 48 min"
          ]
        }
      },
      {
        "id": "stage_e",
        "label": "Patient/family departure prep",
        "type": "process",
        "boxData": {
          "ctRaw": "10 min",
          "changeoverRaw": null,
          "waitRaw": "30 min",
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Stage E",
            "Resources: Patient/family, RN pool (5) if support needed",
            "Total: 40 min"
          ]
        }
      },
      {
        "id": "stage_f",
        "label": "Transport and physical exit",
        "type": "process",
        "boxData": {
          "ctRaw": "8 min",
          "changeoverRaw": null,
          "waitRaw": "25 min",
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Stage F",
            "Resources: Transport pool (2), RN pool (5)",
            "Total: 33 min"
          ]
        }
      }
    ],
    "edges": [
      {
        "from": "stage_a",
        "to": "stage_b",
        "probability": 1
      },
      {
        "from": "stage_b",
        "to": "stage_c",
        "probability": 1
      },
      {
        "from": "stage_c",
        "to": "stage_d",
        "probability": 1
      },
      {
        "from": "stage_d",
        "to": "stage_e",
        "probability": 1
      },
      {
        "from": "stage_e",
        "to": "stage_f",
        "probability": 1
      }
    ],
    "startNodes": [
      "stage_a"
    ],
    "endNodes": [
      "stage_f"
    ]
  },
  "masterData": {
    "products": [
      {
        "productId": "patient_discharge",
        "family": "patient-discharge",
        "mixPct": 1,
        "demandRatePerHour": null,
        "batchSize": null,
        "sellingPricePerUnit": 0
      }
    ],
    "sharedResourcePools": [
      {
        "name": "Provider pool",
        "count": 2
      },
      {
        "name": "RN pool",
        "count": 5
      },
      {
        "name": "Tech pool",
        "count": 2
      },
      {
        "name": "Pharmacy pool",
        "count": 1
      },
      {
        "name": "Case Manager pool",
        "count": 1
      },
      {
        "name": "Unit Clerk pool",
        "count": 1
      },
      {
        "name": "Transport pool",
        "count": 2
      }
    ],
    "equipment": [
      {
        "equipmentType": "Provider pool",
        "count": 2,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "RN pool",
        "count": 5,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Tech pool",
        "count": 2,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Pharmacy pool",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Case Manager pool",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Unit Clerk pool",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Transport pool",
        "count": 2,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      }
    ],
    "processing": [
      {
        "stepId": "stage_a",
        "equipmentType": "Provider pool",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 5,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": "20 min"
        },
        "leadTimeMinutes": 20,
        "leadTimeRaw": "20 min",
        "parallelProcedures": null,
        "workers": null,
        "resourcesRaw": "Provider pool (2), RN pool (5)",
        "resourcePools": [
          {
            "name": "Provider pool",
            "count": 2,
            "optional": false,
            "external": false
          },
          {
            "name": "RN pool",
            "count": 5,
            "optional": false,
            "external": false
          }
        ],
        "sourcePtRaw": "5 min",
        "sourceText": "PT 5 min; WT 20 min; Total 25 min"
      },
      {
        "stepId": "stage_b",
        "equipmentType": "RN pool",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 20,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": "35 min"
        },
        "leadTimeMinutes": 35,
        "leadTimeRaw": "35 min",
        "parallelProcedures": null,
        "workers": null,
        "resourcesRaw": "RN pool (5), Tech pool (2)",
        "resourcePools": [
          {
            "name": "RN pool",
            "count": 5,
            "optional": false,
            "external": false
          },
          {
            "name": "Tech pool",
            "count": 2,
            "optional": false,
            "external": false
          }
        ],
        "sourcePtRaw": "20 min",
        "sourceText": "PT 20 min; WT 35 min; Total 55 min"
      },
      {
        "stepId": "stage_c",
        "equipmentType": "RN pool",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 22,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": "60 min"
        },
        "leadTimeMinutes": 60,
        "leadTimeRaw": "60 min",
        "parallelProcedures": null,
        "workers": null,
        "resourcesRaw": "RN pool (5), Provider pool (2), Pharmacy pool (1), Case Manager pool (1)",
        "resourcePools": [
          {
            "name": "RN pool",
            "count": 5,
            "optional": false,
            "external": false
          },
          {
            "name": "Provider pool",
            "count": 2,
            "optional": false,
            "external": false
          },
          {
            "name": "Pharmacy pool",
            "count": 1,
            "optional": false,
            "external": false
          },
          {
            "name": "Case Manager pool",
            "count": 1,
            "optional": false,
            "external": false
          }
        ],
        "sourcePtRaw": "22 min",
        "sourceText": "PT 22 min; WT 60 min; Total 82 min"
      },
      {
        "stepId": "stage_d",
        "equipmentType": "RN pool",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 23,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": "25 min"
        },
        "leadTimeMinutes": 25,
        "leadTimeRaw": "25 min",
        "parallelProcedures": null,
        "workers": null,
        "resourcesRaw": "RN pool (5), Unit Clerk pool (1)",
        "resourcePools": [
          {
            "name": "RN pool",
            "count": 5,
            "optional": false,
            "external": false
          },
          {
            "name": "Unit Clerk pool",
            "count": 1,
            "optional": false,
            "external": false
          }
        ],
        "sourcePtRaw": "23 min",
        "sourceText": "PT 23 min; WT 25 min; Total 48 min"
      },
      {
        "stepId": "stage_e",
        "equipmentType": "RN pool",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 10,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": "30 min"
        },
        "leadTimeMinutes": 30,
        "leadTimeRaw": "30 min",
        "parallelProcedures": null,
        "workers": null,
        "resourcesRaw": "Patient/family, RN pool (5) if support needed",
        "resourcePools": [
          {
            "name": "Patient/family",
            "count": null,
            "optional": false,
            "external": true
          },
          {
            "name": "RN pool",
            "count": 5,
            "optional": true,
            "external": false
          }
        ],
        "sourcePtRaw": "10 min",
        "sourceText": "PT 10 min; WT 30 min; Total 40 min"
      },
      {
        "stepId": "stage_f",
        "equipmentType": "Transport pool",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 8,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": "25 min"
        },
        "leadTimeMinutes": 25,
        "leadTimeRaw": "25 min",
        "parallelProcedures": null,
        "workers": null,
        "resourcesRaw": "Transport pool (2), RN pool (5)",
        "resourcePools": [
          {
            "name": "Transport pool",
            "count": 2,
            "optional": false,
            "external": false
          },
          {
            "name": "RN pool",
            "count": 5,
            "optional": false,
            "external": false
          }
        ],
        "sourcePtRaw": "8 min",
        "sourceText": "PT 8 min; WT 25 min; Total 33 min"
      }
    ],
    "assumptions": [
      {
        "id": "strict-001",
        "severity": "warning",
        "text": "Changeover times are not shown anywhere in the source image, so changeover is null for all steps."
      },
      {
        "id": "strict-002",
        "severity": "warning",
        "text": "Visible counts are shared pool sizes, not step-dedicated worker counts; workers are set to null for all steps."
      },
      {
        "id": "strict-003",
        "severity": "warning",
        "text": "The source image does not show explicit parallel procedures or dedicated stations per step; parallelProcedures is set to null in strict transcription."
      },
      {
        "id": "strict-004",
        "severity": "warning",
        "text": "Patient/family is visible as a participant in Stage E but does not include a numeric staffed capacity count."
      },
      {
        "id": "strict-005",
        "severity": "blocker",
        "text": "Demand rate, shift calendar, uptime, variability, and resource-sharing rules across stages are not visible in the source image."
      }
    ]
  },
  "compiledForecastModel": {
    "version": "0.3.0",
    "generatedAt": "2026-03-12T21:40:57.855Z",
    "metadata": {
      "name": "Discharge Flow Forecast",
      "units": "per-hour",
      "mode": "constraint-forecast-non-des"
    },
    "graph": {
      "metadata": {
        "name": "Discharge Flow Forecast",
        "units": "minutes",
        "source": "User-provided VSM image (strict transcription, 2026-03-12)"
      },
      "nodes": [
        {
          "id": "stage_a",
          "label": "Order entry and RN awareness",
          "type": "process",
          "boxData": {
            "ctRaw": "5 min",
            "changeoverRaw": null,
            "waitRaw": "20 min",
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Stage A",
              "Resources: Provider pool (2), RN pool (5)",
              "Total: 25 min"
            ]
          }
        },
        {
          "id": "stage_b",
          "label": "RN review and patient clinical prep",
          "type": "process",
          "boxData": {
            "ctRaw": "20 min",
            "changeoverRaw": null,
            "waitRaw": "35 min",
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Stage B",
              "Resources: RN pool (5), Tech pool (2)",
              "Total: 55 min"
            ]
          }
        },
        {
          "id": "stage_c",
          "label": "Discharge clearance and med processing",
          "type": "process",
          "boxData": {
            "ctRaw": "22 min",
            "changeoverRaw": null,
            "waitRaw": "60 min",
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Stage C",
              "Resources: RN pool (5), Provider pool (2), Pharmacy pool (1), Case Manager pool (1)",
              "Total: 82 min"
            ]
          }
        },
        {
          "id": "stage_d",
          "label": "Education and paperwork completion",
          "type": "process",
          "boxData": {
            "ctRaw": "23 min",
            "changeoverRaw": null,
            "waitRaw": "25 min",
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Stage D",
              "Resources: RN pool (5), Unit Clerk pool (1)",
              "Total: 48 min"
            ]
          }
        },
        {
          "id": "stage_e",
          "label": "Patient/family departure prep",
          "type": "process",
          "boxData": {
            "ctRaw": "10 min",
            "changeoverRaw": null,
            "waitRaw": "30 min",
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Stage E",
              "Resources: Patient/family, RN pool (5) if support needed",
              "Total: 40 min"
            ]
          }
        },
        {
          "id": "stage_f",
          "label": "Transport and physical exit",
          "type": "process",
          "boxData": {
            "ctRaw": "8 min",
            "changeoverRaw": null,
            "waitRaw": "25 min",
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Stage F",
              "Resources: Transport pool (2), RN pool (5)",
              "Total: 33 min"
            ]
          }
        }
      ],
      "edges": [
        {
          "from": "stage_a",
          "to": "stage_b",
          "probability": 1
        },
        {
          "from": "stage_b",
          "to": "stage_c",
          "probability": 1
        },
        {
          "from": "stage_c",
          "to": "stage_d",
          "probability": 1
        },
        {
          "from": "stage_d",
          "to": "stage_e",
          "probability": 1
        },
        {
          "from": "stage_e",
          "to": "stage_f",
          "probability": 1
        }
      ],
      "startNodes": [
        "stage_a"
      ],
      "endNodes": [
        "stage_f"
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
          "front-loaded",
          "midstream-heavy",
          "back-loaded"
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
        "defaultValue": 0,
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
        "min": 0,
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
        "defaultValue": "24",
        "options": [
          {
            "label": "8 hrs",
            "value": "8"
          },
          {
            "label": "16 hrs",
            "value": "16"
          },
          {
            "label": "24 hrs",
            "value": "24"
          },
          {
            "label": "1 week",
            "value": "168"
          },
          {
            "label": "1 month",
            "value": "720"
          }
        ]
      },
      {
        "key": "activeShiftCount",
        "label": "Operating Shifts",
        "type": "select",
        "defaultValue": "3",
        "options": [
          {
            "label": "1 shift",
            "value": "1"
          },
          {
            "label": "2 shifts",
            "value": "2"
          },
          {
            "label": "3 shifts",
            "value": "3"
          }
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
      },
      {
        "key": "sellingPricePerUnit",
        "label": "Selling Price / Unit",
        "type": "number",
        "defaultValue": 0,
        "min": 0,
        "max": 100000,
        "step": 0.01
      }
    ],
    "inputDefaults": {
      "demandRatePerHour": 21.6,
      "demandMultiplier": 1,
      "mixProfile": "balanced",
      "staffingMultiplier": 1,
      "equipmentMultiplier": 1,
      "unplannedDowntimePct": 0,
      "ctMultiplier": 1,
      "setupPenaltyMultiplier": 1,
      "variabilityMultiplier": 1,
      "simulationHorizonHours": "24",
      "activeShiftCount": "3",
      "bottleneckReliefUnits": 1,
      "sellingPricePerUnit": 0
    },
    "stepModels": [
      {
        "stepId": "stage_a",
        "label": "Order entry and RN awareness",
        "equipmentType": "Provider pool",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 2,
        "ctMinutes": 5,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 20,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 5,
        "effectiveCapacityPerHour": 24,
        "baseline": {
          "demandRatePerHour": 21.6,
          "utilization": 0.9,
          "headroom": 0.1,
          "queueRisk": 0.81,
          "bottleneckIndex": 0.675,
          "status": "risk"
        }
      },
      {
        "stepId": "stage_b",
        "label": "RN review and patient clinical prep",
        "equipmentType": "RN pool",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 2,
        "ctMinutes": 20,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 35,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 20,
        "effectiveCapacityPerHour": 6,
        "baseline": {
          "demandRatePerHour": 21.6,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 1,
          "status": "critical"
        }
      },
      {
        "stepId": "stage_c",
        "label": "Discharge clearance and med processing",
        "equipmentType": "RN pool",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 22,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 60,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 22,
        "effectiveCapacityPerHour": 2.7273,
        "baseline": {
          "demandRatePerHour": 21.6,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 1,
          "status": "critical"
        }
      },
      {
        "stepId": "stage_d",
        "label": "Education and paperwork completion",
        "equipmentType": "RN pool",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 23,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 25,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 23,
        "effectiveCapacityPerHour": 2.6087,
        "baseline": {
          "demandRatePerHour": 21.6,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 1,
          "status": "critical"
        }
      },
      {
        "stepId": "stage_e",
        "label": "Patient/family departure prep",
        "equipmentType": "RN pool",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 10,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 30,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 10,
        "effectiveCapacityPerHour": 6,
        "baseline": {
          "demandRatePerHour": 21.6,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 1,
          "status": "critical"
        }
      },
      {
        "stepId": "stage_f",
        "label": "Transport and physical exit",
        "equipmentType": "Transport pool",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 2,
        "ctMinutes": 8,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 25,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 8,
        "effectiveCapacityPerHour": 15,
        "baseline": {
          "demandRatePerHour": 21.6,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 0.944,
          "status": "critical"
        }
      }
    ],
    "baseline": {
      "demandRatePerHour": 21.6,
      "lineCapacityPerHour": 2.6087,
      "bottleneckStepId": "stage_d",
      "globalMetrics": {
        "throughput": 2.6087,
        "globalThroughput": 2.6087,
        "forecastThroughput": 2.6087,
        "throughputDelta": 0,
        "bottleneckMigration": "baseline only",
        "bottleneckIndex": 1,
        "brittleness": 1,
        "avgQueueRisk": 0.9683,
        "totalWipQty": 2037.2753,
        "worstCaseTouchTime": 88,
        "totalLeadTimeMinutes": 3907.7593,
        "leadTimeDeltaMinutes": 0,
        "waitSharePct": 0.0499,
        "leadTimeTopContributor": "Education and paperwork completion"
      },
      "nodeMetrics": {
        "stage_a": {
          "utilization": 0.9,
          "headroom": 0.1,
          "queueRisk": 0.81,
          "queueDepth": 11.26,
          "wipQty": 11.26,
          "completedQty": 0,
          "leadTimeMinutes": 53.15,
          "capacityPerHour": 24,
          "bottleneckIndex": 0.675,
          "bottleneckFlag": false,
          "status": "risk"
        },
        "stage_b": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 32.44,
          "wipQty": 406.84,
          "completedQty": 0,
          "leadTimeMinutes": 379.4,
          "capacityPerHour": 6,
          "bottleneckIndex": 1,
          "bottleneckFlag": false,
          "status": "critical"
        },
        "stage_c": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 62.6794,
          "wipQty": 515.6242,
          "completedQty": 0,
          "leadTimeMinutes": 1460.934,
          "capacityPerHour": 2.7273,
          "bottleneckIndex": 1,
          "bottleneckFlag": false,
          "status": "critical"
        },
        "stage_d": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 65.1999,
          "wipQty": 520.9911,
          "completedQty": 0,
          "leadTimeMinutes": 1547.5953,
          "capacityPerHour": 2.6087,
          "bottleneckIndex": 1,
          "bottleneckFlag": true,
          "status": "critical"
        },
        "stage_e": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 32.44,
          "wipQty": 406.84,
          "completedQty": 0,
          "leadTimeMinutes": 364.4,
          "capacityPerHour": 6,
          "bottleneckIndex": 1,
          "bottleneckFlag": false,
          "status": "critical"
        },
        "stage_f": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 17.32,
          "wipQty": 175.72,
          "completedQty": 0,
          "leadTimeMinutes": 102.28,
          "capacityPerHour": 15,
          "bottleneckIndex": 0.944,
          "bottleneckFlag": false,
          "status": "critical"
        }
      }
    },
    "assumptions": [
      {
        "id": "strict-001",
        "severity": "warning",
        "text": "Changeover times are not shown anywhere in the source image, so changeover is null for all steps."
      },
      {
        "id": "strict-002",
        "severity": "warning",
        "text": "Visible counts are shared pool sizes, not step-dedicated worker counts; workers are set to null for all steps."
      },
      {
        "id": "strict-003",
        "severity": "warning",
        "text": "The source image does not show explicit parallel procedures or dedicated stations per step; parallelProcedures is set to null in strict transcription."
      },
      {
        "id": "strict-004",
        "severity": "warning",
        "text": "Patient/family is visible as a participant in Stage E but does not include a numeric staffed capacity count."
      },
      {
        "id": "strict-005",
        "severity": "blocker",
        "text": "Demand rate, shift calendar, uptime, variability, and resource-sharing rules across stages are not visible in the source image."
      },
      {
        "id": "compile-001",
        "severity": "warning",
        "text": "Demand rate is not shown in the source image; baseline demandRatePerHour is seeded at 90% of computed release capacity from the start step."
      },
      {
        "id": "compile-002",
        "severity": "warning",
        "text": "The source image does not show a shift calendar; activeShiftCount defaults to 3 so runtime capacity reflects continuous daily availability unless the user overrides it."
      },
      {
        "id": "compile-003",
        "severity": "warning",
        "text": "Step-level variability is not shown in the source image; baseline variabilityCv defaults to 0.18 for all steps."
      },
      {
        "id": "compile-004",
        "severity": "warning",
        "text": "Where explicit parallel procedures are not shown, forecast capacity uses the minimum visible required shared-pool count at that step as the concurrency assumption."
      },
      {
        "id": "compile-005",
        "severity": "warning",
        "text": "Where no explicit parallel procedure count is shown and visible resources are optional or external, forecast capacity assumes one concurrent service unit for that step."
      },
      {
        "id": "compile-006",
        "severity": "info",
        "text": "Queue risk, bottleneck index, brittleness, and migration outputs are deterministic non-DES forecast heuristics for rapid recompute."
      }
    ]
  },
  "operationalDiagnosis": {
    "status": "overloaded",
    "statusSummary": "Discharge clearance and med processing is no longer clearing work at the required rate. The system is effectively overloaded, so queue and WIP growth will continue until load is reduced or capacity is added.",
    "primaryConstraint": "Discharge clearance and med processing is the current constraint, and downstream congestion at Education and paperwork completion is preventing that queue from clearing cleanly.",
    "constraintMechanism": "Discharge clearance and med processing is not failing in isolation. Education and paperwork completion is also congested, so downstream WIP is not clearing fast enough and the blockage propagates back upstream.",
    "downstreamEffects": "Throughput is running about 88% below required rate, WIP has built to roughly 460 units, total lead time is now about 2592.2 minutes, and operators should expect more expediting, rescheduling, and service risk if this state persists.",
    "economicInterpretation": "This is creating hidden capacity loss of roughly 88% versus required output. The likely business impact is overtime pressure, slower inventory availability, and missed throughput that has to be recovered later.",
    "recommendedAction": "Stabilize the handoff between Discharge clearance and med processing and Education and paperwork completion first. Clear downstream WIP before releasing more work, and rebalance labor by queue pressure instead of fixed headcount.",
    "scenarioGuidance": "The current relief scenario is directionally right. It improves throughput by about 0.119 units/hr, and it also changes bottleneck behavior to Education and paperwork completion -> Discharge clearance and med processing (low confidence).",
    "aiOpportunityLens": {
      "dataAlreadyExists": "Utilization, queue, WIP, and lead-time data already exist here but are usually reviewed as separate metrics instead of as one flow signal.",
      "manualPatternDecisions": "Labor rebalance, release timing, and expediting decisions are still manual even though the patterns are repetitive and detectable from the same simulation outputs.",
      "predictiveGap": "Most current reporting is backward-looking. The diagnosis should be used to flag where the next queue spike or throughput miss is likely before the floor feels it.",
      "tribalKnowledge": "If step recovery depends on supervisor memory, shift handoff notes, or email threads, that is acting like an unstructured operating database.",
      "visibilityGap": "When operators cannot see where queue pressure will propagate next, the business leaks profit through avoidable delay, premium labor, and hidden capacity loss."
    },
    "confidence": "low",
    "confidenceNote": "Confidence is low because key inputs are incomplete. Missing or weak fields: changeover/setup times, staffing/equipment counts, parallel procedures, demand rate/product mix, shift hours/uptime."
  },
  "scenarioCommitted": {
    "demandRatePerHour": 21.6,
    "demandMultiplier": 1,
    "mixProfile": "balanced",
    "staffingMultiplier": 1,
    "equipmentMultiplier": 1,
    "unplannedDowntimePct": 0,
    "ctMultiplier": 1,
    "setupPenaltyMultiplier": 1,
    "variabilityMultiplier": 1,
    "simulationHorizonHours": "24",
    "bottleneckReliefUnits": 1,
    "sellingPricePerUnit": 0,
    "activeShiftCount": "3"
  }
};
window.__EXPORT_COMMITTED_SCENARIO__ = window.__EXPORT_BUNDLE_DATA__.scenarioCommitted;
