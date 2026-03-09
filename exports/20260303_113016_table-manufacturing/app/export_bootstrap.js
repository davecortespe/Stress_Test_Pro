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
      "name": "Consumption Report VSM",
      "units": "minutes",
      "source": "User-provided VSM image (strict transcription refresh, 2026-03-03)"
    },
    "nodes": [
      {
        "id": "receiving",
        "label": "Receiving",
        "type": "process",
        "boxData": {
          "ctRaw": "30 min",
          "changeoverRaw": null,
          "waitRaw": "8 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "D.T. (%) = n/a",
            "Bottom timeline (process): 0.05"
          ]
        }
      },
      {
        "id": "micro",
        "label": "Micro",
        "type": "process",
        "boxData": {
          "ctRaw": "8 hrs",
          "changeoverRaw": null,
          "waitRaw": "8 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Bottom timeline (process): 1.0"
          ]
        }
      },
      {
        "id": "granulation",
        "label": "Granulation",
        "type": "process",
        "boxData": {
          "ctRaw": "10.55",
          "changeoverRaw": null,
          "waitRaw": "8 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": "# of Lines: 2",
          "notesRaw": [
            "D.T. (%) = 39%",
            "OEE = 52.67%",
            "Bottom timeline (process): 0.1"
          ]
        }
      },
      {
        "id": "compression",
        "label": "Compression",
        "type": "process",
        "boxData": {
          "ctRaw": "175",
          "changeoverRaw": null,
          "waitRaw": "8 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": "# of Lines: 3",
          "notesRaw": [
            "D.T. (%) = 36.72%",
            "OEE = 49.13%",
            "Bottom timeline (process): 0.31"
          ]
        }
      },
      {
        "id": "coating",
        "label": "Coating",
        "type": "process",
        "boxData": {
          "ctRaw": "204",
          "changeoverRaw": "30",
          "waitRaw": "8 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": "# of Lines: 2",
          "notesRaw": [
            "D.T. (%) = 30.40%",
            "OEE = 49.14%",
            "Bottom timeline (process): 0.15"
          ]
        }
      },
      {
        "id": "printing",
        "label": "Printing",
        "type": "process",
        "boxData": {
          "ctRaw": "150",
          "changeoverRaw": "40",
          "waitRaw": "8 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": "# of Lines: 2",
          "notesRaw": [
            "D.T. (%) = 37.90%",
            "OEE = 48.56%",
            "Bottom timeline (process): 0.12"
          ]
        }
      },
      {
        "id": "analitical_lab",
        "label": "Analitical Lab",
        "type": "process",
        "boxData": {
          "ctRaw": "16 hrs",
          "changeoverRaw": null,
          "waitRaw": "48 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Bottom timeline (process): 0.90"
          ]
        }
      },
      {
        "id": "packaging",
        "label": "Packaging",
        "type": "process",
        "boxData": {
          "ctRaw": "30",
          "changeoverRaw": "210",
          "waitRaw": "48 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": "# of Lines: 1.00",
          "notesRaw": [
            "D.T. (%) = 53.25%",
            "OEE = 48.30%",
            "Lot Size = 10.00",
            "Bottom timeline (process): 1.34"
          ]
        }
      },
      {
        "id": "docking",
        "label": "Docking",
        "type": "process",
        "boxData": {
          "ctRaw": null,
          "changeoverRaw": null,
          "waitRaw": "8 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Bottom timeline (process): 0.03"
          ]
        }
      },
      {
        "id": "shipping",
        "label": "Shipping",
        "type": "process",
        "boxData": {
          "ctRaw": "8 hrs",
          "changeoverRaw": null,
          "waitRaw": "8 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": null,
          "notesRaw": [
            "Inventory triangle note: 5-7 Days"
          ]
        }
      }
    ],
    "edges": [
      {
        "from": "receiving",
        "to": "micro",
        "probability": 1
      },
      {
        "from": "micro",
        "to": "granulation",
        "probability": 1
      },
      {
        "from": "granulation",
        "to": "compression",
        "probability": 1
      },
      {
        "from": "compression",
        "to": "coating",
        "probability": 1
      },
      {
        "from": "coating",
        "to": "printing",
        "probability": 1
      },
      {
        "from": "printing",
        "to": "analitical_lab",
        "probability": 1
      },
      {
        "from": "analitical_lab",
        "to": "packaging",
        "probability": 1
      },
      {
        "from": "packaging",
        "to": "docking",
        "probability": 1
      },
      {
        "from": "docking",
        "to": "shipping",
        "probability": 1
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
    "products": [],
    "equipment": [
      {
        "equipmentType": "Receiving",
        "count": null,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "Worker/equipment count not visible."
      },
      {
        "equipmentType": "Micro",
        "count": null,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "Worker/equipment count not visible."
      },
      {
        "equipmentType": "Granulation",
        "count": 2,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "# of Lines = 2"
      },
      {
        "equipmentType": "Compression",
        "count": 3,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "# of Lines = 3"
      },
      {
        "equipmentType": "Coating",
        "count": 2,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "# of Lines = 2"
      },
      {
        "equipmentType": "Printing",
        "count": 2,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "# of Lines = 2"
      },
      {
        "equipmentType": "Analitical Lab",
        "count": null,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "Worker/equipment count not visible."
      },
      {
        "equipmentType": "Packaging",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "# of Lines = 1.00"
      },
      {
        "equipmentType": "Docking",
        "count": null,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "Worker/equipment count not visible."
      },
      {
        "equipmentType": "Shipping",
        "count": null,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        },
        "sourceText": "Worker/equipment count not visible."
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
            "value": 30,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": "8 hrs"
        },
        "leadTimeMinutes": 480,
        "leadTimeRaw": "8 hrs",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": null,
        "sourceText": "C.T.(m): 30 min; Lead Time: 8 hrs; D.T.(%): n/a"
      },
      {
        "stepId": "micro",
        "equipmentType": "Micro",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 480,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": "8 hrs"
        },
        "leadTimeMinutes": 480,
        "leadTimeRaw": "8 hrs",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": null,
        "sourceText": "C.T.(m): 8 hrs; Lead Time: 8 hrs"
      },
      {
        "stepId": "granulation",
        "equipmentType": "Granulation",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 10.55,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": "8 hrs"
        },
        "leadTimeMinutes": 480,
        "leadTimeRaw": "8 hrs",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": "Station=2",
        "sourceText": "C.T.(m): 10.55; D.T.(%): 39%; Lead Time: 8 hrs; # of Lines: 2; OEE: 52.67%"
      },
      {
        "stepId": "compression",
        "equipmentType": "Compression",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 175,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": "8 hrs"
        },
        "leadTimeMinutes": 480,
        "leadTimeRaw": "8 hrs",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": "Station=3",
        "sourceText": "C.T.(m): 175; D.T.(%): 36.72%; Lead Time: 8 hrs; # of Lines: 3; OEE: 49.13%"
      },
      {
        "stepId": "coating",
        "equipmentType": "Coating",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 204,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": {
            "dist": "fixed",
            "params": {
              "value": 30,
              "unit": "min"
            }
          }
        },
        "wait": {
          "raw": "8 hrs"
        },
        "leadTimeMinutes": 480,
        "leadTimeRaw": "8 hrs",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": "Station=2",
        "sourceText": "C.T.(m): 204; D.T.(%): 30.40%; Lead Time: 8 hrs; C/O[M]: 30; # of Lines: 2; OEE: 49.14%"
      },
      {
        "stepId": "printing",
        "equipmentType": "Printing",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 150,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": {
            "dist": "fixed",
            "params": {
              "value": 40,
              "unit": "min"
            }
          }
        },
        "wait": {
          "raw": "8 hrs"
        },
        "leadTimeMinutes": 480,
        "leadTimeRaw": "8 hrs",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": "Station=2",
        "sourceText": "C.T.(m): 150; D.T.(%): 37.90%; Lead Time: 8 hrs; C/O[M]: 40; # of Lines: 2; OEE: 48.56%"
      },
      {
        "stepId": "analitical_lab",
        "equipmentType": "Analitical Lab",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 960,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": "48 hrs"
        },
        "leadTimeMinutes": 2880,
        "leadTimeRaw": "48 hrs",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": null,
        "sourceText": "C.T.(m): 16 hrs; Lead Time: 48 hrs"
      },
      {
        "stepId": "packaging",
        "equipmentType": "Packaging",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 30,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": {
            "dist": "fixed",
            "params": {
              "value": 210,
              "unit": "min"
            }
          }
        },
        "wait": {
          "raw": "48 hrs"
        },
        "leadTimeMinutes": 2880,
        "leadTimeRaw": "48 hrs",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": "Station=1",
        "sourceText": "C.T.(m): 30; D.T.(%): 53.25%; Lead Time: 48 hrs; C/O[M]: 210; # of Lines: 1.00; OEE: 48.30%; Lot Size: 10.00"
      },
      {
        "stepId": "docking",
        "equipmentType": "Docking",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": null,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": "8 hrs"
        },
        "leadTimeMinutes": 480,
        "leadTimeRaw": "8 hrs",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": null,
        "sourceText": "C.T.(m): not readable; Lead Time: 8 hrs"
      },
      {
        "stepId": "shipping",
        "equipmentType": "Shipping",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 480,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": null,
          "time": null
        },
        "wait": {
          "raw": "8 hrs"
        },
        "leadTimeMinutes": 480,
        "leadTimeRaw": "8 hrs",
        "parallelProcedures": null,
        "workers": null,
        "stationRaw": null,
        "sourceText": "C.T.(m): 8 hrs; Lead Time: 8 hrs"
      }
    ],
    "assumptions": [
      {
        "id": "strict-001",
        "severity": "warning",
        "text": "Receiving C/O is not readable from the image; changeover.time is null."
      },
      {
        "id": "strict-002",
        "severity": "warning",
        "text": "Micro C/O and D.T.(%) are not readable from the image; changeover.time is null."
      },
      {
        "id": "strict-003",
        "severity": "warning",
        "text": "Granulation C/O field is not readable; changeover.time is null."
      },
      {
        "id": "strict-004",
        "severity": "warning",
        "text": "Compression C/O field is not readable; changeover.time is null."
      },
      {
        "id": "strict-005",
        "severity": "info",
        "text": "Coating lead-time is transcribed as 8 hrs from this image pass; visible setup C/O is 30 min."
      },
      {
        "id": "strict-006",
        "severity": "warning",
        "text": "Analitical Lab D.T.(%) and C/O fields are not readable; changeover.time is null."
      },
      {
        "id": "strict-007",
        "severity": "warning",
        "text": "Docking C.T.(m), D.T.(%), and C/O fields are not readable; ct.value and changeover.time are null."
      },
      {
        "id": "strict-008",
        "severity": "warning",
        "text": "Shipping D.T.(%) and C/O fields are not readable from the image; changeover.time is null."
      },
      {
        "id": "strict-009",
        "severity": "warning",
        "text": "Worker counts are not visible in process boxes; workers is null for all steps."
      },
      {
        "id": "strict-010",
        "severity": "warning",
        "text": "Station=n fields in processing are inferred from visible '# of Lines' values where present."
      },
      {
        "id": "strict-011",
        "severity": "warning",
        "text": "The red badge 'LEAD TIME FROM CUSTOMER STAND POINT = 7.3' does not show explicit units; it is not normalized into step lead-time fields."
      },
      {
        "id": "strict-012",
        "severity": "warning",
        "text": "Inventory triangle labels '7 Days' and '5-7 Days' are not process boxes and are preserved only as notes."
      },
      {
        "id": "strict-013",
        "severity": "blocker",
        "text": "Demand rate, product mix, lot size policy, and shift/uptime are not fully specified in the image."
      }
    ]
  },
  "compiledForecastModel": {
    "version": "0.2.0",
    "generatedAt": "2026-03-03T16:10:06.748Z",
    "metadata": {
      "name": "Consumption Report VSM",
      "units": "per-hour",
      "mode": "constraint-forecast-non-des"
    },
    "graph": {
      "metadata": {
        "name": "Consumption Report VSM",
        "units": "minutes",
        "source": "User-provided VSM image (strict transcription refresh, 2026-03-03)"
      },
      "nodes": [
        {
          "id": "receiving",
          "label": "Receiving",
          "type": "process",
          "boxData": {
            "ctRaw": "30 min",
            "changeoverRaw": null,
            "waitRaw": "8 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "D.T. (%) = n/a",
              "Bottom timeline (process): 0.05"
            ]
          }
        },
        {
          "id": "micro",
          "label": "Micro",
          "type": "process",
          "boxData": {
            "ctRaw": "8 hrs",
            "changeoverRaw": null,
            "waitRaw": "8 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Bottom timeline (process): 1.0"
            ]
          }
        },
        {
          "id": "granulation",
          "label": "Granulation",
          "type": "process",
          "boxData": {
            "ctRaw": "10.55",
            "changeoverRaw": null,
            "waitRaw": "8 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": "# of Lines: 2",
            "notesRaw": [
              "D.T. (%) = 39%",
              "OEE = 52.67%",
              "Bottom timeline (process): 0.1"
            ]
          }
        },
        {
          "id": "compression",
          "label": "Compression",
          "type": "process",
          "boxData": {
            "ctRaw": "175",
            "changeoverRaw": null,
            "waitRaw": "8 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": "# of Lines: 3",
            "notesRaw": [
              "D.T. (%) = 36.72%",
              "OEE = 49.13%",
              "Bottom timeline (process): 0.31"
            ]
          }
        },
        {
          "id": "coating",
          "label": "Coating",
          "type": "process",
          "boxData": {
            "ctRaw": "204",
            "changeoverRaw": "30",
            "waitRaw": "8 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": "# of Lines: 2",
            "notesRaw": [
              "D.T. (%) = 30.40%",
              "OEE = 49.14%",
              "Bottom timeline (process): 0.15"
            ]
          }
        },
        {
          "id": "printing",
          "label": "Printing",
          "type": "process",
          "boxData": {
            "ctRaw": "150",
            "changeoverRaw": "40",
            "waitRaw": "8 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": "# of Lines: 2",
            "notesRaw": [
              "D.T. (%) = 37.90%",
              "OEE = 48.56%",
              "Bottom timeline (process): 0.12"
            ]
          }
        },
        {
          "id": "analitical_lab",
          "label": "Analitical Lab",
          "type": "process",
          "boxData": {
            "ctRaw": "16 hrs",
            "changeoverRaw": null,
            "waitRaw": "48 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Bottom timeline (process): 0.90"
            ]
          }
        },
        {
          "id": "packaging",
          "label": "Packaging",
          "type": "process",
          "boxData": {
            "ctRaw": "30",
            "changeoverRaw": "210",
            "waitRaw": "48 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": "# of Lines: 1.00",
            "notesRaw": [
              "D.T. (%) = 53.25%",
              "OEE = 48.30%",
              "Lot Size = 10.00",
              "Bottom timeline (process): 1.34"
            ]
          }
        },
        {
          "id": "docking",
          "label": "Docking",
          "type": "process",
          "boxData": {
            "ctRaw": null,
            "changeoverRaw": null,
            "waitRaw": "8 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Bottom timeline (process): 0.03"
            ]
          }
        },
        {
          "id": "shipping",
          "label": "Shipping",
          "type": "process",
          "boxData": {
            "ctRaw": "8 hrs",
            "changeoverRaw": null,
            "waitRaw": "8 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": null,
            "notesRaw": [
              "Inventory triangle note: 5-7 Days"
            ]
          }
        }
      ],
      "edges": [
        {
          "from": "receiving",
          "to": "micro",
          "probability": 1
        },
        {
          "from": "micro",
          "to": "granulation",
          "probability": 1
        },
        {
          "from": "granulation",
          "to": "compression",
          "probability": 1
        },
        {
          "from": "compression",
          "to": "coating",
          "probability": 1
        },
        {
          "from": "coating",
          "to": "printing",
          "probability": 1
        },
        {
          "from": "printing",
          "to": "analitical_lab",
          "probability": 1
        },
        {
          "from": "analitical_lab",
          "to": "packaging",
          "probability": 1
        },
        {
          "from": "packaging",
          "to": "docking",
          "probability": 1
        },
        {
          "from": "docking",
          "to": "shipping",
          "probability": 1
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
      }
    ],
    "inputDefaults": {
      "demandRatePerHour": 0.0563,
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
        "stepId": "receiving",
        "label": "Receiving",
        "equipmentType": "Receiving",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 30,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 480,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 30,
        "effectiveCapacityPerHour": 2,
        "baseline": {
          "demandRatePerHour": 0.0563,
          "utilization": 0.0282,
          "headroom": 0.9718,
          "queueRisk": 0.0001,
          "bottleneckIndex": 0.014,
          "status": "healthy"
        }
      },
      {
        "stepId": "micro",
        "label": "Micro",
        "equipmentType": "Micro",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 480,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 480,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 480,
        "effectiveCapacityPerHour": 0.125,
        "baseline": {
          "demandRatePerHour": 0.0563,
          "utilization": 0.4504,
          "headroom": 0.5496,
          "queueRisk": 0.0381,
          "bottleneckIndex": 0.2341,
          "status": "healthy"
        }
      },
      {
        "stepId": "granulation",
        "label": "Granulation",
        "equipmentType": "Granulation",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 2,
        "ctMinutes": 10.55,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 480,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 10.55,
        "effectiveCapacityPerHour": 11.3744,
        "baseline": {
          "demandRatePerHour": 0.0563,
          "utilization": 0.0049,
          "headroom": 0.9951,
          "queueRisk": 0,
          "bottleneckIndex": 0.0025,
          "status": "healthy"
        }
      },
      {
        "stepId": "compression",
        "label": "Compression",
        "equipmentType": "Compression",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 3,
        "ctMinutes": 175,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 480,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 175,
        "effectiveCapacityPerHour": 1.0286,
        "baseline": {
          "demandRatePerHour": 0.0563,
          "utilization": 0.0547,
          "headroom": 0.9453,
          "queueRisk": 0.0003,
          "bottleneckIndex": 0.0272,
          "status": "healthy"
        }
      },
      {
        "stepId": "coating",
        "label": "Coating",
        "equipmentType": "Coating",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 2,
        "ctMinutes": 204,
        "changeoverMinutes": 30,
        "changeoverPenaltyPerUnitMinutes": 0.75,
        "leadTimeMinutes": 480,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 204.75,
        "effectiveCapacityPerHour": 0.5861,
        "baseline": {
          "demandRatePerHour": 0.0563,
          "utilization": 0.0961,
          "headroom": 0.9039,
          "queueRisk": 0.0011,
          "bottleneckIndex": 0.0479,
          "status": "healthy"
        }
      },
      {
        "stepId": "printing",
        "label": "Printing",
        "equipmentType": "Printing",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 2,
        "ctMinutes": 150,
        "changeoverMinutes": 40,
        "changeoverPenaltyPerUnitMinutes": 1,
        "leadTimeMinutes": 480,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 151,
        "effectiveCapacityPerHour": 0.7947,
        "baseline": {
          "demandRatePerHour": 0.0563,
          "utilization": 0.0708,
          "headroom": 0.9292,
          "queueRisk": 0.0006,
          "bottleneckIndex": 0.0353,
          "status": "healthy"
        }
      },
      {
        "stepId": "analitical_lab",
        "label": "Analitical Lab",
        "equipmentType": "Analitical Lab",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 960,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 2880,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 960,
        "effectiveCapacityPerHour": 0.0625,
        "baseline": {
          "demandRatePerHour": 0.0563,
          "utilization": 0.9008,
          "headroom": 0.0992,
          "queueRisk": 0.8435,
          "bottleneckIndex": 0.683,
          "status": "risk"
        }
      },
      {
        "stepId": "packaging",
        "label": "Packaging",
        "equipmentType": "Packaging",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 30,
        "changeoverMinutes": 210,
        "changeoverPenaltyPerUnitMinutes": 5.25,
        "leadTimeMinutes": 2880,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 35.25,
        "effectiveCapacityPerHour": 1.7021,
        "baseline": {
          "demandRatePerHour": 0.0563,
          "utilization": 0.0331,
          "headroom": 0.9669,
          "queueRisk": 0.0001,
          "bottleneckIndex": 0.0164,
          "status": "healthy"
        }
      },
      {
        "stepId": "docking",
        "label": "Docking",
        "equipmentType": "Docking",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": null,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 480,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": null,
        "effectiveCapacityPerHour": null,
        "baseline": {
          "demandRatePerHour": 0.0563,
          "utilization": null,
          "headroom": null,
          "queueRisk": null,
          "bottleneckIndex": null,
          "status": "unknown"
        }
      },
      {
        "stepId": "shipping",
        "label": "Shipping",
        "equipmentType": "Shipping",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 480,
        "changeoverMinutes": null,
        "changeoverPenaltyPerUnitMinutes": null,
        "leadTimeMinutes": 480,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 480,
        "effectiveCapacityPerHour": 0.125,
        "baseline": {
          "demandRatePerHour": 0.0563,
          "utilization": 0.4504,
          "headroom": 0.5496,
          "queueRisk": 0.0381,
          "bottleneckIndex": 0.2341,
          "status": "healthy"
        }
      }
    ],
    "baseline": {
      "demandRatePerHour": 0.0563,
      "lineCapacityPerHour": 0.0625,
      "bottleneckStepId": "analitical_lab",
      "globalMetrics": {
        "throughput": 0.0563,
        "forecastThroughput": 0.0563,
        "throughputDelta": 0,
        "bottleneckMigration": "baseline only",
        "bottleneckIndex": 0.683,
        "brittleness": 0.3926,
        "avgQueueRisk": 0.1024,
        "totalWipQty": 12.4674,
        "worstCaseTouchTime": 2519.55,
        "totalLeadTimeMinutes": 23147.1853,
        "leadTimeDeltaMinutes": 0,
        "waitSharePct": 0.394,
        "leadTimeTopContributor": "Analitical Lab"
      },
      "nodeMetrics": {
        "receiving": {
          "utilization": 0.0282,
          "headroom": 0.9718,
          "queueRisk": 0.0001,
          "queueDepth": 0.001,
          "wipQty": 0.001,
          "completedQty": 0,
          "leadTimeMinutes": 510.0303,
          "capacityPerHour": 2,
          "bottleneckIndex": 0.014,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "micro": {
          "utilization": 0.4504,
          "headroom": 0.5496,
          "queueRisk": 0.0381,
          "queueDepth": 0.4568,
          "wipQty": 0.4568,
          "completedQty": 0,
          "leadTimeMinutes": 1179.2484,
          "capacityPerHour": 0.125,
          "bottleneckIndex": 0.2341,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "granulation": {
          "utilization": 0.0049,
          "headroom": 0.9951,
          "queueRisk": 0,
          "queueDepth": 0,
          "wipQty": 0,
          "completedQty": 0,
          "leadTimeMinutes": 490.5502,
          "capacityPerHour": 11.3744,
          "bottleneckIndex": 0.0025,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "compression": {
          "utilization": 0.0547,
          "headroom": 0.9453,
          "queueRisk": 0.0003,
          "queueDepth": 0.0039,
          "wipQty": 0.0039,
          "completedQty": 0,
          "leadTimeMinutes": 655.2288,
          "capacityPerHour": 1.0286,
          "bottleneckIndex": 0.0272,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "coating": {
          "utilization": 0.0961,
          "headroom": 0.9039,
          "queueRisk": 0.0011,
          "queueDepth": 0.0126,
          "wipQty": 0.0126,
          "completedQty": 0,
          "leadTimeMinutes": 685.2932,
          "capacityPerHour": 0.5861,
          "bottleneckIndex": 0.0479,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "printing": {
          "utilization": 0.0708,
          "headroom": 0.9292,
          "queueRisk": 0.0006,
          "queueDepth": 0.0067,
          "wipQty": 0.0067,
          "completedQty": 0,
          "leadTimeMinutes": 630.5047,
          "capacityPerHour": 0.7947,
          "bottleneckIndex": 0.0353,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "analitical_lab": {
          "utilization": 0.9008,
          "headroom": 0.0992,
          "queueRisk": 0.8435,
          "queueDepth": 11.5282,
          "wipQty": 11.5282,
          "completedQty": 0,
          "leadTimeMinutes": 14907.0321,
          "capacityPerHour": 0.0625,
          "bottleneckIndex": 0.683,
          "bottleneckFlag": true,
          "status": "critical"
        },
        "packaging": {
          "utilization": 0.0331,
          "headroom": 0.9669,
          "queueRisk": 0.0001,
          "queueDepth": 0.0014,
          "wipQty": 0.0014,
          "completedQty": 0,
          "leadTimeMinutes": 2910.0494,
          "capacityPerHour": 1.7021,
          "bottleneckIndex": 0.0164,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "docking": {
          "utilization": null,
          "headroom": null,
          "queueRisk": null,
          "queueDepth": null,
          "wipQty": null,
          "completedQty": 0,
          "leadTimeMinutes": 480,
          "capacityPerHour": null,
          "bottleneckIndex": null,
          "bottleneckFlag": false,
          "status": "unknown"
        },
        "shipping": {
          "utilization": 0.4504,
          "headroom": 0.5496,
          "queueRisk": 0.0381,
          "queueDepth": 0.4568,
          "wipQty": 0.4568,
          "completedQty": 0,
          "leadTimeMinutes": 1179.2484,
          "capacityPerHour": 0.125,
          "bottleneckIndex": 0.2341,
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
    "demandRatePerHour": 0.0563,
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
