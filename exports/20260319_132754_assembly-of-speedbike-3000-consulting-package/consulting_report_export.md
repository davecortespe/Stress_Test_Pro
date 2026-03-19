# Assembly of SpeedBike 3000 - Executive Report Export

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

### 1. Assembly of SpeedBike 3000
- Section: Cover
- Layout: `cover_title_status`
- Content groups:
  - Title Block
    - appTitle [dashboard_config.json#/appTitle]: Assembly of SpeedBike 3000
    - subtitle [dashboard_config.json#/subtitle]: Non-DES bottleneck forecast cockpit
  - Report Status
    - status [operational_diagnosis.json#/status]: overloaded
    - confidence [operational_diagnosis.json#/confidence]: medium
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
    - statusSummary [operational_diagnosis.json#/statusSummary]: Drivetrain Assembly is no longer clearing work at the required rate. The system is effectively overloaded, so queue and WIP growth will continue until load is reduced or capacity is added.
  - Primary Constraint
    - primaryConstraint [operational_diagnosis.json#/primaryConstraint]: Drivetrain Assembly is saturated; effective service capacity is capped near 3.2 units/hr.
  - Recommended Action
    - recommendedAction [operational_diagnosis.json#/recommendedAction]: Reduce effective cycle time at Drivetrain Assembly with standard work, faster changeovers, or error removal before spending on larger structural changes.
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
    - name [compiled_forecast_model.json#/metadata/name]: Assembly of SpeedBike 3000
    - mode [compiled_forecast_model.json#/metadata/mode]: constraint-forecast-non-des
    - units [compiled_forecast_model.json#/metadata/units]: per-hour
  - Current Global Metrics
    - simElapsedHours [result_metrics.json#/globalMetrics/simElapsedHours]: `24`
    - globalThroughput [result_metrics.json#/globalMetrics/globalThroughput]: `2.3218542136676477`
    - totalCompletedOutputPieces [result_metrics.json#/globalMetrics/totalCompletedOutputPieces]: `55.72450112802355`
    - totalWipQty [result_metrics.json#/globalMetrics/totalWipQty]: `268.2754988719821`
    - totalLeadTimeMinutes [result_metrics.json#/globalMetrics/totalLeadTimeMinutes]: `3884.540237801189`
    - bottleneckMigration [result_metrics.json#/globalMetrics/bottleneckMigration]: Brake and Gear Adjustment -> Drivetrain Assembly (low confidence)
    - bottleneckIndex [result_metrics.json#/globalMetrics/bottleneckIndex]: `0.9964800773430307`
    - brittleness [result_metrics.json#/globalMetrics/brittleness]: `0.7184004900066172`
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
    - primaryConstraint [operational_diagnosis.json#/primaryConstraint]: Drivetrain Assembly is saturated; effective service capacity is capped near 3.2 units/hr.
    - constraintMechanism [operational_diagnosis.json#/constraintMechanism]: Drivetrain Assembly is taking demand at about 13.5 units/hr but only clearing about 3.2 units/hr, so arrivals are outrunning service and the queue cannot normalize.
  - Downstream Effects
    - downstreamEffects [operational_diagnosis.json#/downstreamEffects]: Throughput is running about 83% below required rate, WIP has built to roughly 268 units, total lead time is now about 3884.5 minutes, and operators should expect more expediting, rescheduling, and service risk if this state persists.
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
    - economicInterpretation [operational_diagnosis.json#/economicInterpretation]: This is creating hidden capacity loss of roughly 83% versus required output. The likely business impact is overtime pressure, slower inventory availability, and missed throughput that has to be recovered later.
  - AI Opportunity Lens
    - dataAlreadyExists [operational_diagnosis.json#/aiOpportunityLens/dataAlreadyExists]: Utilization, queue, WIP, and lead-time data already exist here but are usually reviewed as separate metrics instead of as one flow signal.
    - manualPatternDecisions [operational_diagnosis.json#/aiOpportunityLens/manualPatternDecisions]: Labor rebalance, release timing, and expediting decisions are still manual even though the patterns are repetitive and detectable from the same simulation outputs.
    - predictiveGap [operational_diagnosis.json#/aiOpportunityLens/predictiveGap]: Most current reporting is backward-looking. The diagnosis should be used to flag where the next queue spike or throughput miss is likely before the floor feels it.
    - tribalKnowledge [operational_diagnosis.json#/aiOpportunityLens/tribalKnowledge]: If step recovery depends on supervisor memory, shift handoff notes, or email threads, that is acting like an unstructured operating database.
    - visibilityGap [operational_diagnosis.json#/aiOpportunityLens/visibilityGap]: When operators cannot see where queue pressure will propagate next, the business leaks profit through avoidable delay, premium labor, and hidden capacity loss.
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
    - recommendedAction [operational_diagnosis.json#/recommendedAction]: Reduce effective cycle time at Drivetrain Assembly with standard work, faster changeovers, or error removal before spending on larger structural changes.
  - Scenario Guidance
    - scenarioGuidance [operational_diagnosis.json#/scenarioGuidance]: The current relief scenario is directionally right. It improves throughput by about 0.873 units/hr, and it also changes bottleneck behavior to Brake and Gear Adjustment -> Drivetrain Assembly (low confidence).
  - Confidence
    - confidence [operational_diagnosis.json#/confidence]: medium
    - confidenceNote [operational_diagnosis.json#/confidenceNote]: Confidence is medium because key inputs are incomplete. Missing or weak fields: shift hours/uptime, demand rate/product mix.
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
    - simElapsedHours [result_metrics.json#/globalMetrics/simElapsedHours]: `24`
    - globalThroughput [result_metrics.json#/globalMetrics/globalThroughput]: `2.3218542136676477`
    - forecastThroughput [result_metrics.json#/globalMetrics/forecastThroughput]: `2.3218542136676477`
    - totalCompletedOutputPieces [result_metrics.json#/globalMetrics/totalCompletedOutputPieces]: `55.72450112802355`
    - totalWipQty [result_metrics.json#/globalMetrics/totalWipQty]: `268.2754988719821`
    - worstCaseTouchTime [result_metrics.json#/globalMetrics/worstCaseTouchTime]: `45.5`
    - totalLeadTimeMinutes [result_metrics.json#/globalMetrics/totalLeadTimeMinutes]: `3884.540237801189`
    - leadTimeDeltaMinutes [result_metrics.json#/globalMetrics/leadTimeDeltaMinutes]: `2911.645537801189`
    - waitSharePct [result_metrics.json#/globalMetrics/waitSharePct]: `0.08881359926272364`
    - leadTimeTopContributor [result_metrics.json#/globalMetrics/leadTimeTopContributor]: Frame Kit Prep
    - throughputDelta [result_metrics.json#/globalMetrics/throughputDelta]: `0.8728652751423152`
    - bottleneckMigration [result_metrics.json#/globalMetrics/bottleneckMigration]: Brake and Gear Adjustment -> Drivetrain Assembly (low confidence)
    - bottleneckIndex [result_metrics.json#/globalMetrics/bottleneckIndex]: `0.9964800773430307`
    - brittleness [result_metrics.json#/globalMetrics/brittleness]: `0.7184004900066172`
- Formatting notes:
  - Use an appendix-style metric table with strong alignment and ample row spacing.
  - Keep raw metric keys and values fully traceable to the source file.
- Reviewer notes:
  - This page is intended for evidence review, not for introducing new narrative.

### 8. Detailed Step Metrics (1/2)
- Section: Appendix / Evidence
- Layout: `appendix_step_metric_grid`
- Content groups:
  - Frame Kit Prep
    - utilization [result_metrics.json#/nodeMetrics/frame_kit_prep/utilization]: `0.8775655114878906`
    - headroom [result_metrics.json#/nodeMetrics/frame_kit_prep/headroom]: `0.12243448851210936`
    - queueRisk [result_metrics.json#/nodeMetrics/frame_kit_prep/queueRisk]: `1`
    - queueDepth [result_metrics.json#/nodeMetrics/frame_kit_prep/queueDepth]: `218.692138621459`
    - wipQty [result_metrics.json#/nodeMetrics/frame_kit_prep/wipQty]: `218.692138621459`
    - completedQty [result_metrics.json#/nodeMetrics/frame_kit_prep/completedQty]: `105.30786137854687`
    - idleWaitHours [result_metrics.json#/nodeMetrics/frame_kit_prep/idleWaitHours]: `0.4608544062911965`
    - idleWaitPct [result_metrics.json#/nodeMetrics/frame_kit_prep/idleWaitPct]: `0.05760680078639956`
    - leadTimeMinutes [result_metrics.json#/nodeMetrics/frame_kit_prep/leadTimeMinutes]: `2648.305663457508`
    - capacityPerHour [result_metrics.json#/nodeMetrics/frame_kit_prep/capacityPerHour]: `5`
    - bottleneckIndex [result_metrics.json#/nodeMetrics/frame_kit_prep/bottleneckIndex]: `0.9204175824671289`
    - bottleneckFlag [result_metrics.json#/nodeMetrics/frame_kit_prep/bottleneckFlag]: `false`
    - status [result_metrics.json#/nodeMetrics/frame_kit_prep/status]: critical
  - Wheel Assembly
    - utilization [result_metrics.json#/nodeMetrics/wheel_assembly/utilization]: `0.716429365009163`
    - headroom [result_metrics.json#/nodeMetrics/wheel_assembly/headroom]: `0.283570634990837`
    - queueRisk [result_metrics.json#/nodeMetrics/wheel_assembly/queueRisk]: `1`
    - queueDepth [result_metrics.json#/nodeMetrics/wheel_assembly/queueDepth]: `13.604902657373868`
    - wipQty [result_metrics.json#/nodeMetrics/wheel_assembly/wipQty]: `13.604902657373868`
    - completedQty [result_metrics.json#/nodeMetrics/wheel_assembly/completedQty]: `91.70295872117286`
    - idleWaitHours [result_metrics.json#/nodeMetrics/wheel_assembly/idleWaitHours]: `1.9918397658952376`
    - idleWaitPct [result_metrics.json#/nodeMetrics/wheel_assembly/idleWaitPct]: `0.2489799707369047`
    - leadTimeMinutes [result_metrics.json#/nodeMetrics/wheel_assembly/leadTimeMinutes]: `205.55515489545604`
    - capacityPerHour [result_metrics.json#/nodeMetrics/wheel_assembly/capacityPerHour]: `5.333333333333333`
    - bottleneckIndex [result_metrics.json#/nodeMetrics/wheel_assembly/bottleneckIndex]: `0.815679087255956`
    - bottleneckFlag [result_metrics.json#/nodeMetrics/wheel_assembly/bottleneckFlag]: `false`
    - status [result_metrics.json#/nodeMetrics/wheel_assembly/status]: risk
  - Drivetrain Assembly
    - utilization [result_metrics.json#/nodeMetrics/drivetrain_assembly/utilization]: `0.9945847343738934`
    - headroom [result_metrics.json#/nodeMetrics/drivetrain_assembly/headroom]: `0.0054152656261066134`
    - queueRisk [result_metrics.json#/nodeMetrics/drivetrain_assembly/queueRisk]: `1`
    - queueDepth [result_metrics.json#/nodeMetrics/drivetrain_assembly/queueDepth]: `14.70285025351651`
    - wipQty [result_metrics.json#/nodeMetrics/drivetrain_assembly/wipQty]: `14.70285025351651`
    - completedQty [result_metrics.json#/nodeMetrics/drivetrain_assembly/completedQty]: `77.00010846765626`
    - idleWaitHours [result_metrics.json#/nodeMetrics/drivetrain_assembly/idleWaitHours]: `0.016655458342250302`
    - idleWaitPct [result_metrics.json#/nodeMetrics/drivetrain_assembly/idleWaitPct]: `0.002081932292781288`
    - leadTimeMinutes [result_metrics.json#/nodeMetrics/drivetrain_assembly/leadTimeMinutes]: `314.6730147154071`
    - capacityPerHour [result_metrics.json#/nodeMetrics/drivetrain_assembly/capacityPerHour]: `3.225806451612903`
    - bottleneckIndex [result_metrics.json#/nodeMetrics/drivetrain_assembly/bottleneckIndex]: `0.9964800773430307`
    - bottleneckFlag [result_metrics.json#/nodeMetrics/drivetrain_assembly/bottleneckFlag]: `true`
    - status [result_metrics.json#/nodeMetrics/drivetrain_assembly/status]: critical
  - Frame Sub-Assembly
    - utilization [result_metrics.json#/nodeMetrics/frame_sub_assembly/utilization]: `0.6245796878343927`
    - headroom [result_metrics.json#/nodeMetrics/frame_sub_assembly/headroom]: `0.37542031216560734`
    - queueRisk [result_metrics.json#/nodeMetrics/frame_sub_assembly/queueRisk]: `0.04184773861258469`
    - queueDepth [result_metrics.json#/nodeMetrics/frame_sub_assembly/queueDepth]: `0.12876227265410672`
    - wipQty [result_metrics.json#/nodeMetrics/frame_sub_assembly/wipQty]: `0.12876227265410672`
    - completedQty [result_metrics.json#/nodeMetrics/frame_sub_assembly/completedQty]: `76.87134619500216`
    - idleWaitHours [result_metrics.json#/nodeMetrics/frame_sub_assembly/idleWaitHours]: `0`
    - idleWaitPct [result_metrics.json#/nodeMetrics/frame_sub_assembly/idleWaitPct]: `0`
    - leadTimeMinutes [result_metrics.json#/nodeMetrics/frame_sub_assembly/leadTimeMinutes]: `59.306518590053045`
    - capacityPerHour [result_metrics.json#/nodeMetrics/frame_sub_assembly/capacityPerHour]: `5.128205128205128`
    - bottleneckIndex [result_metrics.json#/nodeMetrics/frame_sub_assembly/bottleneckIndex]: `0.4206235056067599`
    - bottleneckFlag [result_metrics.json#/nodeMetrics/frame_sub_assembly/bottleneckFlag]: `false`
    - status [result_metrics.json#/nodeMetrics/frame_sub_assembly/status]: healthy
- Formatting notes:
  - Group step cards in process order and keep each step label exactly as shown in the model.
  - Use compact appendix cards to avoid rewriting the step evidence into prose.
- Reviewer notes:
  - These pages provide back-up evidence and should remain easy to scan during client review.

### 9. Detailed Step Metrics (2/2)
- Section: Appendix / Evidence
- Layout: `appendix_step_metric_grid`
- Content groups:
  - Final Mechanical Assembly
    - utilization [result_metrics.json#/nodeMetrics/final_mechanical_assembly/utilization]: `0.7494942861899685`
    - headroom [result_metrics.json#/nodeMetrics/final_mechanical_assembly/headroom]: `0.2505057138100315`
    - queueRisk [result_metrics.json#/nodeMetrics/final_mechanical_assembly/queueRisk]: `1`
    - queueDepth [result_metrics.json#/nodeMetrics/final_mechanical_assembly/queueDepth]: `11.460935763877742`
    - wipQty [result_metrics.json#/nodeMetrics/final_mechanical_assembly/wipQty]: `11.460935763877742`
    - completedQty [result_metrics.json#/nodeMetrics/final_mechanical_assembly/completedQty]: `65.41041043112452`
    - idleWaitHours [result_metrics.json#/nodeMetrics/final_mechanical_assembly/idleWaitHours]: `1.797260351777721`
    - idleWaitPct [result_metrics.json#/nodeMetrics/final_mechanical_assembly/idleWaitPct]: `0.22465754397221513`
    - leadTimeMinutes [result_metrics.json#/nodeMetrics/final_mechanical_assembly/leadTimeMinutes]: `280.1054401039828`
    - capacityPerHour [result_metrics.json#/nodeMetrics/final_mechanical_assembly/capacityPerHour]: `3.636363636363636`
    - bottleneckIndex [result_metrics.json#/nodeMetrics/final_mechanical_assembly/bottleneckIndex]: `0.8371712860234795`
    - bottleneckFlag [result_metrics.json#/nodeMetrics/final_mechanical_assembly/bottleneckFlag]: `false`
    - status [result_metrics.json#/nodeMetrics/final_mechanical_assembly/status]: critical
  - Brake and Gear Adjustment
    - utilization [result_metrics.json#/nodeMetrics/brake_and_gear_adjustment/utilization]: `0.9901161535730416`
    - headroom [result_metrics.json#/nodeMetrics/brake_and_gear_adjustment/headroom]: `0.009883846426958387`
    - queueRisk [result_metrics.json#/nodeMetrics/brake_and_gear_adjustment/queueRisk]: `1`
    - queueDepth [result_metrics.json#/nodeMetrics/brake_and_gear_adjustment/queueDepth]: `9.497968817587909`
    - wipQty [result_metrics.json#/nodeMetrics/brake_and_gear_adjustment/wipQty]: `9.497968817587909`
    - completedQty [result_metrics.json#/nodeMetrics/brake_and_gear_adjustment/completedQty]: `55.912441613536465`
    - idleWaitHours [result_metrics.json#/nodeMetrics/brake_and_gear_adjustment/idleWaitHours]: `0.01240410474906212`
    - idleWaitPct [result_metrics.json#/nodeMetrics/brake_and_gear_adjustment/idleWaitPct]: `0.001550513093632765`
    - leadTimeMinutes [result_metrics.json#/nodeMetrics/brake_and_gear_adjustment/leadTimeMinutes]: `310.69820484849174`
    - capacityPerHour [result_metrics.json#/nodeMetrics/brake_and_gear_adjustment/capacityPerHour]: `2.352941176470588`
    - bottleneckIndex [result_metrics.json#/nodeMetrics/brake_and_gear_adjustment/bottleneckIndex]: `0.9935754998224771`
    - bottleneckFlag [result_metrics.json#/nodeMetrics/brake_and_gear_adjustment/bottleneckFlag]: `false`
    - status [result_metrics.json#/nodeMetrics/brake_and_gear_adjustment/status]: critical
  - Inspection and Touch-Up
    - utilization [result_metrics.json#/nodeMetrics/inspection_and_touch_up/utilization]: `0.46515392808983347`
    - headroom [result_metrics.json#/nodeMetrics/inspection_and_touch_up/headroom]: `0.5348460719101665`
    - queueRisk [result_metrics.json#/nodeMetrics/inspection_and_touch_up/queueRisk]: `0.03132341425215212`
    - queueDepth [result_metrics.json#/nodeMetrics/inspection_and_touch_up/queueDepth]: `0.09397024275645637`
    - wipQty [result_metrics.json#/nodeMetrics/inspection_and_touch_up/wipQty]: `0.09397024275645637`
    - completedQty [result_metrics.json#/nodeMetrics/inspection_and_touch_up/completedQty]: `55.81847137078001`
    - idleWaitHours [result_metrics.json#/nodeMetrics/inspection_and_touch_up/idleWaitHours]: `0`
    - idleWaitPct [result_metrics.json#/nodeMetrics/inspection_and_touch_up/idleWaitPct]: `0`
    - leadTimeMinutes [result_metrics.json#/nodeMetrics/inspection_and_touch_up/leadTimeMinutes]: `35.12764291307748`
    - capacityPerHour [result_metrics.json#/nodeMetrics/inspection_and_touch_up/capacityPerHour]: `5`
    - bottleneckIndex [result_metrics.json#/nodeMetrics/inspection_and_touch_up/bottleneckIndex]: `0.313313248246645`
    - bottleneckFlag [result_metrics.json#/nodeMetrics/inspection_and_touch_up/bottleneckFlag]: `false`
    - status [result_metrics.json#/nodeMetrics/inspection_and_touch_up/status]: healthy
  - Packaging and Staging
    - utilization [result_metrics.json#/nodeMetrics/packaging_and_staging/utilization]: `0.5224171980752207`
    - headroom [result_metrics.json#/nodeMetrics/packaging_and_staging/headroom]: `0.4775828019247793`
    - queueRisk [result_metrics.json#/nodeMetrics/packaging_and_staging/queueRisk]: `0.03523884103367349`
    - queueDepth [result_metrics.json#/nodeMetrics/packaging_and_staging/queueDepth]: `0.09397024275646262`
    - wipQty [result_metrics.json#/nodeMetrics/packaging_and_staging/wipQty]: `0.09397024275646262`
    - completedQty [result_metrics.json#/nodeMetrics/packaging_and_staging/completedQty]: `55.72450112802355`
    - idleWaitHours [result_metrics.json#/nodeMetrics/packaging_and_staging/idleWaitHours]: `0`
    - idleWaitPct [result_metrics.json#/nodeMetrics/packaging_and_staging/idleWaitPct]: `0`
    - leadTimeMinutes [result_metrics.json#/nodeMetrics/packaging_and_staging/leadTimeMinutes]: `30.768598277212245`
    - capacityPerHour [result_metrics.json#/nodeMetrics/packaging_and_staging/capacityPerHour]: `4.444444444444445`
    - bottleneckIndex [result_metrics.json#/nodeMetrics/packaging_and_staging/bottleneckIndex]: `0.3519047731106792`
    - bottleneckFlag [result_metrics.json#/nodeMetrics/packaging_and_staging/bottleneckFlag]: `false`
    - status [result_metrics.json#/nodeMetrics/packaging_and_staging/status]: healthy
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
    - confidence [operational_diagnosis.json#/confidence]: medium
    - confidenceNote [operational_diagnosis.json#/confidenceNote]: Confidence is medium because key inputs are incomplete. Missing or weak fields: shift hours/uptime, demand rate/product mix.
  - Assumptions Log
    - strict-001 [compiled_forecast_model.json#/assumptions/0]: `{"id":"strict-001","severity":"warning","text":"The VSM title is not visible in the image; model metadata was inferred as Assembly of SpeedBike 3000."}`
    - strict-002 [compiled_forecast_model.json#/assumptions/1]: `{"id":"strict-002","severity":"info","text":"People Needed was mapped directly to workers because that is the visible staffing field in the image."}`
    - strict-003 [compiled_forecast_model.json#/assumptions/2]: `{"id":"strict-003","severity":"info","text":"# of Equipment was mapped directly to parallelProcedures / effectiveUnits because that is the visible concurrency field in the image."}`
    - strict-004 [compiled_forecast_model.json#/assumptions/3]: `{"id":"strict-004","severity":"warning","text":"Hours per shift are not visible in the image, so the forecast calendar still assumes 8 hours per shift when converting shift count to active capacity."}`
    - strict-005 [compiled_forecast_model.json#/assumptions/4]: `{"id":"strict-005","severity":"warning","text":"Demand rate and product mix are not visible in the image; baseline demand will be inferred in phase 2 from the start-step release capacity."}`
    - compile-001 [compiled_forecast_model.json#/assumptions/5]: `{"id":"compile-001","severity":"warning","text":"Demand rate is not shown in the source image; baseline demandRatePerHour is seeded at 90% of computed release capacity from the start step."}`
    - compile-002 [compiled_forecast_model.json#/assumptions/6]: `{"id":"compile-002","severity":"warning","text":"The source image shows a consistent visible shift count of 1; activeShiftCount defaults to that value so runtime capacity aligns with the VSM."}`
    - compile-003 [compiled_forecast_model.json#/assumptions/7]: `{"id":"compile-003","severity":"warning","text":"Step-level variability is not shown in the source image; baseline variabilityCv defaults to 0.18 for all steps."}`
    - compile-004 [compiled_forecast_model.json#/assumptions/8]: `{"id":"compile-004","severity":"info","text":"Queue risk, bottleneck index, brittleness, and migration outputs are deterministic non-DES forecast heuristics for rapid recompute."}`
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
