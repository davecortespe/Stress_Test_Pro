## Operational Diagnosis

**1. System Status**
Primary Capture Chromatography is no longer clearing work at the required rate. The system is effectively overloaded, so queue and WIP growth will continue until load is reduced or capacity is added.

**2. Primary Constraint**
Primary Capture Chromatography is the current system constraint.

**3. Constraint Mechanism**
Primary Capture Chromatography is taking demand at about 0.720 units/hr but only clearing about 0.222 units/hr, so arrivals are outrunning service and the queue cannot normalize.

**4. Downstream Effects**
Throughput is running about 85% below required rate, WIP has built to roughly 23 units, total lead time is now about 19430.5 minutes, and operators should expect more expediting, rescheduling, and service risk if this state persists.

**5. Economic Interpretation**
This is creating hidden capacity loss of roughly 85% versus required output. The likely business impact is overtime pressure, slower inventory availability, and missed throughput that has to be recovered later.

**6. Recommended Action**
Reduce effective cycle time at Primary Capture Chromatography with standard work, faster changeovers, or error removal before spending on larger structural changes.

**7. Scenario Guidance**
Scenario comparison is limited. Current outputs do not show a materially better tested scenario than the active case.

**AI Opportunity Lens**
- Data already exists but is underused: Utilization, queue, WIP, and lead-time data already exist here but are usually reviewed as separate metrics instead of as one flow signal.
- Manual but pattern-based decisions: Labor rebalance, release timing, and expediting decisions are still manual even though the patterns are repetitive and detectable from the same simulation outputs.
- Backward-looking vs predictive gap: Most current reporting is backward-looking. The diagnosis should be used to flag where the next queue spike or throughput miss is likely before the floor feels it.
- Tribal knowledge / email as database: If step recovery depends on supervisor memory, shift handoff notes, or email threads, that is acting like an unstructured operating database.
- Visibility gaps causing profit leakage: When operators cannot see where queue pressure will propagate next, the business leaks profit through avoidable delay, premium labor, and hidden capacity loss.

**Confidence**
low - Confidence is low because key inputs are incomplete. Missing or weak fields: staffing/equipment counts, wait-time units, demand rate/product mix, shift hours/uptime, lot-size policy, changeover/setup times.
