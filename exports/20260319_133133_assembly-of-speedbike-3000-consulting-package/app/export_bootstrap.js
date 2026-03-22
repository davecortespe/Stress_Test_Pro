window.__EXPORT_BUNDLE_DATA__ = {
  "dashboardConfig": {
    "appTitle": "Assembly of SpeedBike 3000",
    "subtitle": "Non-DES bottleneck forecast cockpit",
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
      "name": "Assembly of SpeedBike 3000",
      "units": "minutes",
      "source": "User-provided VSM image (strict transcription, 2026-03-19)"
    },
    "nodes": [
      {
        "id": "frame_kit_prep",
        "label": "Frame Kit Prep",
        "type": "process",
        "boxData": {
          "stageRaw": "A",
          "stepDescriptionRaw": "Pick frame, fork, seat post, handlebars, hardware kit",
          "ctRaw": "3",
          "changeoverRaw": "10",
          "waitRaw": "20",
          "equipmentCountRaw": "1",
          "peopleNeededRaw": "1",
          "shiftCountRaw": "1",
          "lotSizeRaw": "10",
          "reworkPctRaw": "1%",
          "equipmentReliabilityRaw": "98%",
          "notesRaw": [
            "Material availability matters"
          ]
        }
      },
      {
        "id": "wheel_assembly",
        "label": "Wheel Assembly",
        "type": "process",
        "boxData": {
          "stageRaw": "B",
          "stepDescriptionRaw": "Assemble front and rear wheel sets",
          "ctRaw": "6",
          "changeoverRaw": "15",
          "waitRaw": "45",
          "equipmentCountRaw": "2",
          "peopleNeededRaw": "2",
          "shiftCountRaw": "1",
          "lotSizeRaw": "10",
          "reworkPctRaw": "2%",
          "equipmentReliabilityRaw": "96%",
          "notesRaw": [
            "Moderate labor content"
          ]
        }
      },
      {
        "id": "drivetrain_assembly",
        "label": "Drivetrain Assembly",
        "type": "process",
        "boxData": {
          "stageRaw": "C",
          "stepDescriptionRaw": "Prepare crankset, chain, pedals, derailleur set",
          "ctRaw": "5",
          "changeoverRaw": "12",
          "waitRaw": "35",
          "equipmentCountRaw": "1",
          "peopleNeededRaw": "1",
          "shiftCountRaw": "1",
          "lotSizeRaw": "10",
          "reworkPctRaw": "2%",
          "equipmentReliabilityRaw": "97%",
          "notesRaw": [
            "Small parts shortages possible"
          ]
        }
      },
      {
        "id": "frame_sub_assembly",
        "label": "Frame Sub-Assembly",
        "type": "process",
        "boxData": {
          "stageRaw": "D",
          "stepDescriptionRaw": "Install fork, headset, handlebars, seat post",
          "ctRaw": "7",
          "changeoverRaw": "8",
          "waitRaw": "50",
          "equipmentCountRaw": "2",
          "peopleNeededRaw": "2",
          "shiftCountRaw": "1",
          "lotSizeRaw": "10",
          "reworkPctRaw": "3%",
          "equipmentReliabilityRaw": "95%",
          "notesRaw": [
            "Fit-up variability starts here"
          ]
        }
      },
      {
        "id": "final_mechanical_assembly",
        "label": "Final Mechanical Assembly",
        "type": "process",
        "boxData": {
          "stageRaw": "E",
          "stepDescriptionRaw": "Join wheels, drivetrain, brakes, cables, chain",
          "ctRaw": "9",
          "changeoverRaw": "20",
          "waitRaw": "80",
          "equipmentCountRaw": "2",
          "peopleNeededRaw": "2",
          "shiftCountRaw": "1",
          "lotSizeRaw": "10",
          "reworkPctRaw": "4%",
          "equipmentReliabilityRaw": "94%",
          "notesRaw": [
            "Good bottleneck candidate"
          ]
        }
      },
      {
        "id": "brake_and_gear_adjustment",
        "label": "Brake and Gear Adjustment",
        "type": "process",
        "boxData": {
          "stageRaw": "F",
          "stepDescriptionRaw": "Tune shifting, brakes, torque verification",
          "ctRaw": "8",
          "changeoverRaw": "5",
          "waitRaw": "60",
          "equipmentCountRaw": "1",
          "peopleNeededRaw": "1",
          "shiftCountRaw": "1",
          "lotSizeRaw": "10",
          "reworkPctRaw": "6%",
          "equipmentReliabilityRaw": "97%",
          "notesRaw": [
            "Another likely bottleneck / rework loop"
          ]
        }
      },
      {
        "id": "inspection_and_touch_up",
        "label": "Inspection and Touch-Up",
        "type": "process",
        "boxData": {
          "stageRaw": "G",
          "stepDescriptionRaw": "Visual inspection, road-test stand, touch-up fixes",
          "ctRaw": "4",
          "changeoverRaw": "0",
          "waitRaw": "30",
          "equipmentCountRaw": "1",
          "peopleNeededRaw": "1",
          "shiftCountRaw": "1",
          "lotSizeRaw": "10",
          "reworkPctRaw": "5%",
          "equipmentReliabilityRaw": "98%",
          "notesRaw": [
            "Feeds rework back to F or E"
          ]
        }
      },
      {
        "id": "packaging_and_staging",
        "label": "Packaging and Staging",
        "type": "process",
        "boxData": {
          "stageRaw": "H",
          "stepDescriptionRaw": "Box bike, label, palletize, stage for shipment",
          "ctRaw": "3.5",
          "changeoverRaw": "10",
          "waitRaw": "25",
          "equipmentCountRaw": "1",
          "peopleNeededRaw": "1",
          "shiftCountRaw": "1",
          "lotSizeRaw": "10",
          "reworkPctRaw": "1%",
          "equipmentReliabilityRaw": "99%",
          "notesRaw": [
            "End of line"
          ]
        }
      }
    ],
    "edges": [
      {
        "from": "frame_kit_prep",
        "to": "wheel_assembly",
        "probability": 1
      },
      {
        "from": "wheel_assembly",
        "to": "drivetrain_assembly",
        "probability": 1
      },
      {
        "from": "drivetrain_assembly",
        "to": "frame_sub_assembly",
        "probability": 1
      },
      {
        "from": "frame_sub_assembly",
        "to": "final_mechanical_assembly",
        "probability": 1
      },
      {
        "from": "final_mechanical_assembly",
        "to": "brake_and_gear_adjustment",
        "probability": 1
      },
      {
        "from": "brake_and_gear_adjustment",
        "to": "inspection_and_touch_up",
        "probability": 1
      },
      {
        "from": "inspection_and_touch_up",
        "to": "packaging_and_staging",
        "probability": 1
      }
    ],
    "startNodes": [
      "frame_kit_prep"
    ],
    "endNodes": [
      "packaging_and_staging"
    ]
  },
  "masterData": {
    "products": [
      {
        "productId": "bike_assembly",
        "family": "bike",
        "mixPct": 1,
        "demandRatePerHour": null,
        "batchSize": null,
        "sellingPricePerUnit": 0
      }
    ],
    "equipment": [
      {
        "equipmentType": "Frame Kit Prep",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Wheel Assembly",
        "count": 2,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Drivetrain Assembly",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Frame Sub-Assembly",
        "count": 2,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Final Mechanical Assembly",
        "count": 2,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Brake and Gear Adjustment",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Inspection and Touch-Up",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Packaging and Staging",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      }
    ],
    "processing": [
      {
        "stepId": "frame_kit_prep",
        "equipmentType": "Frame Kit Prep",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 3,
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
        "leadTimeMinutes": 20,
        "leadTimeRaw": "20 min",
        "parallelProcedures": 1,
        "workers": 1,
        "shiftCount": 1,
        "lotSize": 10,
        "reworkPct": 0.01,
        "equipmentReliabilityPct": 0.98,
        "stage": "A",
        "stepDescription": "Pick frame, fork, seat post, handlebars, hardware kit",
        "sourceText": "Stage A | Frame Kit Prep | CT 3 min | LT 20 min | C/O 10 min | # of Equipment 1 | People Needed 1 | # of Shifts 1 | Lot Size 10 | Rework 1% | Equipment Reliability 98% | Material availability matters"
      },
      {
        "stepId": "wheel_assembly",
        "equipmentType": "Wheel Assembly",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 6,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 15,
              "unit": "min"
            }
          }
        },
        "leadTimeMinutes": 45,
        "leadTimeRaw": "45 min",
        "parallelProcedures": 2,
        "workers": 2,
        "shiftCount": 1,
        "lotSize": 10,
        "reworkPct": 0.02,
        "equipmentReliabilityPct": 0.96,
        "stage": "B",
        "stepDescription": "Assemble front and rear wheel sets",
        "sourceText": "Stage B | Wheel Assembly | CT 6 min | LT 45 min | C/O 15 min | # of Equipment 2 | People Needed 2 | # of Shifts 1 | Lot Size 10 | Rework 2% | Equipment Reliability 96% | Moderate labor content"
      },
      {
        "stepId": "drivetrain_assembly",
        "equipmentType": "Drivetrain Assembly",
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
        "parallelProcedures": 1,
        "workers": 1,
        "shiftCount": 1,
        "lotSize": 10,
        "reworkPct": 0.02,
        "equipmentReliabilityPct": 0.97,
        "stage": "C",
        "stepDescription": "Prepare crankset, chain, pedals, derailleur set",
        "sourceText": "Stage C | Drivetrain Assembly | CT 5 min | LT 35 min | C/O 12 min | # of Equipment 1 | People Needed 1 | # of Shifts 1 | Lot Size 10 | Rework 2% | Equipment Reliability 97% | Small parts shortages possible"
      },
      {
        "stepId": "frame_sub_assembly",
        "equipmentType": "Frame Sub-Assembly",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 7,
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
        "leadTimeMinutes": 50,
        "leadTimeRaw": "50 min",
        "parallelProcedures": 2,
        "workers": 2,
        "shiftCount": 1,
        "lotSize": 10,
        "reworkPct": 0.03,
        "equipmentReliabilityPct": 0.95,
        "stage": "D",
        "stepDescription": "Install fork, headset, handlebars, seat post",
        "sourceText": "Stage D | Frame Sub-Assembly | CT 7 min | LT 50 min | C/O 8 min | # of Equipment 2 | People Needed 2 | # of Shifts 1 | Lot Size 10 | Rework 3% | Equipment Reliability 95% | Fit-up variability starts here"
      },
      {
        "stepId": "final_mechanical_assembly",
        "equipmentType": "Final Mechanical Assembly",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 9,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 20,
              "unit": "min"
            }
          }
        },
        "leadTimeMinutes": 80,
        "leadTimeRaw": "80 min",
        "parallelProcedures": 2,
        "workers": 2,
        "shiftCount": 1,
        "lotSize": 10,
        "reworkPct": 0.04,
        "equipmentReliabilityPct": 0.94,
        "stage": "E",
        "stepDescription": "Join wheels, drivetrain, brakes, cables, chain",
        "sourceText": "Stage E | Final Mechanical Assembly | CT 9 min | LT 80 min | C/O 20 min | # of Equipment 2 | People Needed 2 | # of Shifts 1 | Lot Size 10 | Rework 4% | Equipment Reliability 94% | Good bottleneck candidate"
      },
      {
        "stepId": "brake_and_gear_adjustment",
        "equipmentType": "Brake and Gear Adjustment",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 8,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 5,
              "unit": "min"
            }
          }
        },
        "leadTimeMinutes": 60,
        "leadTimeRaw": "60 min",
        "parallelProcedures": 1,
        "workers": 1,
        "shiftCount": 1,
        "lotSize": 10,
        "reworkPct": 0.06,
        "equipmentReliabilityPct": 0.97,
        "stage": "F",
        "stepDescription": "Tune shifting, brakes, torque verification",
        "sourceText": "Stage F | Brake and Gear Adjustment | CT 8 min | LT 60 min | C/O 5 min | # of Equipment 1 | People Needed 1 | # of Shifts 1 | Lot Size 10 | Rework 6% | Equipment Reliability 97% | Another likely bottleneck / rework loop"
      },
      {
        "stepId": "inspection_and_touch_up",
        "equipmentType": "Inspection and Touch-Up",
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
        "lotSize": 10,
        "reworkPct": 0.05,
        "equipmentReliabilityPct": 0.98,
        "stage": "G",
        "stepDescription": "Visual inspection, road-test stand, touch-up fixes",
        "sourceText": "Stage G | Inspection and Touch-Up | CT 4 min | LT 30 min | C/O 0 min | # of Equipment 1 | People Needed 1 | # of Shifts 1 | Lot Size 10 | Rework 5% | Equipment Reliability 98% | Feeds rework back to F or E"
      },
      {
        "stepId": "packaging_and_staging",
        "equipmentType": "Packaging and Staging",
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
        "lotSize": 10,
        "reworkPct": 0.01,
        "equipmentReliabilityPct": 0.99,
        "stage": "H",
        "stepDescription": "Box bike, label, palletize, stage for shipment",
        "sourceText": "Stage H | Packaging and Staging | CT 3.5 min | LT 25 min | C/O 10 min | # of Equipment 1 | People Needed 1 | # of Shifts 1 | Lot Size 10 | Rework 1% | Equipment Reliability 99% | End of line"
      }
    ],
    "assumptions": [
      {
        "id": "strict-001",
        "severity": "warning",
        "text": "The VSM title is not visible in the image; model metadata was inferred as Assembly of SpeedBike 3000."
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
      }
    ]
  },
  "compiledForecastModel": {
    "version": "0.3.0",
    "generatedAt": "2026-03-19T17:06:47.505Z",
    "metadata": {
      "name": "Assembly of SpeedBike 3000",
      "units": "per-hour",
      "mode": "constraint-forecast-non-des"
    },
    "graph": {
      "metadata": {
        "name": "Assembly of SpeedBike 3000",
        "units": "minutes",
        "source": "User-provided VSM image (strict transcription, 2026-03-19)"
      },
      "nodes": [
        {
          "id": "frame_kit_prep",
          "label": "Frame Kit Prep",
          "type": "process",
          "boxData": {
            "stageRaw": "A",
            "stepDescriptionRaw": "Pick frame, fork, seat post, handlebars, hardware kit",
            "ctRaw": "3",
            "changeoverRaw": "10",
            "waitRaw": "20",
            "equipmentCountRaw": "1",
            "peopleNeededRaw": "1",
            "shiftCountRaw": "1",
            "lotSizeRaw": "10",
            "reworkPctRaw": "1%",
            "equipmentReliabilityRaw": "98%",
            "notesRaw": [
              "Material availability matters"
            ]
          }
        },
        {
          "id": "wheel_assembly",
          "label": "Wheel Assembly",
          "type": "process",
          "boxData": {
            "stageRaw": "B",
            "stepDescriptionRaw": "Assemble front and rear wheel sets",
            "ctRaw": "6",
            "changeoverRaw": "15",
            "waitRaw": "45",
            "equipmentCountRaw": "2",
            "peopleNeededRaw": "2",
            "shiftCountRaw": "1",
            "lotSizeRaw": "10",
            "reworkPctRaw": "2%",
            "equipmentReliabilityRaw": "96%",
            "notesRaw": [
              "Moderate labor content"
            ]
          }
        },
        {
          "id": "drivetrain_assembly",
          "label": "Drivetrain Assembly",
          "type": "process",
          "boxData": {
            "stageRaw": "C",
            "stepDescriptionRaw": "Prepare crankset, chain, pedals, derailleur set",
            "ctRaw": "5",
            "changeoverRaw": "12",
            "waitRaw": "35",
            "equipmentCountRaw": "1",
            "peopleNeededRaw": "1",
            "shiftCountRaw": "1",
            "lotSizeRaw": "10",
            "reworkPctRaw": "2%",
            "equipmentReliabilityRaw": "97%",
            "notesRaw": [
              "Small parts shortages possible"
            ]
          }
        },
        {
          "id": "frame_sub_assembly",
          "label": "Frame Sub-Assembly",
          "type": "process",
          "boxData": {
            "stageRaw": "D",
            "stepDescriptionRaw": "Install fork, headset, handlebars, seat post",
            "ctRaw": "7",
            "changeoverRaw": "8",
            "waitRaw": "50",
            "equipmentCountRaw": "2",
            "peopleNeededRaw": "2",
            "shiftCountRaw": "1",
            "lotSizeRaw": "10",
            "reworkPctRaw": "3%",
            "equipmentReliabilityRaw": "95%",
            "notesRaw": [
              "Fit-up variability starts here"
            ]
          }
        },
        {
          "id": "final_mechanical_assembly",
          "label": "Final Mechanical Assembly",
          "type": "process",
          "boxData": {
            "stageRaw": "E",
            "stepDescriptionRaw": "Join wheels, drivetrain, brakes, cables, chain",
            "ctRaw": "9",
            "changeoverRaw": "20",
            "waitRaw": "80",
            "equipmentCountRaw": "2",
            "peopleNeededRaw": "2",
            "shiftCountRaw": "1",
            "lotSizeRaw": "10",
            "reworkPctRaw": "4%",
            "equipmentReliabilityRaw": "94%",
            "notesRaw": [
              "Good bottleneck candidate"
            ]
          }
        },
        {
          "id": "brake_and_gear_adjustment",
          "label": "Brake and Gear Adjustment",
          "type": "process",
          "boxData": {
            "stageRaw": "F",
            "stepDescriptionRaw": "Tune shifting, brakes, torque verification",
            "ctRaw": "8",
            "changeoverRaw": "5",
            "waitRaw": "60",
            "equipmentCountRaw": "1",
            "peopleNeededRaw": "1",
            "shiftCountRaw": "1",
            "lotSizeRaw": "10",
            "reworkPctRaw": "6%",
            "equipmentReliabilityRaw": "97%",
            "notesRaw": [
              "Another likely bottleneck / rework loop"
            ]
          }
        },
        {
          "id": "inspection_and_touch_up",
          "label": "Inspection and Touch-Up",
          "type": "process",
          "boxData": {
            "stageRaw": "G",
            "stepDescriptionRaw": "Visual inspection, road-test stand, touch-up fixes",
            "ctRaw": "4",
            "changeoverRaw": "0",
            "waitRaw": "30",
            "equipmentCountRaw": "1",
            "peopleNeededRaw": "1",
            "shiftCountRaw": "1",
            "lotSizeRaw": "10",
            "reworkPctRaw": "5%",
            "equipmentReliabilityRaw": "98%",
            "notesRaw": [
              "Feeds rework back to F or E"
            ]
          }
        },
        {
          "id": "packaging_and_staging",
          "label": "Packaging and Staging",
          "type": "process",
          "boxData": {
            "stageRaw": "H",
            "stepDescriptionRaw": "Box bike, label, palletize, stage for shipment",
            "ctRaw": "3.5",
            "changeoverRaw": "10",
            "waitRaw": "25",
            "equipmentCountRaw": "1",
            "peopleNeededRaw": "1",
            "shiftCountRaw": "1",
            "lotSizeRaw": "10",
            "reworkPctRaw": "1%",
            "equipmentReliabilityRaw": "99%",
            "notesRaw": [
              "End of line"
            ]
          }
        }
      ],
      "edges": [
        {
          "from": "frame_kit_prep",
          "to": "wheel_assembly",
          "probability": 1
        },
        {
          "from": "wheel_assembly",
          "to": "drivetrain_assembly",
          "probability": 1
        },
        {
          "from": "drivetrain_assembly",
          "to": "frame_sub_assembly",
          "probability": 1
        },
        {
          "from": "frame_sub_assembly",
          "to": "final_mechanical_assembly",
          "probability": 1
        },
        {
          "from": "final_mechanical_assembly",
          "to": "brake_and_gear_adjustment",
          "probability": 1
        },
        {
          "from": "brake_and_gear_adjustment",
          "to": "inspection_and_touch_up",
          "probability": 1
        },
        {
          "from": "inspection_and_touch_up",
          "to": "packaging_and_staging",
          "probability": 1
        }
      ],
      "startNodes": [
        "frame_kit_prep"
      ],
      "endNodes": [
        "packaging_and_staging"
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
    },
    "stepModels": [
      {
        "stepId": "frame_kit_prep",
        "label": "Frame Kit Prep",
        "equipmentType": "Frame Kit Prep",
        "workerCount": 1,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 3,
        "changeoverMinutes": 10,
        "changeoverPenaltyPerUnitMinutes": 1,
        "leadTimeMinutes": 20,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 4,
        "effectiveCapacityPerHour": 15,
        "baseline": {
          "demandRatePerHour": 13.5,
          "utilization": 0.9,
          "headroom": 0.1,
          "queueRisk": 0.81,
          "bottleneckIndex": 0.675,
          "status": "risk"
        }
      },
      {
        "stepId": "wheel_assembly",
        "label": "Wheel Assembly",
        "equipmentType": "Wheel Assembly",
        "workerCount": 2,
        "parallelProcedures": 2,
        "effectiveUnits": 2,
        "ctMinutes": 6,
        "changeoverMinutes": 15,
        "changeoverPenaltyPerUnitMinutes": 1.5,
        "leadTimeMinutes": 45,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 7.5,
        "effectiveCapacityPerHour": 16,
        "baseline": {
          "demandRatePerHour": 13.5,
          "utilization": 0.8438,
          "headroom": 0.1563,
          "queueRisk": 0.4556,
          "bottleneckIndex": 0.5417,
          "status": "healthy"
        }
      },
      {
        "stepId": "drivetrain_assembly",
        "label": "Drivetrain Assembly",
        "equipmentType": "Drivetrain Assembly",
        "workerCount": 1,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 5,
        "changeoverMinutes": 12,
        "changeoverPenaltyPerUnitMinutes": 1.2,
        "leadTimeMinutes": 35,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 6.2,
        "effectiveCapacityPerHour": 9.6774,
        "baseline": {
          "demandRatePerHour": 13.5,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 0.9395,
          "status": "critical"
        }
      },
      {
        "stepId": "frame_sub_assembly",
        "label": "Frame Sub-Assembly",
        "equipmentType": "Frame Sub-Assembly",
        "workerCount": 2,
        "parallelProcedures": 2,
        "effectiveUnits": 2,
        "ctMinutes": 7,
        "changeoverMinutes": 8,
        "changeoverPenaltyPerUnitMinutes": 0.8,
        "leadTimeMinutes": 50,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 7.8,
        "effectiveCapacityPerHour": 15.3846,
        "baseline": {
          "demandRatePerHour": 13.5,
          "utilization": 0.8775,
          "headroom": 0.1225,
          "queueRisk": 0.6286,
          "bottleneckIndex": 0.6098,
          "status": "risk"
        }
      },
      {
        "stepId": "final_mechanical_assembly",
        "label": "Final Mechanical Assembly",
        "equipmentType": "Final Mechanical Assembly",
        "workerCount": 2,
        "parallelProcedures": 2,
        "effectiveUnits": 2,
        "ctMinutes": 9,
        "changeoverMinutes": 20,
        "changeoverPenaltyPerUnitMinutes": 2,
        "leadTimeMinutes": 80,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 11,
        "effectiveCapacityPerHour": 10.9091,
        "baseline": {
          "demandRatePerHour": 13.5,
          "utilization": 1.2375,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 0.9177,
          "status": "critical"
        }
      },
      {
        "stepId": "brake_and_gear_adjustment",
        "label": "Brake and Gear Adjustment",
        "equipmentType": "Brake and Gear Adjustment",
        "workerCount": 1,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 8,
        "changeoverMinutes": 5,
        "changeoverPenaltyPerUnitMinutes": 0.5,
        "leadTimeMinutes": 60,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 8.5,
        "effectiveCapacityPerHour": 7.0588,
        "baseline": {
          "demandRatePerHour": 13.5,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 0.9913,
          "status": "critical"
        }
      },
      {
        "stepId": "inspection_and_touch_up",
        "label": "Inspection and Touch-Up",
        "equipmentType": "Inspection and Touch-Up",
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
          "demandRatePerHour": 13.5,
          "utilization": 0.9,
          "headroom": 0.1,
          "queueRisk": 0.81,
          "bottleneckIndex": 0.675,
          "status": "risk"
        }
      },
      {
        "stepId": "packaging_and_staging",
        "label": "Packaging and Staging",
        "equipmentType": "Packaging and Staging",
        "workerCount": 1,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 3.5,
        "changeoverMinutes": 10,
        "changeoverPenaltyPerUnitMinutes": 1,
        "leadTimeMinutes": 25,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 4.5,
        "effectiveCapacityPerHour": 13.3333,
        "baseline": {
          "demandRatePerHour": 13.5,
          "utilization": 1.0125,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 0.7873,
          "status": "critical"
        }
      }
    ],
    "baseline": {
      "demandRatePerHour": 13.5,
      "lineCapacityPerHour": 7.0588,
      "bottleneckStepId": "brake_and_gear_adjustment",
      "globalMetrics": {
        "throughput": 7.0588,
        "globalThroughput": 7.0588,
        "forecastThroughput": 7.0588,
        "throughputDelta": 0,
        "bottleneckMigration": "baseline only",
        "bottleneckIndex": 0.9913,
        "brittleness": 0.8513,
        "avgQueueRisk": 0.838,
        "totalWipQty": 418.4354,
        "worstCaseTouchTime": 45.5,
        "totalLeadTimeMinutes": 972.8947,
        "leadTimeDeltaMinutes": 0,
        "waitSharePct": 0.3546,
        "leadTimeTopContributor": "Brake and Gear Adjustment"
      },
      "nodeMetrics": {
        "frame_kit_prep": {
          "utilization": 0.9,
          "headroom": 0.1,
          "queueRisk": 0.81,
          "queueDepth": 11.26,
          "wipQty": 11.26,
          "completedQty": 0,
          "leadTimeMinutes": 68.04,
          "capacityPerHour": 15,
          "bottleneckIndex": 0.675,
          "bottleneckFlag": false,
          "status": "risk"
        },
        "wheel_assembly": {
          "utilization": 0.8438,
          "headroom": 0.1563,
          "queueRisk": 0.4556,
          "queueDepth": 6.6138,
          "wipQty": 6.6138,
          "completedQty": 0,
          "leadTimeMinutes": 75.8016,
          "capacityPerHour": 16,
          "bottleneckIndex": 0.5417,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "drivetrain_assembly": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 17.005,
          "wipQty": 108.7474,
          "completedQty": 0,
          "leadTimeMinutes": 145.4313,
          "capacityPerHour": 9.6774,
          "bottleneckIndex": 0.9395,
          "bottleneckFlag": false,
          "status": "critical"
        },
        "frame_sub_assembly": {
          "utilization": 0.8775,
          "headroom": 0.1225,
          "queueRisk": 0.6286,
          "queueDepth": 8.9255,
          "wipQty": 8.9255,
          "completedQty": 0,
          "leadTimeMinutes": 91.8095,
          "capacityPerHour": 15.3846,
          "bottleneckIndex": 0.6098,
          "bottleneckFlag": false,
          "status": "risk"
        },
        "final_mechanical_assembly": {
          "utilization": 1.2375,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 15.9025,
          "wipQty": 78.0841,
          "completedQty": 0,
          "leadTimeMinutes": 176.4636,
          "capacityPerHour": 10.9091,
          "bottleneckIndex": 0.9177,
          "bottleneckFlag": false,
          "status": "critical"
        },
        "brake_and_gear_adjustment": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 20.6275,
          "wipQty": 175.2163,
          "completedQty": 0,
          "leadTimeMinutes": 243.3347,
          "capacityPerHour": 7.0588,
          "bottleneckIndex": 0.9913,
          "bottleneckFlag": true,
          "status": "critical"
        },
        "inspection_and_touch_up": {
          "utilization": 0.9,
          "headroom": 0.1,
          "queueRisk": 0.81,
          "queueDepth": 11.26,
          "wipQty": 11.26,
          "completedQty": 0,
          "leadTimeMinutes": 79.04,
          "capacityPerHour": 15,
          "bottleneckIndex": 0.675,
          "bottleneckFlag": false,
          "status": "risk"
        },
        "packaging_and_staging": {
          "utilization": 1.0125,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 14.3275,
          "wipQty": 18.3283,
          "completedQty": 0,
          "leadTimeMinutes": 92.974,
          "capacityPerHour": 13.3333,
          "bottleneckIndex": 0.7873,
          "bottleneckFlag": false,
          "status": "critical"
        }
      }
    },
    "assumptions": [
      {
        "id": "strict-001",
        "severity": "warning",
        "text": "The VSM title is not visible in the image; model metadata was inferred as Assembly of SpeedBike 3000."
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
        "text": "Queue risk, bottleneck index, brittleness, and migration outputs are deterministic non-DES forecast heuristics for rapid recompute."
      }
    ]
  },
  "operationalDiagnosis": {
    "status": "overloaded",
    "statusSummary": "Drivetrain Assembly is no longer clearing work at the required rate. The system is effectively overloaded, so queue and WIP growth will continue until load is reduced or capacity is added.",
    "primaryConstraint": "Drivetrain Assembly is saturated; effective service capacity is capped near 3.2 units/hr.",
    "constraintMechanism": "Drivetrain Assembly is taking demand at about 13.5 units/hr but only clearing about 3.2 units/hr, so arrivals are outrunning service and the queue cannot normalize.",
    "downstreamEffects": "Throughput is running about 83% below required rate, WIP has built to roughly 268 units, total lead time is now about 3884.5 minutes, and operators should expect more expediting, rescheduling, and service risk if this state persists.",
    "economicInterpretation": "This is creating hidden capacity loss of roughly 83% versus required output. The likely business impact is overtime pressure, slower inventory availability, and missed throughput that has to be recovered later.",
    "recommendedAction": "Reduce effective cycle time at Drivetrain Assembly with standard work, faster changeovers, or error removal before spending on larger structural changes.",
    "scenarioGuidance": "The current relief scenario is directionally right. It improves throughput by about 0.873 units/hr, and it also changes bottleneck behavior to Brake and Gear Adjustment -> Drivetrain Assembly (low confidence).",
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
