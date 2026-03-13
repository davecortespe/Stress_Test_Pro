window.__EXPORT_BUNDLE_DATA__ = {
  "dashboardConfig": {
    "appTitle": "Discharge Flow Forecast",
    "subtitle": "",
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
      "name": null,
      "units": "hours",
      "source": "User-provided VSM image (strict transcription, 2026-03-13)"
    },
    "nodes": [
      {
        "id": "raw_material_staging_weighing",
        "label": "Raw Material Staging & Weighing",
        "type": "process",
        "boxData": {
          "ctRaw": "2.0 hrs/batch",
          "changeoverRaw": "0.5 hrs",
          "waitRaw": "8 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": "2",
          "notesRaw": [
            "# of Lines: 2",
            "# of Shifts: 2"
          ]
        }
      },
      {
        "id": "buffer_media_preparation",
        "label": "Buffer / Media Preparation",
        "type": "process",
        "boxData": {
          "ctRaw": "3.0 hrs/batch",
          "changeoverRaw": "1.0 hrs",
          "waitRaw": "12 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": "2",
          "notesRaw": [
            "# of Lines: 2",
            "# of Shifts: 2"
          ]
        }
      },
      {
        "id": "upstream_batch_transfer_to_purification",
        "label": "Upstream Batch Transfer to Purification",
        "type": "process",
        "boxData": {
          "ctRaw": "1.5 hrs/batch",
          "changeoverRaw": "0.5 hrs",
          "waitRaw": "10 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": "1",
          "notesRaw": [
            "# of Lines: 1",
            "# of Shifts: 2"
          ]
        }
      },
      {
        "id": "primary_capture_chromatography",
        "label": "Primary Capture Chromatography",
        "type": "process",
        "boxData": {
          "ctRaw": "6.0 hrs/batch",
          "changeoverRaw": "3.0 hrs",
          "waitRaw": "24 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": "2",
          "notesRaw": [
            "# of Lines: 2",
            "# of Shifts: 2"
          ]
        }
      },
      {
        "id": "intermediate_purification_step",
        "label": "Intermediate Purification Step",
        "type": "process",
        "boxData": {
          "ctRaw": "5.0 hrs/batch",
          "changeoverRaw": "2.5 hrs",
          "waitRaw": "20 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": "2",
          "notesRaw": [
            "# of Lines: 2",
            "# of Shifts: 2"
          ]
        }
      },
      {
        "id": "viral_inactivation_hold",
        "label": "Viral Inactivation / Hold",
        "type": "process",
        "boxData": {
          "ctRaw": "4.0 hrs/batch",
          "changeoverRaw": "0.5 hrs",
          "waitRaw": "16 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": "1",
          "notesRaw": [
            "# of Lines: 1",
            "# of Shifts: 2"
          ]
        }
      },
      {
        "id": "polishing_chromatography",
        "label": "Polishing Chromatography",
        "type": "process",
        "boxData": {
          "ctRaw": "6.0 hrs/batch",
          "changeoverRaw": "3.0 hrs",
          "waitRaw": "28 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": "1",
          "notesRaw": [
            "# of Lines: 1",
            "# of Shifts: 2"
          ]
        }
      },
      {
        "id": "uf_df_concentration_diafiltration",
        "label": "UF/DF Concentration & Diafiltration",
        "type": "process",
        "boxData": {
          "ctRaw": "5.0 hrs/batch",
          "changeoverRaw": "2.0 hrs",
          "waitRaw": "18 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": "1",
          "notesRaw": [
            "# of Lines: 1",
            "# of Shifts: 2"
          ]
        }
      },
      {
        "id": "bulk_fill_collection",
        "label": "Bulk Fill / Collection",
        "type": "process",
        "boxData": {
          "ctRaw": "2.0 hrs/batch",
          "changeoverRaw": "1.0 hrs",
          "waitRaw": "12 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": "1",
          "notesRaw": [
            "# of Lines: 1",
            "# of Shifts: 2"
          ]
        }
      },
      {
        "id": "sample_submission_to_qc",
        "label": "Sample Submission to QC",
        "type": "process",
        "boxData": {
          "ctRaw": "0.5 hrs/batch",
          "changeoverRaw": "0.0 hrs",
          "waitRaw": "4 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": "1",
          "notesRaw": [
            "# of Lines: 1",
            "# of Shifts: 1"
          ]
        }
      },
      {
        "id": "qc_testing_release_hold",
        "label": "QC Testing / Release Hold",
        "type": "process",
        "boxData": {
          "ctRaw": "3.0 hrs/batch",
          "changeoverRaw": "0.0 hrs",
          "waitRaw": "72 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": "1",
          "notesRaw": [
            "# of Lines: 1",
            "# of Shifts: 1"
          ]
        }
      },
      {
        "id": "final_bulk_release_to_packaging_cold_storage",
        "label": "Final Bulk Release to Packaging / Cold Storage",
        "type": "process",
        "boxData": {
          "ctRaw": "1.0 hrs/batch",
          "changeoverRaw": "0.5 hrs",
          "waitRaw": "8 hrs",
          "workersRaw": null,
          "parallelProceduresRaw": "1",
          "notesRaw": [
            "# of Lines: 1",
            "# of Shifts: 1"
          ]
        }
      }
    ],
    "edges": [
      {
        "from": "raw_material_staging_weighing",
        "to": "buffer_media_preparation",
        "probability": 1
      },
      {
        "from": "buffer_media_preparation",
        "to": "upstream_batch_transfer_to_purification",
        "probability": 1
      },
      {
        "from": "upstream_batch_transfer_to_purification",
        "to": "primary_capture_chromatography",
        "probability": 1
      },
      {
        "from": "primary_capture_chromatography",
        "to": "intermediate_purification_step",
        "probability": 1
      },
      {
        "from": "intermediate_purification_step",
        "to": "viral_inactivation_hold",
        "probability": 1
      },
      {
        "from": "viral_inactivation_hold",
        "to": "polishing_chromatography",
        "probability": 1
      },
      {
        "from": "polishing_chromatography",
        "to": "uf_df_concentration_diafiltration",
        "probability": 1
      },
      {
        "from": "uf_df_concentration_diafiltration",
        "to": "bulk_fill_collection",
        "probability": 1
      },
      {
        "from": "bulk_fill_collection",
        "to": "sample_submission_to_qc",
        "probability": 1
      },
      {
        "from": "sample_submission_to_qc",
        "to": "qc_testing_release_hold",
        "probability": 1
      },
      {
        "from": "qc_testing_release_hold",
        "to": "final_bulk_release_to_packaging_cold_storage",
        "probability": 1
      }
    ],
    "startNodes": [
      "raw_material_staging_weighing"
    ],
    "endNodes": [
      "final_bulk_release_to_packaging_cold_storage"
    ]
  },
  "masterData": {
    "products": [
      {
        "productId": "default_product",
        "family": "default",
        "mixPct": 1,
        "demandRatePerHour": null,
        "batchSize": null,
        "sellingPricePerUnit": 0
      }
    ],
    "equipment": [
      {
        "equipmentType": "Raw Material Staging & Weighing",
        "count": 2,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Buffer / Media Preparation",
        "count": 2,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Upstream Batch Transfer to Purification",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Primary Capture Chromatography",
        "count": 2,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Intermediate Purification Step",
        "count": 2,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Viral Inactivation / Hold",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Polishing Chromatography",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "UF/DF Concentration & Diafiltration",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Bulk Fill / Collection",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Sample Submission to QC",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "QC Testing / Release Hold",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      },
      {
        "equipmentType": "Final Bulk Release to Packaging / Cold Storage",
        "count": 1,
        "availability": {
          "shiftHours": null,
          "uptimePct": null
        }
      }
    ],
    "processing": [
      {
        "stepId": "raw_material_staging_weighing",
        "equipmentType": "Raw Material Staging & Weighing",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 120,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
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
        "parallelProcedures": 2,
        "workers": null,
        "shiftCount": 2,
        "sourcePtRaw": "2.0 hrs/batch",
        "changeoverRaw": "0.5 hrs",
        "sourceText": "CT 2.0 hrs/batch; Lead Time 8 hrs; C/O 0.5 hrs; # of Lines 2; # of Shifts 2"
      },
      {
        "stepId": "buffer_media_preparation",
        "equipmentType": "Buffer / Media Preparation",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 180,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 60,
              "unit": "min"
            }
          }
        },
        "wait": {
          "raw": "12 hrs"
        },
        "leadTimeMinutes": 720,
        "leadTimeRaw": "12 hrs",
        "parallelProcedures": 2,
        "workers": null,
        "shiftCount": 2,
        "sourcePtRaw": "3.0 hrs/batch",
        "changeoverRaw": "1.0 hrs",
        "sourceText": "CT 3.0 hrs/batch; Lead Time 12 hrs; C/O 1.0 hrs; # of Lines 2; # of Shifts 2"
      },
      {
        "stepId": "upstream_batch_transfer_to_purification",
        "equipmentType": "Upstream Batch Transfer to Purification",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 90,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 30,
              "unit": "min"
            }
          }
        },
        "wait": {
          "raw": "10 hrs"
        },
        "leadTimeMinutes": 600,
        "leadTimeRaw": "10 hrs",
        "parallelProcedures": 1,
        "workers": null,
        "shiftCount": 2,
        "sourcePtRaw": "1.5 hrs/batch",
        "changeoverRaw": "0.5 hrs",
        "sourceText": "CT 1.5 hrs/batch; Lead Time 10 hrs; C/O 0.5 hrs; # of Lines 1; # of Shifts 2"
      },
      {
        "stepId": "primary_capture_chromatography",
        "equipmentType": "Primary Capture Chromatography",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 360,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 180,
              "unit": "min"
            }
          }
        },
        "wait": {
          "raw": "24 hrs"
        },
        "leadTimeMinutes": 1440,
        "leadTimeRaw": "24 hrs",
        "parallelProcedures": 2,
        "workers": null,
        "shiftCount": 2,
        "sourcePtRaw": "6.0 hrs/batch",
        "changeoverRaw": "3.0 hrs",
        "sourceText": "CT 6.0 hrs/batch; Lead Time 24 hrs; C/O 3.0 hrs; # of Lines 2; # of Shifts 2"
      },
      {
        "stepId": "intermediate_purification_step",
        "equipmentType": "Intermediate Purification Step",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 300,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 150,
              "unit": "min"
            }
          }
        },
        "wait": {
          "raw": "20 hrs"
        },
        "leadTimeMinutes": 1200,
        "leadTimeRaw": "20 hrs",
        "parallelProcedures": 2,
        "workers": null,
        "shiftCount": 2,
        "sourcePtRaw": "5.0 hrs/batch",
        "changeoverRaw": "2.5 hrs",
        "sourceText": "CT 5.0 hrs/batch; Lead Time 20 hrs; C/O 2.5 hrs; # of Lines 2; # of Shifts 2"
      },
      {
        "stepId": "viral_inactivation_hold",
        "equipmentType": "Viral Inactivation / Hold",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 240,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 30,
              "unit": "min"
            }
          }
        },
        "wait": {
          "raw": "16 hrs"
        },
        "leadTimeMinutes": 960,
        "leadTimeRaw": "16 hrs",
        "parallelProcedures": 1,
        "workers": null,
        "shiftCount": 2,
        "sourcePtRaw": "4.0 hrs/batch",
        "changeoverRaw": "0.5 hrs",
        "sourceText": "CT 4.0 hrs/batch; Lead Time 16 hrs; C/O 0.5 hrs; # of Lines 1; # of Shifts 2"
      },
      {
        "stepId": "polishing_chromatography",
        "equipmentType": "Polishing Chromatography",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 360,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 180,
              "unit": "min"
            }
          }
        },
        "wait": {
          "raw": "28 hrs"
        },
        "leadTimeMinutes": 1680,
        "leadTimeRaw": "28 hrs",
        "parallelProcedures": 1,
        "workers": null,
        "shiftCount": 2,
        "sourcePtRaw": "6.0 hrs/batch",
        "changeoverRaw": "3.0 hrs",
        "sourceText": "CT 6.0 hrs/batch; Lead Time 28 hrs; C/O 3.0 hrs; # of Lines 1; # of Shifts 2"
      },
      {
        "stepId": "uf_df_concentration_diafiltration",
        "equipmentType": "UF/DF Concentration & Diafiltration",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 300,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 120,
              "unit": "min"
            }
          }
        },
        "wait": {
          "raw": "18 hrs"
        },
        "leadTimeMinutes": 1080,
        "leadTimeRaw": "18 hrs",
        "parallelProcedures": 1,
        "workers": null,
        "shiftCount": 2,
        "sourcePtRaw": "5.0 hrs/batch",
        "changeoverRaw": "2.0 hrs",
        "sourceText": "CT 5.0 hrs/batch; Lead Time 18 hrs; C/O 2.0 hrs; # of Lines 1; # of Shifts 2"
      },
      {
        "stepId": "bulk_fill_collection",
        "equipmentType": "Bulk Fill / Collection",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 120,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
          "time": {
            "dist": "fixed",
            "params": {
              "value": 60,
              "unit": "min"
            }
          }
        },
        "wait": {
          "raw": "12 hrs"
        },
        "leadTimeMinutes": 720,
        "leadTimeRaw": "12 hrs",
        "parallelProcedures": 1,
        "workers": null,
        "shiftCount": 2,
        "sourcePtRaw": "2.0 hrs/batch",
        "changeoverRaw": "1.0 hrs",
        "sourceText": "CT 2.0 hrs/batch; Lead Time 12 hrs; C/O 1.0 hrs; # of Lines 1; # of Shifts 2"
      },
      {
        "stepId": "sample_submission_to_qc",
        "equipmentType": "Sample Submission to QC",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 30,
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
          "raw": "4 hrs"
        },
        "leadTimeMinutes": 240,
        "leadTimeRaw": "4 hrs",
        "parallelProcedures": 1,
        "workers": null,
        "shiftCount": 1,
        "sourcePtRaw": "0.5 hrs/batch",
        "changeoverRaw": "0.0 hrs",
        "sourceText": "CT 0.5 hrs/batch; Lead Time 4 hrs; C/O 0.0 hrs; # of Lines 1; # of Shifts 1"
      },
      {
        "stepId": "qc_testing_release_hold",
        "equipmentType": "QC Testing / Release Hold",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 180,
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
          "raw": "72 hrs"
        },
        "leadTimeMinutes": 4320,
        "leadTimeRaw": "72 hrs",
        "parallelProcedures": 1,
        "workers": null,
        "shiftCount": 1,
        "sourcePtRaw": "3.0 hrs/batch",
        "changeoverRaw": "0.0 hrs",
        "sourceText": "CT 3.0 hrs/batch; Lead Time 72 hrs; C/O 0.0 hrs; # of Lines 1; # of Shifts 1"
      },
      {
        "stepId": "final_bulk_release_to_packaging_cold_storage",
        "equipmentType": "Final Bulk Release to Packaging / Cold Storage",
        "productKey": "*",
        "ct": {
          "dist": "fixed",
          "params": {
            "value": 60,
            "unit": "min"
          }
        },
        "changeover": {
          "rule": "none",
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
        "parallelProcedures": 1,
        "workers": null,
        "shiftCount": 1,
        "sourcePtRaw": "1.0 hrs/batch",
        "changeoverRaw": "0.5 hrs",
        "sourceText": "CT 1.0 hrs/batch; Lead Time 8 hrs; C/O 0.5 hrs; # of Lines 1; # of Shifts 1"
      }
    ],
    "assumptions": [
      {
        "id": "strict-001",
        "severity": "warning",
        "text": "The VSM name is not visible in the provided image; metadata.name is set to null."
      },
      {
        "id": "strict-002",
        "severity": "warning",
        "text": "Worker counts are not visible in the provided image; workers is set to null for all steps."
      },
      {
        "id": "strict-003",
        "severity": "info",
        "text": "Lead Time (hrs) is transcribed as explicit wait/flow-delay for each step."
      },
      {
        "id": "strict-004",
        "severity": "blocker",
        "text": "Demand rate, product mix, lot size, shift hours, and uptime are not visible in the provided image."
      }
    ]
  },
  "compiledForecastModel": {
    "version": "0.3.0",
    "generatedAt": "2026-03-13T12:27:50.331Z",
    "metadata": {
      "name": "VSM Forecast",
      "units": "per-hour",
      "mode": "constraint-forecast-non-des"
    },
    "graph": {
      "metadata": {
        "name": null,
        "units": "hours",
        "source": "User-provided VSM image (strict transcription, 2026-03-13)"
      },
      "nodes": [
        {
          "id": "raw_material_staging_weighing",
          "label": "Raw Material Staging & Weighing",
          "type": "process",
          "boxData": {
            "ctRaw": "2.0 hrs/batch",
            "changeoverRaw": "0.5 hrs",
            "waitRaw": "8 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": "2",
            "notesRaw": [
              "# of Lines: 2",
              "# of Shifts: 2"
            ]
          }
        },
        {
          "id": "buffer_media_preparation",
          "label": "Buffer / Media Preparation",
          "type": "process",
          "boxData": {
            "ctRaw": "3.0 hrs/batch",
            "changeoverRaw": "1.0 hrs",
            "waitRaw": "12 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": "2",
            "notesRaw": [
              "# of Lines: 2",
              "# of Shifts: 2"
            ]
          }
        },
        {
          "id": "upstream_batch_transfer_to_purification",
          "label": "Upstream Batch Transfer to Purification",
          "type": "process",
          "boxData": {
            "ctRaw": "1.5 hrs/batch",
            "changeoverRaw": "0.5 hrs",
            "waitRaw": "10 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": "1",
            "notesRaw": [
              "# of Lines: 1",
              "# of Shifts: 2"
            ]
          }
        },
        {
          "id": "primary_capture_chromatography",
          "label": "Primary Capture Chromatography",
          "type": "process",
          "boxData": {
            "ctRaw": "6.0 hrs/batch",
            "changeoverRaw": "3.0 hrs",
            "waitRaw": "24 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": "2",
            "notesRaw": [
              "# of Lines: 2",
              "# of Shifts: 2"
            ]
          }
        },
        {
          "id": "intermediate_purification_step",
          "label": "Intermediate Purification Step",
          "type": "process",
          "boxData": {
            "ctRaw": "5.0 hrs/batch",
            "changeoverRaw": "2.5 hrs",
            "waitRaw": "20 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": "2",
            "notesRaw": [
              "# of Lines: 2",
              "# of Shifts: 2"
            ]
          }
        },
        {
          "id": "viral_inactivation_hold",
          "label": "Viral Inactivation / Hold",
          "type": "process",
          "boxData": {
            "ctRaw": "4.0 hrs/batch",
            "changeoverRaw": "0.5 hrs",
            "waitRaw": "16 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": "1",
            "notesRaw": [
              "# of Lines: 1",
              "# of Shifts: 2"
            ]
          }
        },
        {
          "id": "polishing_chromatography",
          "label": "Polishing Chromatography",
          "type": "process",
          "boxData": {
            "ctRaw": "6.0 hrs/batch",
            "changeoverRaw": "3.0 hrs",
            "waitRaw": "28 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": "1",
            "notesRaw": [
              "# of Lines: 1",
              "# of Shifts: 2"
            ]
          }
        },
        {
          "id": "uf_df_concentration_diafiltration",
          "label": "UF/DF Concentration & Diafiltration",
          "type": "process",
          "boxData": {
            "ctRaw": "5.0 hrs/batch",
            "changeoverRaw": "2.0 hrs",
            "waitRaw": "18 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": "1",
            "notesRaw": [
              "# of Lines: 1",
              "# of Shifts: 2"
            ]
          }
        },
        {
          "id": "bulk_fill_collection",
          "label": "Bulk Fill / Collection",
          "type": "process",
          "boxData": {
            "ctRaw": "2.0 hrs/batch",
            "changeoverRaw": "1.0 hrs",
            "waitRaw": "12 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": "1",
            "notesRaw": [
              "# of Lines: 1",
              "# of Shifts: 2"
            ]
          }
        },
        {
          "id": "sample_submission_to_qc",
          "label": "Sample Submission to QC",
          "type": "process",
          "boxData": {
            "ctRaw": "0.5 hrs/batch",
            "changeoverRaw": "0.0 hrs",
            "waitRaw": "4 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": "1",
            "notesRaw": [
              "# of Lines: 1",
              "# of Shifts: 1"
            ]
          }
        },
        {
          "id": "qc_testing_release_hold",
          "label": "QC Testing / Release Hold",
          "type": "process",
          "boxData": {
            "ctRaw": "3.0 hrs/batch",
            "changeoverRaw": "0.0 hrs",
            "waitRaw": "72 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": "1",
            "notesRaw": [
              "# of Lines: 1",
              "# of Shifts: 1"
            ]
          }
        },
        {
          "id": "final_bulk_release_to_packaging_cold_storage",
          "label": "Final Bulk Release to Packaging / Cold Storage",
          "type": "process",
          "boxData": {
            "ctRaw": "1.0 hrs/batch",
            "changeoverRaw": "0.5 hrs",
            "waitRaw": "8 hrs",
            "workersRaw": null,
            "parallelProceduresRaw": "1",
            "notesRaw": [
              "# of Lines: 1",
              "# of Shifts: 1"
            ]
          }
        }
      ],
      "edges": [
        {
          "from": "raw_material_staging_weighing",
          "to": "buffer_media_preparation",
          "probability": 1
        },
        {
          "from": "buffer_media_preparation",
          "to": "upstream_batch_transfer_to_purification",
          "probability": 1
        },
        {
          "from": "upstream_batch_transfer_to_purification",
          "to": "primary_capture_chromatography",
          "probability": 1
        },
        {
          "from": "primary_capture_chromatography",
          "to": "intermediate_purification_step",
          "probability": 1
        },
        {
          "from": "intermediate_purification_step",
          "to": "viral_inactivation_hold",
          "probability": 1
        },
        {
          "from": "viral_inactivation_hold",
          "to": "polishing_chromatography",
          "probability": 1
        },
        {
          "from": "polishing_chromatography",
          "to": "uf_df_concentration_diafiltration",
          "probability": 1
        },
        {
          "from": "uf_df_concentration_diafiltration",
          "to": "bulk_fill_collection",
          "probability": 1
        },
        {
          "from": "bulk_fill_collection",
          "to": "sample_submission_to_qc",
          "probability": 1
        },
        {
          "from": "sample_submission_to_qc",
          "to": "qc_testing_release_hold",
          "probability": 1
        },
        {
          "from": "qc_testing_release_hold",
          "to": "final_bulk_release_to_packaging_cold_storage",
          "probability": 1
        }
      ],
      "startNodes": [
        "raw_material_staging_weighing"
      ],
      "endNodes": [
        "final_bulk_release_to_packaging_cold_storage"
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
      "demandRatePerHour": 0.72,
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
        "stepId": "raw_material_staging_weighing",
        "label": "Raw Material Staging & Weighing",
        "equipmentType": "Raw Material Staging & Weighing",
        "workerCount": 0,
        "parallelProcedures": 2,
        "effectiveUnits": 2,
        "ctMinutes": 120,
        "changeoverMinutes": 30,
        "changeoverPenaltyPerUnitMinutes": 30,
        "leadTimeMinutes": 480,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 150,
        "effectiveCapacityPerHour": 0.8,
        "baseline": {
          "demandRatePerHour": 0.72,
          "utilization": 0.9,
          "headroom": 0.1,
          "queueRisk": 0.81,
          "bottleneckIndex": 0.675,
          "status": "risk"
        }
      },
      {
        "stepId": "buffer_media_preparation",
        "label": "Buffer / Media Preparation",
        "equipmentType": "Buffer / Media Preparation",
        "workerCount": 0,
        "parallelProcedures": 2,
        "effectiveUnits": 2,
        "ctMinutes": 180,
        "changeoverMinutes": 60,
        "changeoverPenaltyPerUnitMinutes": 60,
        "leadTimeMinutes": 720,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 240,
        "effectiveCapacityPerHour": 0.5,
        "baseline": {
          "demandRatePerHour": 0.72,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 0.944,
          "status": "critical"
        }
      },
      {
        "stepId": "upstream_batch_transfer_to_purification",
        "label": "Upstream Batch Transfer to Purification",
        "equipmentType": "Upstream Batch Transfer to Purification",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 90,
        "changeoverMinutes": 30,
        "changeoverPenaltyPerUnitMinutes": 30,
        "leadTimeMinutes": 600,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 120,
        "effectiveCapacityPerHour": 0.5,
        "baseline": {
          "demandRatePerHour": 0.72,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 0.944,
          "status": "critical"
        }
      },
      {
        "stepId": "primary_capture_chromatography",
        "label": "Primary Capture Chromatography",
        "equipmentType": "Primary Capture Chromatography",
        "workerCount": 0,
        "parallelProcedures": 2,
        "effectiveUnits": 2,
        "ctMinutes": 360,
        "changeoverMinutes": 180,
        "changeoverPenaltyPerUnitMinutes": 180,
        "leadTimeMinutes": 1440,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 540,
        "effectiveCapacityPerHour": 0.2222,
        "baseline": {
          "demandRatePerHour": 0.72,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 1,
          "status": "critical"
        }
      },
      {
        "stepId": "intermediate_purification_step",
        "label": "Intermediate Purification Step",
        "equipmentType": "Intermediate Purification Step",
        "workerCount": 0,
        "parallelProcedures": 2,
        "effectiveUnits": 2,
        "ctMinutes": 300,
        "changeoverMinutes": 150,
        "changeoverPenaltyPerUnitMinutes": 150,
        "leadTimeMinutes": 1200,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 450,
        "effectiveCapacityPerHour": 0.2667,
        "baseline": {
          "demandRatePerHour": 0.72,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 1,
          "status": "critical"
        }
      },
      {
        "stepId": "viral_inactivation_hold",
        "label": "Viral Inactivation / Hold",
        "equipmentType": "Viral Inactivation / Hold",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 240,
        "changeoverMinutes": 30,
        "changeoverPenaltyPerUnitMinutes": 30,
        "leadTimeMinutes": 960,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 270,
        "effectiveCapacityPerHour": 0.2222,
        "baseline": {
          "demandRatePerHour": 0.72,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 1,
          "status": "critical"
        }
      },
      {
        "stepId": "polishing_chromatography",
        "label": "Polishing Chromatography",
        "equipmentType": "Polishing Chromatography",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 360,
        "changeoverMinutes": 180,
        "changeoverPenaltyPerUnitMinutes": 180,
        "leadTimeMinutes": 1680,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 540,
        "effectiveCapacityPerHour": 0.1111,
        "baseline": {
          "demandRatePerHour": 0.72,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 1,
          "status": "critical"
        }
      },
      {
        "stepId": "uf_df_concentration_diafiltration",
        "label": "UF/DF Concentration & Diafiltration",
        "equipmentType": "UF/DF Concentration & Diafiltration",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 300,
        "changeoverMinutes": 120,
        "changeoverPenaltyPerUnitMinutes": 120,
        "leadTimeMinutes": 1080,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 420,
        "effectiveCapacityPerHour": 0.1429,
        "baseline": {
          "demandRatePerHour": 0.72,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 1,
          "status": "critical"
        }
      },
      {
        "stepId": "bulk_fill_collection",
        "label": "Bulk Fill / Collection",
        "equipmentType": "Bulk Fill / Collection",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 120,
        "changeoverMinutes": 60,
        "changeoverPenaltyPerUnitMinutes": 60,
        "leadTimeMinutes": 720,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 180,
        "effectiveCapacityPerHour": 0.3333,
        "baseline": {
          "demandRatePerHour": 0.72,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 1,
          "status": "critical"
        }
      },
      {
        "stepId": "sample_submission_to_qc",
        "label": "Sample Submission to QC",
        "equipmentType": "Sample Submission to QC",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 30,
        "changeoverMinutes": 0,
        "changeoverPenaltyPerUnitMinutes": 0,
        "leadTimeMinutes": 240,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 30,
        "effectiveCapacityPerHour": 2,
        "baseline": {
          "demandRatePerHour": 0.72,
          "utilization": 0.36,
          "headroom": 0.64,
          "queueRisk": 0.0203,
          "bottleneckIndex": 0.1789,
          "status": "healthy"
        }
      },
      {
        "stepId": "qc_testing_release_hold",
        "label": "QC Testing / Release Hold",
        "equipmentType": "QC Testing / Release Hold",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 180,
        "changeoverMinutes": 0,
        "changeoverPenaltyPerUnitMinutes": 0,
        "leadTimeMinutes": 4320,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 180,
        "effectiveCapacityPerHour": 0.3333,
        "baseline": {
          "demandRatePerHour": 0.72,
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 1,
          "status": "critical"
        }
      },
      {
        "stepId": "final_bulk_release_to_packaging_cold_storage",
        "label": "Final Bulk Release to Packaging / Cold Storage",
        "equipmentType": "Final Bulk Release to Packaging / Cold Storage",
        "workerCount": 0,
        "parallelProcedures": 1,
        "effectiveUnits": 1,
        "ctMinutes": 60,
        "changeoverMinutes": 30,
        "changeoverPenaltyPerUnitMinutes": 30,
        "leadTimeMinutes": 480,
        "variabilityCv": 0.18,
        "effectiveCtMinutes": 90,
        "effectiveCapacityPerHour": 0.6667,
        "baseline": {
          "demandRatePerHour": 0.72,
          "utilization": 1.0799,
          "headroom": 0,
          "queueRisk": 1,
          "bottleneckIndex": 0.8264,
          "status": "critical"
        }
      }
    ],
    "baseline": {
      "demandRatePerHour": 0.72,
      "lineCapacityPerHour": 0.1111,
      "bottleneckStepId": "polishing_chromatography",
      "globalMetrics": {
        "throughput": 0.1111,
        "globalThroughput": 0.1111,
        "forecastThroughput": 0.1111,
        "throughputDelta": 0,
        "bottleneckMigration": "baseline only",
        "bottleneckIndex": 1,
        "brittleness": 0.8803,
        "avgQueueRisk": 0.9025,
        "totalWipQty": 380.4002,
        "worstCaseTouchTime": 2340,
        "totalLeadTimeMinutes": 98949.2052,
        "leadTimeDeltaMinutes": 0,
        "waitSharePct": 0.1407,
        "leadTimeTopContributor": "Polishing Chromatography"
      },
      "nodeMetrics": {
        "raw_material_staging_weighing": {
          "utilization": 0.9,
          "headroom": 0.1,
          "queueRisk": 0.81,
          "queueDepth": 11.26,
          "wipQty": 11.26,
          "completedQty": 0,
          "leadTimeMinutes": 1444.5,
          "capacityPerHour": 0.8,
          "bottleneckIndex": 0.675,
          "bottleneckFlag": false,
          "status": "risk"
        },
        "buffer_media_preparation": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 17.32,
          "wipQty": 22.6,
          "completedQty": 0,
          "leadTimeMinutes": 2978.4,
          "capacityPerHour": 0.5,
          "bottleneckIndex": 0.944,
          "bottleneckFlag": false,
          "status": "critical"
        },
        "upstream_batch_transfer_to_purification": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 17.32,
          "wipQty": 22.6,
          "completedQty": 0,
          "leadTimeMinutes": 2768.4,
          "capacityPerHour": 0.5,
          "bottleneckIndex": 0.944,
          "bottleneckFlag": false,
          "status": "critical"
        },
        "primary_capture_chromatography": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 29.9223,
          "wipQty": 41.8695,
          "completedQty": 0,
          "leadTimeMinutes": 9879.8204,
          "capacityPerHour": 0.2222,
          "bottleneckIndex": 1,
          "bottleneckFlag": false,
          "status": "critical"
        },
        "intermediate_purification_step": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 26.1376,
          "wipQty": 37.0168,
          "completedQty": 0,
          "leadTimeMinutes": 7380.2335,
          "capacityPerHour": 0.2667,
          "bottleneckIndex": 1,
          "bottleneckFlag": false,
          "status": "critical"
        },
        "viral_inactivation_hold": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 29.9223,
          "wipQty": 41.8695,
          "completedQty": 0,
          "leadTimeMinutes": 9279.8204,
          "capacityPerHour": 0.2222,
          "bottleneckIndex": 1,
          "bottleneckFlag": false,
          "status": "critical"
        },
        "polishing_chromatography": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 52.6045,
          "wipQty": 67.2181,
          "completedQty": 0,
          "leadTimeMinutes": 30449.2906,
          "capacityPerHour": 0.1111,
          "bottleneckIndex": 1,
          "bottleneckFlag": true,
          "status": "critical"
        },
        "uf_df_concentration_diafiltration": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 42.5094,
          "wipQty": 56.3598,
          "completedQty": 0,
          "leadTimeMinutes": 19228.6015,
          "capacityPerHour": 0.1429,
          "bottleneckIndex": 1,
          "bottleneckFlag": false,
          "status": "critical"
        },
        "bulk_fill_collection": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 22.3615,
          "wipQty": 31.6423,
          "completedQty": 0,
          "leadTimeMinutes": 4865.4747,
          "capacityPerHour": 0.3333,
          "bottleneckIndex": 1,
          "bottleneckFlag": false,
          "status": "critical"
        },
        "sample_submission_to_qc": {
          "utilization": 0.36,
          "headroom": 0.64,
          "queueRisk": 0.0203,
          "queueDepth": 0.243,
          "wipQty": 0.243,
          "completedQty": 0,
          "leadTimeMinutes": 277.29,
          "capacityPerHour": 2,
          "bottleneckIndex": 0.1789,
          "bottleneckFlag": false,
          "status": "healthy"
        },
        "qc_testing_release_hold": {
          "utilization": 1.35,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 22.3615,
          "wipQty": 31.6423,
          "completedQty": 0,
          "leadTimeMinutes": 8525.4747,
          "capacityPerHour": 0.3333,
          "bottleneckIndex": 1,
          "bottleneckFlag": false,
          "status": "critical"
        },
        "final_bulk_release_to_packaging_cold_storage": {
          "utilization": 1.0799,
          "headroom": 0,
          "queueRisk": 1,
          "queueDepth": 14.7996,
          "wipQty": 16.0788,
          "completedQty": 0,
          "leadTimeMinutes": 1871.8994,
          "capacityPerHour": 0.6667,
          "bottleneckIndex": 0.8264,
          "bottleneckFlag": false,
          "status": "critical"
        }
      }
    },
    "assumptions": [
      {
        "id": "strict-001",
        "severity": "warning",
        "text": "The VSM name is not visible in the provided image; metadata.name is set to null."
      },
      {
        "id": "strict-002",
        "severity": "warning",
        "text": "Worker counts are not visible in the provided image; workers is set to null for all steps."
      },
      {
        "id": "strict-003",
        "severity": "info",
        "text": "Lead Time (hrs) is transcribed as explicit wait/flow-delay for each step."
      },
      {
        "id": "strict-004",
        "severity": "blocker",
        "text": "Demand rate, product mix, lot size, shift hours, and uptime are not visible in the provided image."
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
        "text": "Visible changeover minutes without a visible lot size are converted to per-unit setup penalty using a lot-size fallback of 1."
      },
      {
        "id": "compile-005",
        "severity": "info",
        "text": "Queue risk, bottleneck index, brittleness, and migration outputs are deterministic non-DES forecast heuristics for rapid recompute."
      }
    ]
  },
  "operationalDiagnosis": {
    "status": "overloaded",
    "statusSummary": "Primary Capture Chromatography is no longer clearing work at the required rate. The system is effectively overloaded, so queue and WIP growth will continue until load is reduced or capacity is added.",
    "primaryConstraint": "Primary Capture Chromatography is the current system constraint.",
    "constraintMechanism": "Primary Capture Chromatography is taking demand at about 0.720 units/hr but only clearing about 0.222 units/hr, so arrivals are outrunning service and the queue cannot normalize.",
    "downstreamEffects": "Throughput is running about 85% below required rate, WIP has built to roughly 23 units, total lead time is now about 19430.5 minutes, and operators should expect more expediting, rescheduling, and service risk if this state persists.",
    "economicInterpretation": "This is creating hidden capacity loss of roughly 85% versus required output. The likely business impact is overtime pressure, slower inventory availability, and missed throughput that has to be recovered later.",
    "recommendedAction": "Reduce effective cycle time at Primary Capture Chromatography with standard work, faster changeovers, or error removal before spending on larger structural changes.",
    "scenarioGuidance": "Scenario comparison is limited. Current outputs do not show a materially better tested scenario than the active case.",
    "aiOpportunityLens": {
      "dataAlreadyExists": "Utilization, queue, WIP, and lead-time data already exist here but are usually reviewed as separate metrics instead of as one flow signal.",
      "manualPatternDecisions": "Labor rebalance, release timing, and expediting decisions are still manual even though the patterns are repetitive and detectable from the same simulation outputs.",
      "predictiveGap": "Most current reporting is backward-looking. The diagnosis should be used to flag where the next queue spike or throughput miss is likely before the floor feels it.",
      "tribalKnowledge": "If step recovery depends on supervisor memory, shift handoff notes, or email threads, that is acting like an unstructured operating database.",
      "visibilityGap": "When operators cannot see where queue pressure will propagate next, the business leaks profit through avoidable delay, premium labor, and hidden capacity loss."
    },
    "confidence": "low",
    "confidenceNote": "Confidence is low because key inputs are incomplete. Missing or weak fields: staffing/equipment counts, wait-time units, demand rate/product mix, shift hours/uptime, lot-size policy, changeover/setup times."
  },
  "scenarioCommitted": {
    "demandRatePerHour": 0.72,
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
  }
};
window.__EXPORT_COMMITTED_SCENARIO__ = window.__EXPORT_BUNDLE_DATA__.scenarioCommitted;
