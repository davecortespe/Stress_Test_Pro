# Cordless Power Drill Assembly Line - Executive Report Export

Mode: `consulting_grade_organization`

## Sections
- **Cover**: Orient the reader with title, status, and report framing. (pages 1)
- **Executive Summary**: Surface the primary message without changing the source wording. (pages 2)
- **Context / Problem Statement**: Frame the operating context and current system evidence. (pages 3)
- **Analysis / Diagnostic Findings**: Present the current diagnosis as a structured storyline. (pages 4)
- **Implications / Opportunities**: Group business implications and opportunity framing from existing content. (pages 5)
- **Recommendations / Next Steps**: Present the current recommendation and guidance without rewriting. (pages 6)
- **Appendix / Evidence**: Provide supporting evidence, assumptions, and traceability. (pages 7, 8, 9, 10)

## Pages

### 1. Cordless Power Drill Assembly Line
- Section: Cover
- Layout: `cover_title_status`
- Content groups:
  - Title Block
    - appTitle [models/dashboard_config.json#/appTitle]: Cordless Power Drill Assembly Line
    - subtitle [models/dashboard_config.json#/subtitle]: FlowStress Dynamics™ | Non-DES Rapid Flow Simulation
  - Report Status
    - status [models/active/operational_diagnosis.json#/status]: overloaded
    - confidence [models/active/operational_diagnosis.json#/confidence]: medium
- Formatting notes:
  - Use a restrained cover layout with title, subtitle, and status strip only.
  - Keep the page visually sparse with strong whitespace and no dense tables.
- Reviewer notes:
  - This page should orient the reader quickly without restating the full diagnosis.

### 2. Executive Summary
- Section: Executive Summary
- Layout: `executive_summary_three_block`
- Content groups:
  - Current State
    - statusSummary [models/active/operational_diagnosis.json#/statusSummary]: Final Drill Assembly is no longer clearing work at the required rate. The system is effectively overloaded, so queue and WIP growth will continue until load is reduced or capacity is added.
  - Primary Constraint
    - primaryConstraint [models/active/operational_diagnosis.json#/primaryConstraint]: Final Drill Assembly is the current constraint, and downstream congestion at Functional Test is preventing that queue from clearing cleanly.
  - Recommended Action
    - recommendedAction [models/active/operational_diagnosis.json#/recommendedAction]: Stabilize the handoff between Final Drill Assembly and Functional Test first. Clear downstream WIP before releasing more work, and rebalance labor by queue pressure instead of fixed headcount.
- Formatting notes:
  - Treat each source sentence as its own executive block.
  - Do not rewrite or compress the wording; only improve hierarchy.
- Reviewer notes:
  - Use this page for leadership readout and preserve the source sentences exactly.

### 3. Current System Context
- Section: Context / Problem Statement
- Layout: `context_overview_with_metrics`
- Content groups:
  - Model Context
    - name [models/active/compiled_forecast_model.json#/metadata/name]: Cordless Power Drill Assembly Line
    - mode [models/active/compiled_forecast_model.json#/metadata/mode]: constraint-forecast-non-des
    - units [models/active/compiled_forecast_model.json#/metadata/units]: per-hour
  - Current Global Metrics
    - simElapsedHours [models/active/result_metrics.json#/globalMetrics/simElapsedHours]: `168`
    - globalThroughput [models/active/result_metrics.json#/globalMetrics/globalThroughput]: `1.6129032258064773`
    - totalCompletedOutputPieces [models/active/result_metrics.json#/globalMetrics/totalCompletedOutputPieces]: `270.96774193548816`
    - totalWipQty [models/active/result_metrics.json#/globalMetrics/totalWipQty]: `3509.0322580644006`
    - totalLeadTimeMinutes [models/active/result_metrics.json#/globalMetrics/totalLeadTimeMinutes]: `25784.43320945361`
    - bottleneckMigration [models/active/result_metrics.json#/globalMetrics/bottleneckMigration]: Final Drill Assembly -> Functional Test (low confidence)
    - bottleneckIndex [models/active/result_metrics.json#/globalMetrics/bottleneckIndex]: `1`
    - brittleness [models/active/result_metrics.json#/globalMetrics/brittleness]: `0.6296653320731842`
- Formatting notes:
  - Use a clean two-zone layout: context on the left, key numeric evidence on the right.
  - Keep raw metric labels visible so reviewers can trace them back to source artifacts.
- Reviewer notes:
  - This page should frame the operating state before deeper diagnosis pages.

### 4. Operational Diagnosis
- Section: Analysis / Diagnostic Findings
- Layout: `diagnosis_storyline`
- Content groups:
  - Constraint Definition
    - primaryConstraint [models/active/operational_diagnosis.json#/primaryConstraint]: Final Drill Assembly is the current constraint, and downstream congestion at Functional Test is preventing that queue from clearing cleanly.
    - constraintMechanism [models/active/operational_diagnosis.json#/constraintMechanism]: Final Drill Assembly is not failing in isolation. Functional Test is also congested, so downstream WIP is not clearing fast enough and the blockage propagates back upstream.
  - Downstream Effects
    - downstreamEffects [models/active/operational_diagnosis.json#/downstreamEffects]: Throughput is running about 93% below required rate, WIP has built to roughly 3509 units, total lead time is now about 25784.4 minutes, and operators should expect more expediting, rescheduling, and service risk if this state persists.
- Formatting notes:
  - One diagnostic storyline per page: constraint, mechanism, and downstream effects.
  - Use stacked callout blocks rather than long continuous paragraphs.
- Reviewer notes:
  - Keep this page tightly tied to the source diagnosis fields without adding interpretation.

### 5. Implications and Opportunity Lens
- Section: Implications / Opportunities
- Layout: `implications_with_callouts`
- Content groups:
  - Business Implications
    - economicInterpretation [models/active/operational_diagnosis.json#/economicInterpretation]: This is creating hidden capacity loss of roughly 93% versus required output. The likely business impact is overtime pressure, slower inventory availability, and missed throughput that has to be recovered later.
  - AI Opportunity Lens
    - dataAlreadyExists [models/active/operational_diagnosis.json#/aiOpportunityLens/dataAlreadyExists]: Utilization, queue, WIP, and lead-time data already exist here but are usually reviewed as separate metrics instead of as one flow signal.
    - manualPatternDecisions [models/active/operational_diagnosis.json#/aiOpportunityLens/manualPatternDecisions]: Labor rebalance, release timing, and expediting decisions are still manual even though the patterns are repetitive and detectable from the same simulation outputs.
    - predictiveGap [models/active/operational_diagnosis.json#/aiOpportunityLens/predictiveGap]: Most current reporting is backward-looking. The diagnosis should be used to flag where the next queue spike or throughput miss is likely before the floor feels it.
    - tribalKnowledge [models/active/operational_diagnosis.json#/aiOpportunityLens/tribalKnowledge]: If step recovery depends on supervisor memory, shift handoff notes, or email threads, that is acting like an unstructured operating database.
    - visibilityGap [models/active/operational_diagnosis.json#/aiOpportunityLens/visibilityGap]: When operators cannot see where queue pressure will propagate next, the business leaks profit through avoidable delay, premium labor, and hidden capacity loss.
- Formatting notes:
  - Use one implication block and one structured lens block with consistent callout styling.
  - Preserve all uncertainty and cautionary wording.
- Reviewer notes:
  - This page should remain credible and restrained rather than promotional.

### 6. Recommendations and Next Steps
- Section: Recommendations / Next Steps
- Layout: `recommendation_with_guidance`
- Content groups:
  - Recommended Action
    - recommendedAction [models/active/operational_diagnosis.json#/recommendedAction]: Stabilize the handoff between Final Drill Assembly and Functional Test first. Clear downstream WIP before releasing more work, and rebalance labor by queue pressure instead of fixed headcount.
  - Scenario Guidance
    - scenarioGuidance [models/active/operational_diagnosis.json#/scenarioGuidance]: The current relief scenario is directionally right. It improves throughput by about 0.660 units/hr, and it also changes bottleneck behavior to Final Drill Assembly -> Functional Test (low confidence).
  - Confidence
    - confidence [models/active/operational_diagnosis.json#/confidence]: medium
    - confidenceNote [models/active/operational_diagnosis.json#/confidenceNote]: Confidence is medium because key inputs are incomplete. Missing or weak fields: shift hours/uptime, demand rate/product mix.
- Formatting notes:
  - Place the action on the page as the dominant block and supporting guidance beneath it.
  - Keep confidence and evidence-gap wording visible rather than burying it in footer notes.
- Reviewer notes:
  - This page is suitable for discussion of immediate next moves without changing source wording.

### 7. Global Metric Appendix
- Section: Appendix / Evidence
- Layout: `appendix_metric_table`
- Content groups:
  - Global Metrics
    - simElapsedHours [models/active/result_metrics.json#/globalMetrics/simElapsedHours]: `168`
    - forecastThroughput [models/active/result_metrics.json#/globalMetrics/forecastThroughput]: `1.6129032258064773`
    - steadyStateThroughput [models/active/result_metrics.json#/globalMetrics/steadyStateThroughput]: `1.6129032258064515`
    - throughputState [models/active/result_metrics.json#/globalMetrics/throughputState]: steady-state
    - warmupHours [models/active/result_metrics.json#/globalMetrics/warmupHours]: `0.7433333333333333`
    - totalCompletedOutputPieces [models/active/result_metrics.json#/globalMetrics/totalCompletedOutputPieces]: `270.96774193548816`
    - totalWipQty [models/active/result_metrics.json#/globalMetrics/totalWipQty]: `3509.0322580644006`
    - worstCaseTouchTime [models/active/result_metrics.json#/globalMetrics/worstCaseTouchTime]: `41`
    - totalLeadTimeMinutes [models/active/result_metrics.json#/globalMetrics/totalLeadTimeMinutes]: `25784.43320945361`
    - leadTimeDeltaMinutes [models/active/result_metrics.json#/globalMetrics/leadTimeDeltaMinutes]: `14221.396909453611`
    - waitSharePct [models/active/result_metrics.json#/globalMetrics/waitSharePct]: `0.012255456516458995`
    - leadTimeTopContributor [models/active/result_metrics.json#/globalMetrics/leadTimeTopContributor]: Housing Kit Prep
    - throughputDelta [models/active/result_metrics.json#/globalMetrics/throughputDelta]: `0.659824046920821`
    - bottleneckMigration [models/active/result_metrics.json#/globalMetrics/bottleneckMigration]: Final Drill Assembly -> Functional Test (low confidence)
    - bottleneckIndex [models/active/result_metrics.json#/globalMetrics/bottleneckIndex]: `1`
    - brittleness [models/active/result_metrics.json#/globalMetrics/brittleness]: `0.6296653320731842`
    - littleLawResidualPct [models/active/result_metrics.json#/globalMetrics/littleLawResidualPct]: `4.062589467824092`
    - globalThroughput [models/active/result_metrics.json#/globalMetrics/globalThroughput]: `1.6129032258064773`
- Formatting notes:
  - Use an appendix-style metric table with strong alignment and ample row spacing.
  - Keep raw metric keys and values fully traceable to the source file.
- Reviewer notes:
  - This page is intended for evidence review, not for introducing new narrative.

### 8. Detailed Step Metrics (1/2)
- Section: Appendix / Evidence
- Layout: `appendix_step_metric_grid`
- Content groups:
  - Housing Kit Prep
    - utilization [models/active/result_metrics.json#/nodeMetrics/housing_kit_prep/utilization]: `0.2122605302960596`
    - headroom [models/active/result_metrics.json#/nodeMetrics/housing_kit_prep/headroom]: `0.7877394697039404`
    - queueRisk [models/active/result_metrics.json#/nodeMetrics/housing_kit_prep/queueRisk]: `0.2122605302960596`
    - queueDepth [models/active/result_metrics.json#/nodeMetrics/housing_kit_prep/queueDepth]: `3482.8352575854024`
    - wipQty [models/active/result_metrics.json#/nodeMetrics/housing_kit_prep/wipQty]: `3482.8352575854024`
    - completedQty [models/active/result_metrics.json#/nodeMetrics/housing_kit_prep/completedQty]: `0`
    - idleWaitHours [models/active/result_metrics.json#/nodeMetrics/housing_kit_prep/idleWaitHours]: `44.085850800085964`
    - idleWaitPct [models/active/result_metrics.json#/nodeMetrics/housing_kit_prep/idleWaitPct]: `0.7872473357158208`
    - leadTimeMinutes [models/active/result_metrics.json#/nodeMetrics/housing_kit_prep/leadTimeMinutes]: `25093.813854614902`
    - capacityPerHour [models/active/result_metrics.json#/nodeMetrics/housing_kit_prep/capacityPerHour]: `8.333333333333332`
    - bottleneckIndex [models/active/result_metrics.json#/nodeMetrics/housing_kit_prep/bottleneckIndex]: `0.2122605302960596`
    - bottleneckFlag [models/active/result_metrics.json#/nodeMetrics/housing_kit_prep/bottleneckFlag]: `false`
    - status [models/active/result_metrics.json#/nodeMetrics/housing_kit_prep/status]: healthy
  - Motor Assembly
    - utilization [models/active/result_metrics.json#/nodeMetrics/motor_assembly/utilization]: `0.38838787986578854`
    - headroom [models/active/result_metrics.json#/nodeMetrics/motor_assembly/headroom]: `0.6116121201342115`
    - queueRisk [models/active/result_metrics.json#/nodeMetrics/motor_assembly/queueRisk]: `0.38838787986578854`
    - queueDepth [models/active/result_metrics.json#/nodeMetrics/motor_assembly/queueDepth]: `7.168458781362005`
    - wipQty [models/active/result_metrics.json#/nodeMetrics/motor_assembly/wipQty]: `7.168458781362005`
    - completedQty [models/active/result_metrics.json#/nodeMetrics/motor_assembly/completedQty]: `0`
    - idleWaitHours [models/active/result_metrics.json#/nodeMetrics/motor_assembly/idleWaitHours]: `34.25027872751602`
    - idleWaitPct [models/active/result_metrics.json#/nodeMetrics/motor_assembly/idleWaitPct]: `0.6116121201342146`
    - leadTimeMinutes [models/active/result_metrics.json#/nodeMetrics/motor_assembly/leadTimeMinutes]: `129.27419354838707`
    - capacityPerHour [models/active/result_metrics.json#/nodeMetrics/motor_assembly/capacityPerHour]: `4.444444444444445`
    - bottleneckIndex [models/active/result_metrics.json#/nodeMetrics/motor_assembly/bottleneckIndex]: `0.38838787986578854`
    - bottleneckFlag [models/active/result_metrics.json#/nodeMetrics/motor_assembly/bottleneckFlag]: `false`
    - status [models/active/result_metrics.json#/nodeMetrics/motor_assembly/status]: healthy
  - Gearbox Assembly
    - utilization [models/active/result_metrics.json#/nodeMetrics/gearbox_assembly/utilization]: `0.23407908428720414`
    - headroom [models/active/result_metrics.json#/nodeMetrics/gearbox_assembly/headroom]: `0.7659209157127959`
    - queueRisk [models/active/result_metrics.json#/nodeMetrics/gearbox_assembly/queueRisk]: `0.23407908428720414`
    - queueDepth [models/active/result_metrics.json#/nodeMetrics/gearbox_assembly/queueDepth]: `9.101382488479262`
    - wipQty [models/active/result_metrics.json#/nodeMetrics/gearbox_assembly/wipQty]: `9.101382488479262`
    - completedQty [models/active/result_metrics.json#/nodeMetrics/gearbox_assembly/completedQty]: `0`
    - idleWaitHours [models/active/result_metrics.json#/nodeMetrics/gearbox_assembly/idleWaitHours]: `42.53386793232027`
    - idleWaitPct [models/active/result_metrics.json#/nodeMetrics/gearbox_assembly/idleWaitPct]: `0.7595333559342905`
    - leadTimeMinutes [models/active/result_metrics.json#/nodeMetrics/gearbox_assembly/leadTimeMinutes]: `117.05161290322579`
    - capacityPerHour [models/active/result_metrics.json#/nodeMetrics/gearbox_assembly/capacityPerHour]: `7.142857142857143`
    - bottleneckIndex [models/active/result_metrics.json#/nodeMetrics/gearbox_assembly/bottleneckIndex]: `0.23407908428720414`
    - bottleneckFlag [models/active/result_metrics.json#/nodeMetrics/gearbox_assembly/bottleneckFlag]: `false`
    - status [models/active/result_metrics.json#/nodeMetrics/gearbox_assembly/status]: healthy
  - Battery Pack Prep
    - utilization [models/active/result_metrics.json#/nodeMetrics/battery_pack_prep/utilization]: `0.32518210197711217`
    - headroom [models/active/result_metrics.json#/nodeMetrics/battery_pack_prep/headroom]: `0.6748178980228878`
    - queueRisk [models/active/result_metrics.json#/nodeMetrics/battery_pack_prep/queueRisk]: `0.32518210197711217`
    - queueDepth [models/active/result_metrics.json#/nodeMetrics/battery_pack_prep/queueDepth]: `7.741935483870968`
    - wipQty [models/active/result_metrics.json#/nodeMetrics/battery_pack_prep/wipQty]: `7.741935483870968`
    - completedQty [models/active/result_metrics.json#/nodeMetrics/battery_pack_prep/completedQty]: `0`
    - idleWaitHours [models/active/result_metrics.json#/nodeMetrics/battery_pack_prep/idleWaitHours]: `37.770632659652314`
    - idleWaitPct [models/active/result_metrics.json#/nodeMetrics/battery_pack_prep/idleWaitPct]: `0.674475583208077`
    - leadTimeMinutes [models/active/result_metrics.json#/nodeMetrics/battery_pack_prep/leadTimeMinutes]: `121.90322580645162`
    - capacityPerHour [models/active/result_metrics.json#/nodeMetrics/battery_pack_prep/capacityPerHour]: `5`
    - bottleneckIndex [models/active/result_metrics.json#/nodeMetrics/battery_pack_prep/bottleneckIndex]: `0.32518210197711217`
    - bottleneckFlag [models/active/result_metrics.json#/nodeMetrics/battery_pack_prep/bottleneckFlag]: `false`
    - status [models/active/result_metrics.json#/nodeMetrics/battery_pack_prep/status]: healthy
- Formatting notes:
  - Group step cards in process order and keep each step label exactly as shown in the model.
  - Use compact appendix cards to avoid rewriting the step evidence into prose.
- Reviewer notes:
  - These pages provide back-up evidence and should remain easy to scan during client review.

### 9. Detailed Step Metrics (2/2)
- Section: Appendix / Evidence
- Layout: `appendix_step_metric_grid`
- Content groups:
  - Final Drill Assembly
    - utilization [models/active/result_metrics.json#/nodeMetrics/final_drill_assembly/utilization]: `1.000000000000016`
    - headroom [models/active/result_metrics.json#/nodeMetrics/final_drill_assembly/headroom]: `0`
    - queueRisk [models/active/result_metrics.json#/nodeMetrics/final_drill_assembly/queueRisk]: `1`
    - queueDepth [models/active/result_metrics.json#/nodeMetrics/final_drill_assembly/queueDepth]: `2.1852237252861597`
    - wipQty [models/active/result_metrics.json#/nodeMetrics/final_drill_assembly/wipQty]: `2.1852237252861597`
    - completedQty [models/active/result_metrics.json#/nodeMetrics/final_drill_assembly/completedQty]: `0`
    - idleWaitHours [models/active/result_metrics.json#/nodeMetrics/final_drill_assembly/idleWaitHours]: `0`
    - idleWaitPct [models/active/result_metrics.json#/nodeMetrics/final_drill_assembly/idleWaitPct]: `0`
    - leadTimeMinutes [models/active/result_metrics.json#/nodeMetrics/final_drill_assembly/leadTimeMinutes]: `188.69032258064516`
    - capacityPerHour [models/active/result_metrics.json#/nodeMetrics/final_drill_assembly/capacityPerHour]: `1.6129032258064515`
    - bottleneckIndex [models/active/result_metrics.json#/nodeMetrics/final_drill_assembly/bottleneckIndex]: `1`
    - bottleneckFlag [models/active/result_metrics.json#/nodeMetrics/final_drill_assembly/bottleneckFlag]: `true`
    - status [models/active/result_metrics.json#/nodeMetrics/final_drill_assembly/status]: critical
  - Functional Test
    - utilization [models/active/result_metrics.json#/nodeMetrics/functional_test/utilization]: `0.7096774193548501`
    - headroom [models/active/result_metrics.json#/nodeMetrics/functional_test/headroom]: `0.29032258064514993`
    - queueRisk [models/active/result_metrics.json#/nodeMetrics/functional_test/queueRisk]: `0.7096774193548501`
    - queueDepth [models/active/result_metrics.json#/nodeMetrics/functional_test/queueDepth]: `0`
    - wipQty [models/active/result_metrics.json#/nodeMetrics/functional_test/wipQty]: `0`
    - completedQty [models/active/result_metrics.json#/nodeMetrics/functional_test/completedQty]: `0`
    - idleWaitHours [models/active/result_metrics.json#/nodeMetrics/functional_test/idleWaitHours]: `0`
    - idleWaitPct [models/active/result_metrics.json#/nodeMetrics/functional_test/idleWaitPct]: `0`
    - leadTimeMinutes [models/active/result_metrics.json#/nodeMetrics/functional_test/leadTimeMinutes]: `78.8`
    - capacityPerHour [models/active/result_metrics.json#/nodeMetrics/functional_test/capacityPerHour]: `2.2727272727272725`
    - bottleneckIndex [models/active/result_metrics.json#/nodeMetrics/functional_test/bottleneckIndex]: `0.7096774193548501`
    - bottleneckFlag [models/active/result_metrics.json#/nodeMetrics/functional_test/bottleneckFlag]: `false`
    - status [models/active/result_metrics.json#/nodeMetrics/functional_test/status]: risk
  - Cosmetic Inspection and Rework
    - utilization [models/active/result_metrics.json#/nodeMetrics/cosmetic_inspection_and_rework/utilization]: `0.3225806451612955`
    - headroom [models/active/result_metrics.json#/nodeMetrics/cosmetic_inspection_and_rework/headroom]: `0.6774193548387045`
    - queueRisk [models/active/result_metrics.json#/nodeMetrics/cosmetic_inspection_and_rework/queueRisk]: `0.3225806451612955`
    - queueDepth [models/active/result_metrics.json#/nodeMetrics/cosmetic_inspection_and_rework/queueDepth]: `0`
    - wipQty [models/active/result_metrics.json#/nodeMetrics/cosmetic_inspection_and_rework/wipQty]: `0`
    - completedQty [models/active/result_metrics.json#/nodeMetrics/cosmetic_inspection_and_rework/completedQty]: `0`
    - idleWaitHours [models/active/result_metrics.json#/nodeMetrics/cosmetic_inspection_and_rework/idleWaitHours]: `0`
    - idleWaitPct [models/active/result_metrics.json#/nodeMetrics/cosmetic_inspection_and_rework/idleWaitPct]: `0`
    - leadTimeMinutes [models/active/result_metrics.json#/nodeMetrics/cosmetic_inspection_and_rework/leadTimeMinutes]: `34`
    - capacityPerHour [models/active/result_metrics.json#/nodeMetrics/cosmetic_inspection_and_rework/capacityPerHour]: `5`
    - bottleneckIndex [models/active/result_metrics.json#/nodeMetrics/cosmetic_inspection_and_rework/bottleneckIndex]: `0.3225806451612955`
    - bottleneckFlag [models/active/result_metrics.json#/nodeMetrics/cosmetic_inspection_and_rework/bottleneckFlag]: `false`
    - status [models/active/result_metrics.json#/nodeMetrics/cosmetic_inspection_and_rework/status]: healthy
  - Packaging and Palletizing
    - utilization [models/active/result_metrics.json#/nodeMetrics/packaging_and_palletizing/utilization]: `0.23387096774193922`
    - headroom [models/active/result_metrics.json#/nodeMetrics/packaging_and_palletizing/headroom]: `0.7661290322580607`
    - queueRisk [models/active/result_metrics.json#/nodeMetrics/packaging_and_palletizing/queueRisk]: `0.23387096774193922`
    - queueDepth [models/active/result_metrics.json#/nodeMetrics/packaging_and_palletizing/queueDepth]: `0`
    - wipQty [models/active/result_metrics.json#/nodeMetrics/packaging_and_palletizing/wipQty]: `0`
    - completedQty [models/active/result_metrics.json#/nodeMetrics/packaging_and_palletizing/completedQty]: `270.96774193548816`
    - idleWaitHours [models/active/result_metrics.json#/nodeMetrics/packaging_and_palletizing/idleWaitHours]: `0`
    - idleWaitPct [models/active/result_metrics.json#/nodeMetrics/packaging_and_palletizing/idleWaitPct]: `0`
    - leadTimeMinutes [models/active/result_metrics.json#/nodeMetrics/packaging_and_palletizing/leadTimeMinutes]: `20.9`
    - capacityPerHour [models/active/result_metrics.json#/nodeMetrics/packaging_and_palletizing/capacityPerHour]: `6.896551724137931`
    - bottleneckIndex [models/active/result_metrics.json#/nodeMetrics/packaging_and_palletizing/bottleneckIndex]: `0.23387096774193922`
    - bottleneckFlag [models/active/result_metrics.json#/nodeMetrics/packaging_and_palletizing/bottleneckFlag]: `false`
    - status [models/active/result_metrics.json#/nodeMetrics/packaging_and_palletizing/status]: healthy
- Formatting notes:
  - Group step cards in process order and keep each step label exactly as shown in the model.
  - Use compact appendix cards to avoid rewriting the step evidence into prose.
- Reviewer notes:
  - These pages provide back-up evidence and should remain easy to scan during client review.

### 10. Evidence Gaps and Assumptions
- Section: Appendix / Evidence
- Layout: `appendix_gaps_and_assumptions`
- Content groups:
  - Confidence and Gaps
    - confidence [models/active/operational_diagnosis.json#/confidence]: medium
    - confidenceNote [models/active/operational_diagnosis.json#/confidenceNote]: Confidence is medium because key inputs are incomplete. Missing or weak fields: shift hours/uptime, demand rate/product mix.
  - Assumptions Log
    - strict-001 [models/active/compiled_forecast_model.json#/assumptions/0]: `{"id":"strict-001","severity":"info","text":"The visible VSM title was copied exactly as Cordless Power Drill Assembly Line."}`
    - strict-002 [models/active/compiled_forecast_model.json#/assumptions/1]: `{"id":"strict-002","severity":"info","text":"People Needed was mapped directly to workers because that is the visible staffing field in the image."}`
    - strict-003 [models/active/compiled_forecast_model.json#/assumptions/2]: `{"id":"strict-003","severity":"info","text":"# of Equipment was mapped directly to parallelProcedures / effectiveUnits because that is the visible concurrency field in the image."}`
    - strict-004 [models/active/compiled_forecast_model.json#/assumptions/3]: `{"id":"strict-004","severity":"warning","text":"Hours per shift are not visible in the image, so the forecast calendar still assumes 8 hours per shift when converting shift count to active capacity."}`
    - strict-005 [models/active/compiled_forecast_model.json#/assumptions/4]: `{"id":"strict-005","severity":"warning","text":"Demand rate and product mix are not visible in the image; baseline demand will be inferred in phase 2 from the start-step release capacity."}`
    - strict-006 [models/active/compiled_forecast_model.json#/assumptions/5]: `{"id":"strict-006","severity":"warning","text":"The rework note at Cosmetic Inspection and Rework is visible, but the routing split back to Final Drill Assembly versus Functional Test is not numeric, so the forecast model keeps the main left-to-right chain only."}`
    - compile-001 [models/active/compiled_forecast_model.json#/assumptions/6]: `{"id":"compile-001","severity":"warning","text":"Demand rate is not shown in the source image; baseline demandRatePerHour is seeded at 90% of computed release capacity from the start step."}`
    - compile-002 [models/active/compiled_forecast_model.json#/assumptions/7]: `{"id":"compile-002","severity":"warning","text":"The source image shows a consistent visible shift count of 1; activeShiftCount defaults to that value so runtime capacity aligns with the VSM."}`
    - compile-003 [models/active/compiled_forecast_model.json#/assumptions/8]: `{"id":"compile-003","severity":"warning","text":"Step-level variability is not shown in the source image; baseline variabilityCv defaults to 0.18 for all steps."}`
    - compile-004 [models/active/compiled_forecast_model.json#/assumptions/9]: `{"id":"compile-004","severity":"info","text":"Queue risk is an equivalent single-server wait-probability approximation (P(wait) ~= rho), while bottleneck index, brittleness, and migration remain deterministic non-DES forecast heuristics for rapid recompute."}`
- Formatting notes:
  - Present evidence gaps and assumptions as a clean appendix rather than hiding them in narrative pages.
  - Make uncertainty explicit and easy for reviewers to audit.
- Reviewer notes:
  - This page should remain visible in the export package even when assumptions are sparse.

## Export Notes
- Content preserved from source artifacts.
- Organization improved without rewriting analysis.
- Section flow is optimized for executive review and manual refinement.
- Evidence gaps and uncertainty statements are preserved as part of the export package.

## Presenter Notes
- Open with the Executive Summary and move supporting evidence into appendix pages unless discussion requires detail.
- Use the appendix pages for traceability when reviewers challenge numbers, assumptions, or confidence levels.

## Reviewer Notes
- All content blocks retain a source reference for auditability.
- Layout assignments are intended for slide or page templates and can be refined without changing content.
