window.__EXPORT_BUNDLE_DATA__ = {
  "dashboardConfig": {
    "appTitle": "Filter Making Line Forecast",
    "subtitle": "Constraint-based bottleneck forecast (non-DES)",
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
      "name": "Filter Making Line",
      "units": "minutes",
      "source": "User-provided VSM image (strict transcription, 2026-03-09)"
    },
    "nodes": [
      {
        "id": "receiving",
        "label": "Receiving",
        "type": "process",
        "boxData": {
          "ctRaw": "10",
          "changeoverRaw": "0",
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": "3",
          "notesRaw": [
            "Lead Time (m): 6",
            "# of Lines: 3",
            "# Shifts: 1",
            "Lot Size: 1"
          ]
        }
      },
      {
        "id": "stocking",
        "label": "Stocking",
        "type": "process",
        "boxData": {
          "ctRaw": "5.00",
          "changeoverRaw": "0",
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": "100",
          "notesRaw": [
            "Lead Time (m): 10.00",
            "# of Lines: 100",
            "# Shifts: 2.00",
            "Lot Size: 100"
          ]
        }
      },
      {
        "id": "pleating",
        "label": "Pleating",
        "type": "process",
        "boxData": {
          "ctRaw": "20.00",
          "changeoverRaw": "30.00",
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": "1.00",
          "notesRaw": [
            "Lead Time (m): 180.00",
            "# of Lines: 1.00",
            "# Shifts: 3.00",
            "Lot Size: 1.00"
          ]
        }
      },
      {
        "id": "forming",
        "label": "Forming",
        "type": "process",
        "boxData": {
          "ctRaw": "3.00",
          "changeoverRaw": "30.00",
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": "2.00",
          "notesRaw": [
            "Lead Time (m): 1.00",
            "# of Lines: 2.00",
            "# Shifts: 1.00",
            "Lot Size: 50.00"
          ]
        }
      },
      {
        "id": "capping",
        "label": "Capping",
        "type": "process",
        "boxData": {
          "ctRaw": "1.00",
          "changeoverRaw": "30.00",
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": "1.00",
          "notesRaw": [
            "Lead Time (m): 2.00",
            "# of Lines: 1.00",
            "# Shifts: 1.00",
            "Lot Size: 50.00"
          ]
        }
      },
      {
        "id": "testing",
        "label": "Testing",
        "type": "process",
        "boxData": {
          "ctRaw": "3.00",
          "changeoverRaw": "20.00",
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": "2.00",
          "notesRaw": [
            "Lead Time (m): 4.00",
            "# of Lines: 2.00",
            "Shifts: 1.00",
            "Lot Size: 25.00"
          ]
        }
      },
      {
        "id": "packaging",
        "label": "Packaging",
        "type": "process",
        "boxData": {
          "ctRaw": "3.00",
          "changeoverRaw": "30.00",
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": "2.00",
          "notesRaw": [
            "Lead Time (m): 10.00",
            "# of Lines: 2.00",
            "Shifts: 1.00",
            "Lot Size: 50.00"
          ]
        }
      },
      {
        "id": "palletizing",
        "label": "Palletizing",
        "type": "process",
        "boxData": {
          "ctRaw": "5.00",
          "changeoverRaw": "--",
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": "1.00",
          "notesRaw": [
            "Lead Time (m): 10.00",
            "# of Lines: 1.00",
            "Shifts: 1.00",
            "Lot Size: 50.00"
          ]
        }
      },
      {
        "id": "shipping",
        "label": "Shipping",
        "type": "process",
        "boxData": {
          "ctRaw": "5.00",
          "changeoverRaw": "--",
          "waitRaw": null,
          "workersRaw": null,
          "parallelProceduresRaw": "1.00",
          "notesRaw": [
            "Lead Time (m): 10.00",
            "# of Lines: 1.00",
            "Shifts: 1.00",
            "Lot Size: 50.00"
          ]
        }
      }
    ],
    "edges": [
      {
        "from": "receiving",
        "to": "stocking",
        "probability": 1,
        "waitRaw": "FIFO"
      },
      {
        "from": "stocking",
        "to": "pleating",
        "probability": 1,
        "waitRaw": "FIFO"
      },
      {
        "from": "pleating",
        "to": "forming",
        "probability": 1,
        "waitRaw": "FIFO"
      },
      {
        "from": "forming",
        "to": "capping",
        "probability": 1,
        "waitRaw": null
      },
      {
        "from": "capping",
        "to": "testing",
        "probability": 1,
        "waitRaw": null
      },
      {
        "from": "testing",
        "to": "packaging",
        "probability": 1,
        "waitRaw": "FIFO"
      },
      {
        "from": "packaging",
        "to": "palletizing",
        "probability": 1,
        "waitRaw": null
      },
      {
        "from": "palletizing",
        "to": "shipping",
        "probability": 1,
        "waitRaw": "Inventory triangle (I) shown; numeric wait not visible."
      }
    ],
    "startNodes": [
      "receiving"
    ],
    "endNodes": [
      "shipping"
    ]
  },
  "masterData": {
    "products": [
      {
        "productId": "filter_main",
        "family": "filter",
        "mixPct": 1,
        "demandRatePerHour": null,
        "batchSize": null,
        "sellingPricePerUnit": 0
      }
    ],
    "equipment": [
      {
        "equipmentType": "Receiving",
        "count": 3,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "# of Lines: 3; # Shifts: 1"
      },
      {
        "equipmentType": "Stocking",
        "count": 100,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "# of Lines: 100; # Shifts: 2.00"
      },
      {
        "equipmentType": "Pleating",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "# of Lines: 1.00; # Shifts: 3.00"
      },
      {
        "equipmentType": "Forming",
        "count": 2,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "# of Lines: 2.00; # Shifts: 1.00"
      },
      {
        "equipmentType": "Capping",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "# of Lines: 1.00; # Shifts: 1.00"
      },
      {
        "equipmentType": "Testing",
        "count": 2,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "# of Lines: 2.00; Shifts: 1.00"
      },
      {
        "equipmentType": "Packaging",
        "count": 2,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "# of Lines: 2.00; Shifts: 1.00"
      },
      {
        "equipmentType": "Palletizing",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "# of Lines: 1.00; Shifts: 1.00"
      },
      {
        "equipmentType": "Shipping",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "# of Lines: 1.00; Shifts: 1.00"
      }
    ],
    "processing": [
      {
        "stepId": "receiving",
        "equipmentType": "Receiving",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 10,
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
        "wait": {
          "raw": "FIFO (Receiving -> Stocking)"
        },
        "leadTimeMinutes": 6,
        "leadTimeRaw": "Lead Time (m): 6",
        "parallelProcedures": 3,
        "workers": null,
        "stationRaw": "station = 3",
        "shiftCount": 1,
        "lotSize": 1,
        "sourceText": "C.T. (m): 10; C/O (M): 0"
      },
      {
        "stepId": "stocking",
        "equipmentType": "Stocking",
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
              "value": 0,
              "unit": "min"
            }
          }
        },
        "wait": {
          "raw": "FIFO (Stocking -> Pleating)"
        },
        "leadTimeMinutes": 10,
        "leadTimeRaw": "Lead Time (m): 10.00",
        "parallelProcedures": 100,
        "workers": null,
        "stationRaw": "station = 100",
        "shiftCount": 2,
        "lotSize": 100,
        "sourceText": "C.T. (m): 5.00; C/O (M): 0"
      },
      {
        "stepId": "pleating",
        "equipmentType": "Pleating",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 20,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "product",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 30,
              "unit": "min"
            }
          }
        },
        "wait": {
          "raw": "FIFO (Pleating -> Forming)"
        },
        "leadTimeMinutes": 180,
        "leadTimeRaw": "Lead Time (m): 180.00",
        "parallelProcedures": 1,
        "workers": null,
        "stationRaw": "station = 1",
        "shiftCount": 3,
        "lotSize": 1,
        "sourceText": "C.T. (m): 20.00; C/O (M): 30.00"
      },
      {
        "stepId": "forming",
        "equipmentType": "Forming",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 3,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "product",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 30,
              "unit": "min"
            }
          }
        },
        "wait": {
          "raw": null
        },
        "leadTimeMinutes": 1,
        "leadTimeRaw": "Lead Time (m): 1.00",
        "parallelProcedures": 2,
        "workers": null,
        "stationRaw": "station = 2",
        "shiftCount": 1,
        "lotSize": 50,
        "sourceText": "C.T. (m): 3.00; C/O (M): 30.00"
      },
      {
        "stepId": "capping",
        "equipmentType": "Capping",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 1,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "product",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 30,
              "unit": "min"
            }
          }
        },
        "wait": {
          "raw": null
        },
        "leadTimeMinutes": 2,
        "leadTimeRaw": "Lead Time (m): 2.00",
        "parallelProcedures": 1,
        "workers": null,
        "stationRaw": "station = 1",
        "shiftCount": 1,
        "lotSize": 50,
        "sourceText": "C.T. (m): 1.00; C/O (M): 30.00"
      },
      {
        "stepId": "testing",
        "equipmentType": "Testing",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 3,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "product",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 20,
              "unit": "min"
            }
          }
        },
        "wait": {
          "raw": "FIFO (Testing -> Packaging)"
        },
        "leadTimeMinutes": 4,
        "leadTimeRaw": "Lead Time (m): 4.00",
        "parallelProcedures": 2,
        "workers": null,
        "stationRaw": "station = 2",
        "shiftCount": 1,
        "lotSize": 25,
        "sourceText": "C.T. (m): 3.00; C/O (M): 20.00"
      },
      {
        "stepId": "packaging",
        "equipmentType": "Packaging",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 3,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "product",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 30,
              "unit": "min"
            }
          }
        },
        "wait": {
          "raw": null
        },
        "leadTimeMinutes": 10,
        "leadTimeRaw": "Lead Time (m): 10.00",
        "parallelProcedures": 2,
        "workers": null,
        "stationRaw": "station = 2",
        "shiftCount": 1,
        "lotSize": 50,
        "sourceText": "C.T. (m): 3.00; C/O (M): 30.00"
      },
      {
        "stepId": "palletizing",
        "equipmentType": "Palletizing",
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
          "raw": "Inventory triangle (I) shown before Shipping; numeric wait not visible."
        },
        "leadTimeMinutes": 10,
        "leadTimeRaw": "Lead Time (m): 10.00",
        "parallelProcedures": 1,
        "workers": null,
        "stationRaw": "station = 1",
        "shiftCount": 1,
        "lotSize": 50,
        "sourceText": "C.T. (m): 5.00; C/O (M): --"
      },
      {
        "stepId": "shipping",
        "equipmentType": "Shipping",
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
          "raw": null
        },
        "leadTimeMinutes": 10,
        "leadTimeRaw": "Lead Time (m): 10.00",
        "parallelProcedures": 1,
        "workers": null,
        "stationRaw": "station = 1",
        "shiftCount": 1,
        "lotSize": 50,
        "sourceText": "C.T. (m): 5.00; C/O (M): --"
      }
    ],
    "assumptions": [
      {
        "id": "strict-001",
        "severity": "warning",
        "text": "Workers are not explicitly shown in the image; workers are set to null for all steps."
      },
      {
        "id": "strict-002",
        "severity": "warning",
        "text": "FIFO markers are visible between selected steps, but no numeric wait durations or units are shown; waits are preserved as raw text."
      },
      {
        "id": "strict-003",
        "severity": "warning",
        "text": "An inventory triangle marker is visible before Shipping, but no numeric wait value is shown."
      },
      {
        "id": "strict-004",
        "severity": "warning",
        "text": "C/O is shown as '--' for Palletizing and Shipping, so changeover is null for those steps."
      },
      {
        "id": "strict-005",
        "severity": "warning",
        "text": "The image headers indicate C.T. (m), Lead Time (m), and C/O (M); all parsed numeric values are treated as minutes."
      },
      {
        "id": "strict-006",
        "severity": "blocker",
        "text": "Demand rate, product mix policy, uptime, and explicit shift-hour calendars are not visible in the image."
      }
    ]
  },
  "compiledForecastModel": {
    "version": "0.2.0",
    "generatedAt": "2026-03-09T20:32:52.205Z",
    "metadata": {
      "name": "Filter Making Line",
      "units": "per-hour",
      "mode": "constraint-forecast-non-des"
    },
    "graph": {
      "metadata": {
        "name": "Filter Making Line",
        "units": "minutes",
        "source": "User-provided VSM image (strict transcription, 2026-03-09)"
      },
      "nodes": [
        {
          "id": "receiving",
          "label": "Receiving",
          "type": "process",
          "boxData": {
            "ctRaw": "10",
            "changeoverRaw": "0",
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": "3",
            "notesRaw": [
              "Lead Time (m): 6",
              "# of Lines: 3",
              "# Shifts: 1",
              "Lot Size: 1"
            ]
          }
        },
        {
          "id": "stocking",
          "label": "Stocking",
          "type": "process",
          "boxData": {
            "ctRaw": "5.00",
            "changeoverRaw": "0",
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": "100",
            "notesRaw": [
              "Lead Time (m): 10.00",
              "# of Lines: 100",
              "# Shifts: 2.00",
              "Lot Size: 100"
            ]
          }
        },
        {
          "id": "pleating",
          "label": "Pleating",
          "type": "process",
          "boxData": {
            "ctRaw": "20.00",
            "changeoverRaw": "30.00",
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": "1.00",
            "notesRaw": [
              "Lead Time (m): 180.00",
              "# of Lines: 1.00",
              "# Shifts: 3.00",
              "Lot Size: 1.00"
            ]
          }
        },
        {
          "id": "forming",
          "label": "Forming",
          "type": "process",
          "boxData": {
            "ctRaw": "3.00",
            "changeoverRaw": "30.00",
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": "2.00",
            "notesRaw": [
              "Lead Time (m): 1.00",
              "# of Lines: 2.00",
              "# Shifts: 1.00",
              "Lot Size: 50.00"
            ]
          }
        },
        {
          "id": "capping",
          "label": "Capping",
          "type": "process",
          "boxData": {
            "ctRaw": "1.00",
            "changeoverRaw": "30.00",
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": "1.00",
            "notesRaw": [
              "Lead Time (m): 2.00",
              "# of Lines: 1.00",
              "# Shifts: 1.00",
              "Lot Size: 50.00"
            ]
          }
        },
        {
          "id": "testing",
          "label": "Testing",
          "type": "process",
          "boxData": {
            "ctRaw": "3.00",
            "changeoverRaw": "20.00",
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": "2.00",
            "notesRaw": [
              "Lead Time (m): 4.00",
              "# of Lines: 2.00",
              "Shifts: 1.00",
              "Lot Size: 25.00"
            ]
          }
        },
        {
          "id": "packaging",
          "label": "Packaging",
          "type": "process",
          "boxData": {
            "ctRaw": "3.00",
            "changeoverRaw": "30.00",
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": "2.00",
            "notesRaw": [
              "Lead Time (m): 10.00",
              "# of Lines: 2.00",
              "Shifts: 1.00",
              "Lot Size: 50.00"
            ]
          }
        },
        {
          "id": "palletizing",
          "label": "Palletizing",
          "type": "process",
          "boxData": {
            "ctRaw": "5.00",
            "changeoverRaw": "--",
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": "1.00",
            "notesRaw": [
              "Lead Time (m): 10.00",
              "# of Lines: 1.00",
              "Shifts: 1.00",
              "Lot Size: 50.00"
            ]
          }
        },
        {
          "id": "shipping",
          "label": "Shipping",
          "type": "process",
          "boxData": {
            "ctRaw": "5.00",
            "changeoverRaw": "--",
            "waitRaw": null,
            "workersRaw": null,
            "parallelProceduresRaw": "1.00",
            "notesRaw": [
              "Lead Time (m): 10.00",
              "# of Lines: 1.00",
              "Shifts: 1.00",
              "Lot Size: 50.00"
            ]
          }
        }
      ],
      "edges": [
        {
          "from": "receiving",
          "to": "stocking",
          "probability": 1,
          "waitRaw": "FIFO"
        },
        {
          "from": "stocking",
          "to": "pleating",
          "probability": 1,
          "waitRaw": "FIFO"
        },
        {
          "from": "pleating",
          "to": "forming",
          "probability": 1,
          "waitRaw": "FIFO"
        },
        {
          "from": "forming",
          "to": "capping",
          "probability": 1,
          "waitRaw": null
        },
        {
          "from": "capping",
          "to": "testing",
          "probability": 1,
          "waitRaw": null
        },
        {
          "from": "testing",
          "to": "packaging",
          "probability": 1,
          "waitRaw": "FIFO"
        },
        {
          "from": "packaging",
          "to": "palletizing",
          "probability": 1,
          "waitRaw": null
        },
        {
          "from": "palletizing",
          "to": "shipping",
          "probability": 1,
          "waitRaw": "Inventory triangle (I) shown; numeric wait not visible."
        }
      ],
      "startNodes": [
        "receiving"
      ],
      "endNodes": [
        "shipping"
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
      "demandRatePerHour": 2.6024,
      "demandMultiplier": 1,
      "mixProfile": "balanced",
      "staffingMultiplier": 1,
      "equipmentMultiplier": 1,
      "unplannedDowntimePct": 7,
      "ctMultiplier": 1,
      "setupPenaltyMultiplier": 1,
      "variabilityMultiplier": 1,
      "simulationHorizonHours": "8",
      "bottleneckReliefUnits": 1,
      "sellingPricePerUnit": 0
    },
    "stepModels": [
      {
        "stepId": "receiving",
        "label": "Receiving",
        "equipmentType": "Receiving",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 3,
        "ctMinutes": 10,
        "changeoverMinutes": 0,
        "changeoverPenaltyPerUnitMinutes": 0,
        "leadTimeMinutes": 6,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 10,
        "effectiveCapacityPerHour": 18,
        "baseline": {
          "demandRatePerHour": 2.6024,
          "utilization": 0.1446,
          "headroom": 0.8554,
          "queueRisk": 0.0025,
          "bottleneckIndex": 0.0724,
          "status": "healthy"
        }
      },
      {
        "stepId": "stocking",
        "label": "Stocking",
        "equipmentType": "Stocking",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 100,
        "ctMinutes": 5,
        "changeoverMinutes": 0,
        "changeoverPenaltyPerUnitMinutes": 0,
        "leadTimeMinutes": 10,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 5,
        "effectiveCapacityPerHour": 1200,
        "baseline": {
          "demandRatePerHour": 2.6024,
          "utilization": 0.0022,
          "headroom": 0.9978,
          "queueRisk": 0,
          "bottleneckIndex": 0.0011,
          "status": "healthy"
        }
      },
      {
        "stepId": "pleating",
        "label": "Pleating",
        "equipmentType": "Pleating",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 20,
        "changeoverMinutes": 30,
        "changeoverPenaltyPerUnitMinutes": 0.75,
        "leadTimeMinutes": 180,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 20.75,
        "effectiveCapacityPerHour": 2.8916,
        "baseline": {
          "demandRatePerHour": 2.6024,
          "utilization": 0.9,
          "headroom": 0.1,
          "queueRisk": 0.8352,
          "bottleneckIndex": 0.6802,
          "status": "risk"
        }
      },
      {
        "stepId": "forming",
        "label": "Forming",
        "equipmentType": "Forming",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 2,
        "ctMinutes": 3,
        "changeoverMinutes": 30,
        "changeoverPenaltyPerUnitMinutes": 0.75,
        "leadTimeMinutes": 1,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 3.75,
        "effectiveCapacityPerHour": 32,
        "baseline": {
          "demandRatePerHour": 2.6024,
          "utilization": 0.0813,
          "headroom": 0.9187,
          "queueRisk": 0.0007,
          "bottleneckIndex": 0.0405,
          "status": "healthy"
        }
      },
      {
        "stepId": "capping",
        "label": "Capping",
        "equipmentType": "Capping",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 1,
        "changeoverMinutes": 30,
        "changeoverPenaltyPerUnitMinutes": 0.75,
        "leadTimeMinutes": 2,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 1.75,
        "effectiveCapacityPerHour": 34.2857,
        "baseline": {
          "demandRatePerHour": 2.6024,
          "utilization": 0.0759,
          "headroom": 0.9241,
          "queueRisk": 0.0006,
          "bottleneckIndex": 0.0378,
          "status": "healthy"
        }
      },
      {
        "stepId": "testing",
        "label": "Testing",
        "equipmentType": "Testing",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 2,
        "ctMinutes": 3,
        "changeoverMinutes": 20,
        "changeoverPenaltyPerUnitMinutes": 0.5,
        "leadTimeMinutes": 4,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 3.5,
        "effectiveCapacityPerHour": 34.2857,
        "baseline": {
          "demandRatePerHour": 2.6024,
          "utilization": 0.0759,
          "headroom": 0.9241,
          "queueRisk": 0.0006,
          "bottleneckIndex": 0.0378,
          "status": "healthy"
        }
      },
      {
        "stepId": "packaging",
        "label": "Packaging",
        "equipmentType": "Packaging",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 2,
        "ctMinutes": 3,
        "changeoverMinutes": 30,
        "changeoverPenaltyPerUnitMinutes": 0.75,
        "leadTimeMinutes": 10,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 3.75,
        "effectiveCapacityPerHour": 32,
        "baseline": {
          "demandRatePerHour": 2.6024,
          "utilization": 0.0813,
          "headroom": 0.9187,
          "queueRisk": 0.0007,
          "bottleneckIndex": 0.0405,
          "status": "healthy"
        }
      },
      {
        "stepId": "palletizing",
        "label": "Palletizing",
        "equipmentType": "Palletizing",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 5,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 10,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 5,
        "effectiveCapacityPerHour": 12,
        "baseline": {
          "demandRatePerHour": 2.6024,
          "utilization": 0.2169,
          "headroom": 0.7831,
          "queueRisk": 0.0062,
          "bottleneckIndex": 0.1093,
          "status": "healthy"
        }
      },
      {
        "stepId": "shipping",
        "label": "Shipping",
        "equipmentType": "Shipping",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 5,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 10,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 5,
        "effectiveCapacityPerHour": 12,
        "baseline": {
          "demandRatePerHour": 2.6024,
          "utilization": 0.2169,
          "headroom": 0.7831,
          "queueRisk": 0.0062,
          "bottleneckIndex": 0.1093,
          "status": "healthy"
        }
      }
    ],
    "baseline": {
      "demandRatePerHour": 2.6024,
      "lineCapacityPerHour": 2.8916,
      "bottleneckStepId": "pleating",
      "globalMetrics": {
        "throughput": 2.6024,
        "forecastThroughput": 2.6024,
        "throughputDelta": 0,
        "bottleneckMigration": "baseline only",
        "bottleneckIndex": 0.6802,
        "brittleness": 0.3899,
        "avgQueueRisk": 0.0948,
        "totalWipQty": 11.6341,
        "worstCaseTouchTime": 55,
        "totalLeadTimeMinutes": 525.9073,
        "leadTimeDeltaMinutes": 0,
        "waitSharePct": 0.443,
        "leadTimeTopContributor": "Pleating"
      },
      "nodeMetrics": {
        "receiving": {
          "utilization": 0.1446,
          "headroom": 0.8554,
          "queueRisk": 0.0025,
          "queueDepth": 0.0302,
          "wipQty": 0.0302,
          "completedQty": 0,
          "leadTimeMinutes": 16.1008,
          "capacityPerHour": 18,
          "bottleneckIndex": 0.0724,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "stocking": {
          "utilization": 0.0022,
          "headroom": 0.9978,
          "queueRisk": 0,
          "queueDepth": 0,
          "wipQty": 0,
          "completedQty": 0,
          "leadTimeMinutes": 15,
          "capacityPerHour": 1200,
          "bottleneckIndex": 0.0011,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "pleating": {
          "utilization": 0.9,
          "headroom": 0.1,
          "queueRisk": 0.8352,
          "queueDepth": 11.422,
          "wipQty": 11.422,
          "completedQty": 0,
          "leadTimeMinutes": 437.0029,
          "capacityPerHour": 2.8916,
          "bottleneckIndex": 0.6802,
          "bottleneckFlag": true,
          "status": "critical"
        },
        "forming": {
          "utilization": 0.0813,
          "headroom": 0.9187,
          "queueRisk": 0.0007,
          "queueDepth": 0.0089,
          "wipQty": 0.0089,
          "completedQty": 0,
          "leadTimeMinutes": 4.0167,
          "capacityPerHour": 32,
          "bottleneckIndex": 0.0405,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "capping": {
          "utilization": 0.0759,
          "headroom": 0.9241,
          "queueRisk": 0.0006,
          "queueDepth": 0.0077,
          "wipQty": 0.0077,
          "completedQty": 0,
          "leadTimeMinutes": 3.0135,
          "capacityPerHour": 34.2857,
          "bottleneckIndex": 0.0378,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "testing": {
          "utilization": 0.0759,
          "headroom": 0.9241,
          "queueRisk": 0.0006,
          "queueDepth": 0.0077,
          "wipQty": 0.0077,
          "completedQty": 0,
          "leadTimeMinutes": 7.0135,
          "capacityPerHour": 34.2857,
          "bottleneckIndex": 0.0378,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "packaging": {
          "utilization": 0.0813,
          "headroom": 0.9187,
          "queueRisk": 0.0007,
          "queueDepth": 0.0089,
          "wipQty": 0.0089,
          "completedQty": 0,
          "leadTimeMinutes": 13.0167,
          "capacityPerHour": 32,
          "bottleneckIndex": 0.0405,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "palletizing": {
          "utilization": 0.2169,
          "headroom": 0.7831,
          "queueRisk": 0.0062,
          "queueDepth": 0.0743,
          "wipQty": 0.0743,
          "completedQty": 0,
          "leadTimeMinutes": 15.3716,
          "capacityPerHour": 12,
          "bottleneckIndex": 0.1093,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "shipping": {
          "utilization": 0.2169,
          "headroom": 0.7831,
          "queueRisk": 0.0062,
          "queueDepth": 0.0743,
          "wipQty": 0.0743,
          "completedQty": 0,
          "leadTimeMinutes": 15.3716,
          "capacityPerHour": 12,
          "bottleneckIndex": 0.1093,
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
    "statusSummary": "Pleating is no longer clearing work at the required rate. The system is effectively overloaded, so queue and WIP growth will continue until load is reduced or capacity is added.",
    "primaryConstraint": "Pleating is the active choke point because work is arriving faster than that step can drain its queue.",
    "constraintMechanism": "Pleating has enough average capacity on paper, but bunching is compressing work into peaks. That makes the queue spike faster than the step can recover between waves.",
    "downstreamEffects": "The line is meeting demand with very little spare capacity, WIP has built to roughly 12 units, total lead time is now about 525.9 minutes, and operators should expect more expediting, rescheduling, and service risk if this state persists.",
    "economicInterpretation": "The main cost is delay rather than pure output loss. A large share of lead time is waiting, which ties up WIP, delays availability, and burns labor on chasing flow rather than moving product.",
    "recommendedAction": "Reduce effective cycle time at Pleating with standard work, faster changeovers, or error removal before spending on larger structural changes.",
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
    "demandRatePerHour": 2.6024,
    "demandMultiplier": 1,
    "mixProfile": "balanced",
    "staffingMultiplier": 1,
    "equipmentMultiplier": 1,
    "unplannedDowntimePct": 7,
    "ctMultiplier": 1,
    "setupPenaltyMultiplier": 1,
    "variabilityMultiplier": 1,
    "simulationHorizonHours": "8",
    "bottleneckReliefUnits": 1,
    "sellingPricePerUnit": 0,
    "activeShiftCount": "3"
  }
};
window.__EXPORT_COMMITTED_SCENARIO__ = window.__EXPORT_BUNDLE_DATA__.scenarioCommitted;
