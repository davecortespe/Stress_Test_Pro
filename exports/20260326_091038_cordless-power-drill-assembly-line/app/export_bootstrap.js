window.__EXPORT_BUNDLE_DATA__ = {
  "dashboardConfig": {
    "appTitle": "Cordless Power Drill Assembly Line",
    "subtitle": "FlowStress Dynamics™ | Non-DES Rapid Flow Simulation",
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
            "defaultValue": "1"
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
        "label": "Forecast Output / hr",
        "helpText": "Estimated completed output rate per hour under the current scenario settings and elapsed-time state.",
        "format": "number",
        "decimals": 1
      },
      {
        "key": "bottleneckIndex",
        "label": "Constraint Pressure",
        "helpText": "Constraint pressure score (0-100%). Higher values mean tighter capacity and higher risk of flow breakage.",
        "format": "percent",
        "decimals": 0
      },
      {
        "key": "totalWipQty",
        "label": "WIP Load",
        "helpText": "Total work-in-process currently in the system (queue plus in-process load across all steps).",
        "format": "number",
        "decimals": 0
      },
      {
        "key": "throughputDelta",
        "label": "Relief vs Baseline",
        "helpText": "Change in throughput per hour versus baseline after applying bottleneck relief settings.",
        "format": "delta",
        "decimals": 1
      },
      {
        "key": "bottleneckMigration",
        "label": "Bottleneck Move",
        "helpText": "Shows where the active constraint is predicted to move after applying current relief settings.",
        "format": "text"
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
      "name": "Cordless Power Drill Assembly Line",
      "units": "minutes",
      "source": "User-provided VSM image (strict transcription)"
    },
    "nodes": [
      {
        "id": "housing_kit_prep",
        "label": "Housing Kit Prep",
        "type": "process",
        "boxData": {
          "stageRaw": "A",
          "stepDescriptionRaw": "Pick plastic shells, screws, trigger, labels, and hardware kit",
          "ctRaw": "2",
          "changeoverRaw": "8",
          "waitRaw": "15",
          "equipmentCountRaw": "1",
          "peopleNeededRaw": "1",
          "shiftCountRaw": "1",
          "lotSizeRaw": "20",
          "reworkPctRaw": "1%",
          "equipmentReliabilityRaw": "99%",
          "notesRaw": [
            "Fast feeder step"
          ]
        }
      },
      {
        "id": "motor_assembly",
        "label": "Motor Assembly",
        "type": "process",
        "boxData": {
          "stageRaw": "B",
          "stepDescriptionRaw": "Prepare motor, pinion, and mounting plate",
          "ctRaw": "4",
          "changeoverRaw": "10",
          "waitRaw": "28",
          "equipmentCountRaw": "1",
          "peopleNeededRaw": "1",
          "shiftCountRaw": "1",
          "lotSizeRaw": "20",
          "reworkPctRaw": "2%",
          "equipmentReliabilityRaw": "98%",
          "notesRaw": [
            "Stable step"
          ]
        }
      },
      {
        "id": "gearbox_assembly",
        "label": "Gearbox Assembly",
        "type": "process",
        "boxData": {
          "stageRaw": "C",
          "stepDescriptionRaw": "Assemble gearbox, grease gears, install clutch components",
          "ctRaw": "5",
          "changeoverRaw": "12",
          "waitRaw": "35",
          "equipmentCountRaw": "2",
          "peopleNeededRaw": "2",
          "shiftCountRaw": "1",
          "lotSizeRaw": "20",
          "reworkPctRaw": "2%",
          "equipmentReliabilityRaw": "97%",
          "notesRaw": [
            "Moderate complexity"
          ]
        }
      },
      {
        "id": "battery_pack_prep",
        "label": "Battery Pack Prep",
        "type": "process",
        "boxData": {
          "stageRaw": "D",
          "stepDescriptionRaw": "Prepare battery pack, contacts, and fitment check",
          "ctRaw": "3.5",
          "changeoverRaw": "10",
          "waitRaw": "25",
          "equipmentCountRaw": "1",
          "peopleNeededRaw": "1",
          "shiftCountRaw": "1",
          "lotSizeRaw": "20",
          "reworkPctRaw": "2%",
          "equipmentReliabilityRaw": "98%",
          "notesRaw": [
            "Usually keeps up"
          ]
        }
      },
      {
        "id": "final_drill_assembly",
        "label": "Final Drill Assembly",
        "type": "process",
        "boxData": {
          "stageRaw": "E",
          "stepDescriptionRaw": "Join housing, motor, gearbox, trigger, wiring, and battery interface",
          "ctRaw": "11.5",
          "changeoverRaw": "18",
          "waitRaw": "95",
          "equipmentCountRaw": "1",
          "peopleNeededRaw": "2",
          "shiftCountRaw": "1",
          "lotSizeRaw": "20",
          "reworkPctRaw": "5%",
          "equipmentReliabilityRaw": "93%",
          "notesRaw": [
            "Primary bottleneck, long queue likely"
          ]
        }
      },
      {
        "id": "functional_test",
        "label": "Functional Test",
        "type": "process",
        "boxData": {
          "stageRaw": "F",
          "stepDescriptionRaw": "Run spin test, torque test, direction switch test, and electrical check",
          "ctRaw": "8.5",
          "changeoverRaw": "6",
          "waitRaw": "70",
          "equipmentCountRaw": "1",
          "peopleNeededRaw": "1",
          "shiftCountRaw": "1",
          "lotSizeRaw": "20",
          "reworkPctRaw": "7%",
          "equipmentReliabilityRaw": "95%",
          "notesRaw": [
            "High defect screen, feeds rework"
          ]
        }
      },
      {
        "id": "cosmetic_inspection_and_rework",
        "label": "Cosmetic Inspection and Rework",
        "type": "process",
        "boxData": {
          "stageRaw": "G",
          "stepDescriptionRaw": "Inspect fit, label placement, scratches, and minor defects",
          "ctRaw": "4",
          "changeoverRaw": "0",
          "waitRaw": "30",
          "equipmentCountRaw": "1",
          "peopleNeededRaw": "1",
          "shiftCountRaw": "1",
          "lotSizeRaw": "20",
          "reworkPctRaw": "5%",
          "equipmentReliabilityRaw": "99%",
          "notesRaw": [
            "Rework returns mainly to E, sometimes F"
          ]
        }
      },
      {
        "id": "packaging_and_palletizing",
        "label": "Packaging and Palletizing",
        "type": "process",
        "boxData": {
          "stageRaw": "H",
          "stepDescriptionRaw": "Insert manual, charger, battery, box unit, label carton, palletize",
          "ctRaw": "2.5",
          "changeoverRaw": "8",
          "waitRaw": "18",
          "equipmentCountRaw": "1",
          "peopleNeededRaw": "1",
          "shiftCountRaw": "1",
          "lotSizeRaw": "20",
          "reworkPctRaw": "1%",
          "equipmentReliabilityRaw": "99%",
          "notesRaw": [
            "Plenty of downstream capacity"
          ]
        }
      }
    ],
    "edges": [
      {
        "from": "housing_kit_prep",
        "to": "motor_assembly",
        "probability": 1
      },
      {
        "from": "motor_assembly",
        "to": "gearbox_assembly",
        "probability": 1
      },
      {
        "from": "gearbox_assembly",
        "to": "battery_pack_prep",
        "probability": 1
      },
      {
        "from": "battery_pack_prep",
        "to": "final_drill_assembly",
        "probability": 1
      },
      {
        "from": "final_drill_assembly",
        "to": "functional_test",
        "probability": 1
      },
      {
        "from": "functional_test",
        "to": "cosmetic_inspection_and_rework",
        "probability": 1
      },
      {
        "from": "cosmetic_inspection_and_rework",
        "to": "packaging_and_palletizing",
        "probability": 1
      }
    ],
    "startNodes": [
      "housing_kit_prep"
    ],
    "endNodes": [
      "packaging_and_palletizing"
    ]
  },
  "masterData": {
    "products": [
      {
        "productId": "cordless_power_drill",
        "family": "drill",
        "mixPct": 1,
        "demandRatePerHour": null,
        "batchSize": null,
        "sellingPricePerUnit": null
      }
    ],
    "equipment": [
      {
        "equipmentType": "Housing Kit Prep",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Motor Assembly",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Gearbox Assembly",
        "count": 2,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Battery Pack Prep",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Final Drill Assembly",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Functional Test",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Cosmetic Inspection and Rework",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Packaging and Palletizing",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      }
    ],
    "processing": [
      {
        "stepId": "housing_kit_prep",
        "equipmentType": "Housing Kit Prep",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 2,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 8,
              "unit": "min"
            }
          }
        },
        "leadTimeMinutes": 15,
        "leadTimeRaw": "15 min",
        "parallelProcedures": 1,
        "workers": 1,
        "shiftCount": 1,
        "lotSize": 20,
        "reworkPct": 0.01,
        "equipmentReliabilityPct": 0.99,
        "stage": "A",
        "stepDescription": "Pick plastic shells, screws, trigger, labels, and hardware kit",
        "sourceText": "Stage A | Housing Kit Prep | CT 2 min | LT 15 min | C/O 8 min | # of Equipment 1 | People Needed 1 | # of Shifts 1 | Lot Size 20 | Rework 1% | Equipment Reliability 99% | Fast feeder step"
      },
      {
        "stepId": "motor_assembly",
        "equipmentType": "Motor Assembly",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 4,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 10,
              "unit": "min"
            }
          }
        },
        "leadTimeMinutes": 28,
        "leadTimeRaw": "28 min",
        "parallelProcedures": 1,
        "workers": 1,
        "shiftCount": 1,
        "lotSize": 20,
        "reworkPct": 0.02,
        "equipmentReliabilityPct": 0.98,
        "stage": "B",
        "stepDescription": "Prepare motor, pinion, and mounting plate",
        "sourceText": "Stage B | Motor Assembly | CT 4 min | LT 28 min | C/O 10 min | # of Equipment 1 | People Needed 1 | # of Shifts 1 | Lot Size 20 | Rework 2% | Equipment Reliability 98% | Stable step"
      },
      {
        "stepId": "gearbox_assembly",
        "equipmentType": "Gearbox Assembly",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 5,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 12,
              "unit": "min"
            }
          }
        },
        "leadTimeMinutes": 35,
        "leadTimeRaw": "35 min",
        "parallelProcedures": 2,
        "workers": 2,
        "shiftCount": 1,
        "lotSize": 20,
        "reworkPct": 0.02,
        "equipmentReliabilityPct": 0.97,
        "stage": "C",
        "stepDescription": "Assemble gearbox, grease gears, install clutch components",
        "sourceText": "Stage C | Gearbox Assembly | CT 5 min | LT 35 min | C/O 12 min | # of Equipment 2 | People Needed 2 | # of Shifts 1 | Lot Size 20 | Rework 2% | Equipment Reliability 97% | Moderate complexity"
      },
      {
        "stepId": "battery_pack_prep",
        "equipmentType": "Battery Pack Prep",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 3.5,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 10,
              "unit": "min"
            }
          }
        },
        "leadTimeMinutes": 25,
        "leadTimeRaw": "25 min",
        "parallelProcedures": 1,
        "workers": 1,
        "shiftCount": 1,
        "lotSize": 20,
        "reworkPct": 0.02,
        "equipmentReliabilityPct": 0.98,
        "stage": "D",
        "stepDescription": "Prepare battery pack, contacts, and fitment check",
        "sourceText": "Stage D | Battery Pack Prep | CT 3.5 min | LT 25 min | C/O 10 min | # of Equipment 1 | People Needed 1 | # of Shifts 1 | Lot Size 20 | Rework 2% | Equipment Reliability 98% | Usually keeps up"
      },
      {
        "stepId": "final_drill_assembly",
        "equipmentType": "Final Drill Assembly",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 11.5,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 18,
              "unit": "min"
            }
          }
        },
        "leadTimeMinutes": 95,
        "leadTimeRaw": "95 min",
        "parallelProcedures": 1,
        "workers": 2,
        "shiftCount": 1,
        "lotSize": 20,
        "reworkPct": 0.05,
        "equipmentReliabilityPct": 0.93,
        "stage": "E",
        "stepDescription": "Join housing, motor, gearbox, trigger, wiring, and battery interface",
        "sourceText": "Stage E | Final Drill Assembly | CT 11.5 min | LT 95 min | C/O 18 min | # of Equipment 1 | People Needed 2 | # of Shifts 1 | Lot Size 20 | Rework 5% | Equipment Reliability 93% | Primary bottleneck, long queue likely"
      },
      {
        "stepId": "functional_test",
        "equipmentType": "Functional Test",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 8.5,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 6,
              "unit": "min"
            }
          }
        },
        "leadTimeMinutes": 70,
        "leadTimeRaw": "70 min",
        "parallelProcedures": 1,
        "workers": 1,
        "shiftCount": 1,
        "lotSize": 20,
        "reworkPct": 0.07,
        "equipmentReliabilityPct": 0.95,
        "stage": "F",
        "stepDescription": "Run spin test, torque test, direction switch test, and electrical check",
        "sourceText": "Stage F | Functional Test | CT 8.5 min | LT 70 min | C/O 6 min | # of Equipment 1 | People Needed 1 | # of Shifts 1 | Lot Size 20 | Rework 7% | Equipment Reliability 95% | High defect screen, feeds rework"
      },
      {
        "stepId": "cosmetic_inspection_and_rework",
        "equipmentType": "Cosmetic Inspection and Rework",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 4,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 0,
              "unit": "min"
            }
          }
        },
        "leadTimeMinutes": 30,
        "leadTimeRaw": "30 min",
        "parallelProcedures": 1,
        "workers": 1,
        "shiftCount": 1,
        "lotSize": 20,
        "reworkPct": 0.05,
        "equipmentReliabilityPct": 0.99,
        "stage": "G",
        "stepDescription": "Inspect fit, label placement, scratches, and minor defects",
        "sourceText": "Stage G | Cosmetic Inspection and Rework | CT 4 min | LT 30 min | C/O 0 min | # of Equipment 1 | People Needed 1 | # of Shifts 1 | Lot Size 20 | Rework 5% | Equipment Reliability 99% | Rework returns mainly to E, sometimes F"
      },
      {
        "stepId": "packaging_and_palletizing",
        "equipmentType": "Packaging and Palletizing",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 2.5,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 8,
              "unit": "min"
            }
          }
        },
        "leadTimeMinutes": 18,
        "leadTimeRaw": "18 min",
        "parallelProcedures": 1,
        "workers": 1,
        "shiftCount": 1,
        "lotSize": 20,
        "reworkPct": 0.01,
        "equipmentReliabilityPct": 0.99,
        "stage": "H",
        "stepDescription": "Insert manual, charger, battery, box unit, label carton, palletize",
        "sourceText": "Stage H | Packaging and Palletizing | CT 2.5 min | LT 18 min | C/O 8 min | # of Equipment 1 | People Needed 1 | # of Shifts 1 | Lot Size 20 | Rework 1% | Equipment Reliability 99% | Plenty of downstream capacity"
      }
    ],
    "assumptions": [
      {
        "id": "strict-001",
        "severity": "info",
        "text": "The visible VSM title was copied exactly as Cordless Power Drill Assembly Line."
      },
      {
        "id": "strict-002",
        "severity": "info",
        "text": "People Needed was mapped directly to workers because that is the visible staffing field in the image."
      },
      {
        "id": "strict-003",
        "severity": "info",
        "text": "# of Equipment was mapped directly to parallelProcedures / effectiveUnits because that is the visible concurrency field in the image."
      },
      {
        "id": "strict-004",
        "severity": "warning",
        "text": "Hours per shift are not visible in the image, so the forecast calendar still assumes 8 hours per shift when converting shift count to active capacity."
      },
      {
        "id": "strict-005",
        "severity": "warning",
        "text": "Demand rate and product mix are not visible in the image; baseline demand will be inferred in phase 2 from the start-step release capacity."
      },
      {
        "id": "strict-006",
        "severity": "warning",
        "text": "The rework note at Cosmetic Inspection and Rework is visible, but the routing split back to Final Drill Assembly versus Functional Test is not numeric, so the forecast model keeps the main left-to-right chain only."
      }
    ]
  },
  "compiledForecastModel": {
    "version": "0.3.0",
    "generatedAt": "2026-03-26T13:09:29.245Z",
    "metadata": {
      "name": "Cordless Power Drill Assembly Line",
      "units": "per-hour",
      "mode": "constraint-forecast-non-des"
    },
    "graph": {
      "metadata": {
        "name": "Cordless Power Drill Assembly Line",
        "units": "minutes",
        "source": "User-provided VSM image (strict transcription)"
      },
      "nodes": [
        {
          "id": "housing_kit_prep",
          "label": "Housing Kit Prep",
          "type": "process",
          "boxData": {
            "stageRaw": "A",
            "stepDescriptionRaw": "Pick plastic shells, screws, trigger, labels, and hardware kit",
            "ctRaw": "2",
            "changeoverRaw": "8",
            "waitRaw": "15",
            "equipmentCountRaw": "1",
            "peopleNeededRaw": "1",
            "shiftCountRaw": "1",
            "lotSizeRaw": "20",
            "reworkPctRaw": "1%",
            "equipmentReliabilityRaw": "99%",
            "notesRaw": [
              "Fast feeder step"
            ]
          }
        },
        {
          "id": "motor_assembly",
          "label": "Motor Assembly",
          "type": "process",
          "boxData": {
            "stageRaw": "B",
            "stepDescriptionRaw": "Prepare motor, pinion, and mounting plate",
            "ctRaw": "4",
            "changeoverRaw": "10",
            "waitRaw": "28",
            "equipmentCountRaw": "1",
            "peopleNeededRaw": "1",
            "shiftCountRaw": "1",
            "lotSizeRaw": "20",
            "reworkPctRaw": "2%",
            "equipmentReliabilityRaw": "98%",
            "notesRaw": [
              "Stable step"
            ]
          }
        },
        {
          "id": "gearbox_assembly",
          "label": "Gearbox Assembly",
          "type": "process",
          "boxData": {
            "stageRaw": "C",
            "stepDescriptionRaw": "Assemble gearbox, grease gears, install clutch components",
            "ctRaw": "5",
            "changeoverRaw": "12",
            "waitRaw": "35",
            "equipmentCountRaw": "2",
            "peopleNeededRaw": "2",
            "shiftCountRaw": "1",
            "lotSizeRaw": "20",
            "reworkPctRaw": "2%",
            "equipmentReliabilityRaw": "97%",
            "notesRaw": [
              "Moderate complexity"
            ]
          }
        },
        {
          "id": "battery_pack_prep",
          "label": "Battery Pack Prep",
          "type": "process",
          "boxData": {
            "stageRaw": "D",
            "stepDescriptionRaw": "Prepare battery pack, contacts, and fitment check",
            "ctRaw": "3.5",
            "changeoverRaw": "10",
            "waitRaw": "25",
            "equipmentCountRaw": "1",
            "peopleNeededRaw": "1",
            "shiftCountRaw": "1",
            "lotSizeRaw": "20",
            "reworkPctRaw": "2%",
            "equipmentReliabilityRaw": "98%",
            "notesRaw": [
              "Usually keeps up"
            ]
          }
        },
        {
          "id": "final_drill_assembly",
          "label": "Final Drill Assembly",
          "type": "process",
          "boxData": {
            "stageRaw": "E",
            "stepDescriptionRaw": "Join housing, motor, gearbox, trigger, wiring, and battery interface",
            "ctRaw": "11.5",
            "changeoverRaw": "18",
            "waitRaw": "95",
            "equipmentCountRaw": "1",
            "peopleNeededRaw": "2",
            "shiftCountRaw": "1",
            "lotSizeRaw": "20",
            "reworkPctRaw": "5%",
            "equipmentReliabilityRaw": "93%",
            "notesRaw": [
              "Primary bottleneck, long queue likely"
            ]
          }
        },
        {
          "id": "functional_test",
          "label": "Functional Test",
          "type": "process",
          "boxData": {
            "stageRaw": "F",
            "stepDescriptionRaw": "Run spin test, torque test, direction switch test, and electrical check",
            "ctRaw": "8.5",
            "changeoverRaw": "6",
            "waitRaw": "70",
            "equipmentCountRaw": "1",
            "peopleNeededRaw": "1",
            "shiftCountRaw": "1",
            "lotSizeRaw": "20",
            "reworkPctRaw": "7%",
            "equipmentReliabilityRaw": "95%",
            "notesRaw": [
              "High defect screen, feeds rework"
            ]
          }
        },
        {
          "id": "cosmetic_inspection_and_rework",
          "label": "Cosmetic Inspection and Rework",
          "type": "process",
          "boxData": {
            "stageRaw": "G",
            "stepDescriptionRaw": "Inspect fit, label placement, scratches, and minor defects",
            "ctRaw": "4",
            "changeoverRaw": "0",
            "waitRaw": "30",
            "equipmentCountRaw": "1",
            "peopleNeededRaw": "1",
            "shiftCountRaw": "1",
            "lotSizeRaw": "20",
            "reworkPctRaw": "5%",
            "equipmentReliabilityRaw": "99%",
            "notesRaw": [
              "Rework returns mainly to E, sometimes F"
            ]
          }
        },
        {
          "id": "packaging_and_palletizing",
          "label": "Packaging and Palletizing",
          "type": "process",
          "boxData": {
            "stageRaw": "H",
            "stepDescriptionRaw": "Insert manual, charger, battery, box unit, label carton, palletize",
            "ctRaw": "2.5",
            "changeoverRaw": "8",
            "waitRaw": "18",
            "equipmentCountRaw": "1",
            "peopleNeededRaw": "1",
            "shiftCountRaw": "1",
            "lotSizeRaw": "20",
            "reworkPctRaw": "1%",
            "equipmentReliabilityRaw": "99%",
            "notesRaw": [
              "Plenty of downstream capacity"
            ]
          }
        }
      ],
      "edges": [
        {
          "from": "housing_kit_prep",
          "to": "motor_assembly",
          "probability": 1
        },
        {
          "from": "motor_assembly",
          "to": "gearbox_assembly",
          "probability": 1
        },
        {
          "from": "gearbox_assembly",
          "to": "battery_pack_prep",
          "probability": 1
        },
        {
          "from": "battery_pack_prep",
          "to": "final_drill_assembly",
          "probability": 1
        },
        {
          "from": "final_drill_assembly",
          "to": "functional_test",
          "probability": 1
        },
        {
          "from": "functional_test",
          "to": "cosmetic_inspection_and_rework",
          "probability": 1
        },
        {
          "from": "cosmetic_inspection_and_rework",
          "to": "packaging_and_palletizing",
          "probability": 1
        }
      ],
      "startNodes": [
        "housing_kit_prep"
      ],
      "endNodes": [
        "packaging_and_palletizing"
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
        "defaultValue": "1",
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
        "key": "shiftDurationHours",
        "label": "Shift Duration (hours)",
        "type": "number",
        "defaultValue": 8,
        "min": 1,
        "max": 24,
        "step": 1
      },
      {
        "key": "shiftStartHour",
        "label": "Shift Start Hour",
        "type": "number",
        "defaultValue": 0,
        "min": 0,
        "max": 23,
        "step": 1
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
      "demandRatePerHour": 22.5,
      "demandMultiplier": 1,
      "mixProfile": "balanced",
      "staffingMultiplier": 1,
      "equipmentMultiplier": 1,
      "unplannedDowntimePct": 0,
      "ctMultiplier": 1,
      "setupPenaltyMultiplier": 1,
      "variabilityMultiplier": 1,
      "simulationHorizonHours": "24",
      "activeShiftCount": "1",
      "shiftDurationHours": 8,
      "shiftStartHour": 0,
      "bottleneckReliefUnits": 1,
      "sellingPricePerUnit": 0
    },
    "stepModels": [
      {
        "stepId": "housing_kit_prep",
        "label": "Housing Kit Prep",
        "equipmentType": "Housing Kit Prep",
        "workerCount": 1,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 2,
        "changeoverMinutes": 8,
        "changeoverPenaltyPerUnitMinutes": 0.4,
        "leadTimeMinutes": 15,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 2.4,
        "effectiveCapacityPerHour": 25,
        "baseline": {
          "demandRatePerHour": 22.5,
          "utilization": 0.9,
          "headroom": 0.1,
          "queueRisk": 0.9,
          "bottleneckIndex": 0.9,
          "status": "critical"
        }
      },
      {
        "stepId": "motor_assembly",
        "label": "Motor Assembly",
        "equipmentType": "Motor Assembly",
        "workerCount": 1,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 4,
        "changeoverMinutes": 10,
        "changeoverPenaltyPerUnitMinutes": 0.5,
        "leadTimeMinutes": 28,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 4.5,
        "effectiveCapacityPerHour": 13.3333,
        "baseline": {
          "demandRatePerHour": 22.5,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 1,
          "status": "critical"
        }
      },
      {
        "stepId": "gearbox_assembly",
        "label": "Gearbox Assembly",
        "equipmentType": "Gearbox Assembly",
        "workerCount": 2,
        "parallelProcedures": 2,
        "effectiveUnits": 2,
        "ctMinutes": 5,
        "changeoverMinutes": 12,
        "changeoverPenaltyPerUnitMinutes": 0.6,
        "leadTimeMinutes": 35,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 5.6,
        "effectiveCapacityPerHour": 21.4286,
        "baseline": {
          "demandRatePerHour": 22.5,
          "utilization": 1.05,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 1,
          "status": "critical"
        }
      },
      {
        "stepId": "battery_pack_prep",
        "label": "Battery Pack Prep",
        "equipmentType": "Battery Pack Prep",
        "workerCount": 1,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 3.5,
        "changeoverMinutes": 10,
        "changeoverPenaltyPerUnitMinutes": 0.5,
        "leadTimeMinutes": 25,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 4,
        "effectiveCapacityPerHour": 15,
        "baseline": {
          "demandRatePerHour": 22.5,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 1,
          "status": "critical"
        }
      },
      {
        "stepId": "final_drill_assembly",
        "label": "Final Drill Assembly",
        "equipmentType": "Final Drill Assembly",
        "workerCount": 2,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 11.5,
        "changeoverMinutes": 18,
        "changeoverPenaltyPerUnitMinutes": 0.9,
        "leadTimeMinutes": 95,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 12.4,
        "effectiveCapacityPerHour": 4.8387,
        "baseline": {
          "demandRatePerHour": 22.5,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 1,
          "status": "critical"
        }
      },
      {
        "stepId": "functional_test",
        "label": "Functional Test",
        "equipmentType": "Functional Test",
        "workerCount": 1,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 8.5,
        "changeoverMinutes": 6,
        "changeoverPenaltyPerUnitMinutes": 0.3,
        "leadTimeMinutes": 70,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 8.8,
        "effectiveCapacityPerHour": 6.8182,
        "baseline": {
          "demandRatePerHour": 22.5,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 1,
          "status": "critical"
        }
      },
      {
        "stepId": "cosmetic_inspection_and_rework",
        "label": "Cosmetic Inspection and Rework",
        "equipmentType": "Cosmetic Inspection and Rework",
        "workerCount": 1,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 4,
        "changeoverMinutes": 0,
        "changeoverPenaltyPerUnitMinutes": 0,
        "leadTimeMinutes": 30,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 4,
        "effectiveCapacityPerHour": 15,
        "baseline": {
          "demandRatePerHour": 22.5,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 1,
          "status": "critical"
        }
      },
      {
        "stepId": "packaging_and_palletizing",
        "label": "Packaging and Palletizing",
        "equipmentType": "Packaging and Palletizing",
        "workerCount": 1,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 2.5,
        "changeoverMinutes": 8,
        "changeoverPenaltyPerUnitMinutes": 0.4,
        "leadTimeMinutes": 18,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 2.9,
        "effectiveCapacityPerHour": 20.6897,
        "baseline": {
          "demandRatePerHour": 22.5,
          "utilization": 1.0875,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 1,
          "status": "critical"
        }
      }
    ],
    "baseline": {
      "demandRatePerHour": 22.5,
      "lineCapacityPerHour": 4.8387,
      "bottleneckStepId": "final_drill_assembly",
      "globalMetrics": {
        "throughput": 4.8387,
        "globalThroughput": 4.8387,
        "forecastThroughput": 4.8387,
        "steadyStateThroughput": 4.8387,
        "throughputState": "steady-state",
        "warmupHours": 0,
        "throughputDelta": 0,
        "bottleneckMigration": "baseline only",
        "bottleneckIndex": 1,
        "brittleness": 1,
        "littleLawResidualPct": 0.5683,
        "avgQueueRisk": 0.9875,
        "totalWipQty": 1462.4772,
        "worstCaseTouchTime": 41,
        "totalLeadTimeMinutes": 11563.0363,
        "leadTimeDeltaMinutes": 0,
        "waitSharePct": 0.0273,
        "leadTimeTopContributor": "Final Drill Assembly"
      },
      "nodeMetrics": {
        "housing_kit_prep": {
          "utilization": 0.9,
          "headroom": 0.1,
          "queueRisk": 0.9,
          "queueDepth": 4.1812,
          "wipQty": 5.0812,
          "processedQty": 0,
          "completedQty": 0,
          "leadTimeMinutes": 27.0349,
          "capacityPerHour": 25,
          "bottleneckIndex": 0.9,
          "bottleneckFlag": false,
          "status": "critical"
        },
        "motor_assembly": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 220.0008,
          "wipQty": 221.0008,
          "processedQty": 0,
          "completedQty": 0,
          "leadTimeMinutes": 1022.0061,
          "capacityPerHour": 13.3333,
          "bottleneckIndex": 1,
          "bottleneckFlag": false,
          "status": "critical"
        },
        "gearbox_assembly": {
          "utilization": 1.05,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 25.7136,
          "wipQty": 27.7136,
          "processedQty": 0,
          "completedQty": 0,
          "leadTimeMinutes": 111.998,
          "capacityPerHour": 21.4286,
          "bottleneckIndex": 1,
          "bottleneckFlag": false,
          "status": "critical"
        },
        "battery_pack_prep": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 180,
          "wipQty": 181,
          "processedQty": 0,
          "completedQty": 0,
          "leadTimeMinutes": 748.5,
          "capacityPerHour": 15,
          "bottleneckIndex": 1,
          "bottleneckFlag": false,
          "status": "critical"
        },
        "final_drill_assembly": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 423.8712,
          "wipQty": 424.8712,
          "processedQty": 0,
          "completedQty": 0,
          "leadTimeMinutes": 5362.5134,
          "capacityPerHour": 4.8387,
          "bottleneckIndex": 1,
          "bottleneckFlag": true,
          "status": "critical"
        },
        "functional_test": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 376.3632,
          "wipQty": 377.3632,
          "processedQty": 0,
          "completedQty": 0,
          "leadTimeMinutes": 3390.4873,
          "capacityPerHour": 6.8182,
          "bottleneckIndex": 1,
          "bottleneckFlag": false,
          "status": "critical"
        },
        "cosmetic_inspection_and_rework": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 180,
          "wipQty": 181,
          "processedQty": 0,
          "completedQty": 0,
          "leadTimeMinutes": 754,
          "capacityPerHour": 15,
          "bottleneckIndex": 1,
          "bottleneckFlag": false,
          "status": "critical"
        },
        "packaging_and_palletizing": {
          "utilization": 1.0875,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 43.4472,
          "wipQty": 44.4472,
          "processedQty": 0,
          "completedQty": 0,
          "leadTimeMinutes": 146.4966,
          "capacityPerHour": 20.6897,
          "bottleneckIndex": 1,
          "bottleneckFlag": false,
          "status": "critical"
        }
      }
    },
    "assumptions": [
      {
        "id": "strict-001",
        "severity": "info",
        "text": "The visible VSM title was copied exactly as Cordless Power Drill Assembly Line."
      },
      {
        "id": "strict-002",
        "severity": "info",
        "text": "People Needed was mapped directly to workers because that is the visible staffing field in the image."
      },
      {
        "id": "strict-003",
        "severity": "info",
        "text": "# of Equipment was mapped directly to parallelProcedures / effectiveUnits because that is the visible concurrency field in the image."
      },
      {
        "id": "strict-004",
        "severity": "warning",
        "text": "Hours per shift are not visible in the image, so the forecast calendar still assumes 8 hours per shift when converting shift count to active capacity."
      },
      {
        "id": "strict-005",
        "severity": "warning",
        "text": "Demand rate and product mix are not visible in the image; baseline demand will be inferred in phase 2 from the start-step release capacity."
      },
      {
        "id": "strict-006",
        "severity": "warning",
        "text": "The rework note at Cosmetic Inspection and Rework is visible, but the routing split back to Final Drill Assembly versus Functional Test is not numeric, so the forecast model keeps the main left-to-right chain only."
      },
      {
        "id": "compile-001",
        "severity": "warning",
        "text": "Demand rate is not shown in the source image; baseline demandRatePerHour is seeded at 90% of computed release capacity from the start step."
      },
      {
        "id": "compile-002",
        "severity": "warning",
        "text": "The source image shows a consistent visible shift count of 1; activeShiftCount defaults to that value so runtime capacity aligns with the VSM."
      },
      {
        "id": "compile-003",
        "severity": "warning",
        "text": "Step-level variability is not shown in the source image; baseline variabilityCv defaults to 0.18 for all steps."
      },
      {
        "id": "compile-004",
        "severity": "info",
        "text": "Queue risk is an equivalent single-server wait-probability approximation (P(wait) ~= rho), while bottleneck index, brittleness, and migration remain deterministic non-DES forecast heuristics for rapid recompute."
      }
    ]
  },
  "operationalDiagnosis": {
    "status": "overloaded",
    "shortStatusSummary": "Not clearing - WIP will grow",
    "statusSummary": "Final Drill Assembly is no longer clearing work at the required rate. The system is effectively overloaded, so queue and WIP growth will continue until load is reduced or capacity is added.",
    "constraintStepName": "Final Drill Assembly",
    "primaryConstraint": "Final Drill Assembly is the current constraint, and downstream congestion at Functional Test is preventing that queue from clearing cleanly.",
    "constraintMechanism": "Final Drill Assembly is not failing in isolation. Functional Test is also congested, so downstream WIP is not clearing fast enough and the blockage propagates back upstream.",
    "downstreamEffects": "Throughput is running about 93% below required rate, WIP has built to roughly 501 units, total lead time is now about 4128.6 minutes, and operators should expect more expediting, rescheduling, and service risk if this state persists.",
    "economicInterpretation": "This is creating hidden capacity loss of roughly 93% versus required output. The likely business impact is overtime pressure, slower inventory availability, and missed throughput that has to be recovered later.",
    "recommendedAction": "Stabilize the handoff between Final Drill Assembly and Functional Test first. Clear downstream WIP before releasing more work, and rebalance labor by queue pressure instead of fixed headcount.",
    "scenarioGuidance": "The current relief scenario is directionally right. It improves throughput by about 0.660 units/hr, and it also changes bottleneck behavior to Final Drill Assembly -> Functional Test (low confidence).",
    "demandRatePerHour": 22.5,
    "outputRatePerHour": 4.8387,
    "missingFields": [
      "shift hours/uptime",
      "demand rate/product mix"
    ],
    "aiOpportunityLens": {
      "dataAlreadyExists": "Utilization, queue, WIP, and lead-time data already exist here but are usually reviewed as separate metrics instead of as one flow signal.",
      "manualPatternDecisions": "Labor rebalance, release timing, and expediting decisions are still manual even though the patterns are repetitive and detectable from the same simulation outputs.",
      "predictiveGap": "Most current reporting is backward-looking. The diagnosis should be used to flag where the next queue spike or throughput miss is likely before the floor feels it.",
      "tribalKnowledge": "If step recovery depends on supervisor memory, shift handoff notes, or email threads, that is acting like an unstructured operating database.",
      "visibilityGap": "When operators cannot see where queue pressure will propagate next, the business leaks profit through avoidable delay, premium labor, and hidden capacity loss."
    },
    "confidence": "medium",
    "confidenceNote": "Confidence is medium because key inputs are incomplete. Missing or weak fields: shift hours/uptime, demand rate/product mix."
  },
  "scenarioCommitted": {
    "demandRatePerHour": 13.5,
    "demandMultiplier": 1,
    "mixProfile": "balanced",
    "staffingMultiplier": 1,
    "equipmentMultiplier": 1,
    "unplannedDowntimePct": 0,
    "ctMultiplier": 1,
    "setupPenaltyMultiplier": 1,
    "variabilityMultiplier": 1,
    "simulationHorizonHours": "24",
    "activeShiftCount": "1",
    "bottleneckReliefUnits": 1,
    "sellingPricePerUnit": 0
  }
};
window.__EXPORT_COMMITTED_SCENARIO__ = window.__EXPORT_BUNDLE_DATA__.scenarioCommitted;
