#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import fitz
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import ListFlowable, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
ACTIVE = ROOT / "models" / "active"
OUTPUT = ROOT / "output" / "pdf"
PUBLIC = ROOT / "public" / "generated"

PAGE_W, PAGE_H = LETTER
MARGIN = 0.58 * inch
CONTENT_W = PAGE_W - (MARGIN * 2)

TEXT = colors.HexColor("#1F2937")
TEXT_SECONDARY = colors.HexColor("#374151")
TEXT_MUTED = colors.HexColor("#4B5563")
TEXT_DISABLED = colors.HexColor("#6B7280")
ACCENT_BLUE = colors.HexColor("#2563EB")
ACCENT_GREEN = colors.HexColor("#16A34A")
ACCENT_AMBER = colors.HexColor("#D97706")
ACCENT_RED = colors.HexColor("#DC2626")
ACCENT_TEAL = colors.HexColor("#0F766E")
SURFACE = colors.white
SURFACE_ALT = colors.HexColor("#F5F7FB")
BORDER = colors.HexColor("#E5EAF2")
SOFT_BLUE = colors.HexColor("#DBEAFE")
SOFT_GREEN = colors.HexColor("#DCFCE7")
SOFT_AMBER = colors.HexColor("#FEF3C7")
SOFT_RED = colors.HexColor("#FEE2E2")
SOFT_TEAL = colors.HexColor("#CCFBF1")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def clean(value: Any) -> str:
    text = "" if value is None else str(value)
    text = text.replace("\r", " ").replace("\n", " ")
    text = text.replace("\u2014", "-").replace("\u2013", "-").replace("\u2011", "-")
    text = text.replace("\u00a0", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def num(value: Any, fallback: float = 0.0) -> float:
    if isinstance(value, (int, float)) and math.isfinite(float(value)):
        return float(value)
    if isinstance(value, str) and value.strip():
        try:
            parsed = float(value)
            if math.isfinite(parsed):
                return parsed
        except ValueError:
            pass
    return fallback


def clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def fmt_num(value: Any, digits: int = 1) -> str:
    if not isinstance(value, (int, float)) or not math.isfinite(float(value)):
        return "--"
    return f"{float(value):.{digits}f}"


def fmt_pct(value: Any, digits: int = 0) -> str:
    if not isinstance(value, (int, float)) or not math.isfinite(float(value)):
        return "--"
    return f"{float(value) * 100:.{digits}f}%"


def fmt_minutes(value: Any, digits: int = 1) -> str:
    if not isinstance(value, (int, float)) or not math.isfinite(float(value)):
        return "--"
    return f"{float(value):.{digits}f} min"


@dataclass
class StepFact:
    step_id: str
    step_name: str
    utilization: float | None
    queue_risk: float | None
    bottleneck_index: float | None
    lead_time_minutes: float | None
    explicit_lead_time_minutes: float | None
    queue_delay_minutes: float | None
    wip_qty: float | None
    variability_cv: float
    changeover_penalty_minutes: float
    worker_count: int
    effective_units: float | None
    headroom: float | None
    downtime_pct: float
    missing_ct: bool
    missing_lead_time: bool
    assumption_count: int


@dataclass
class CategoryReport:
    key: str
    label: str
    focus_step: str
    priority_score: float
    observed_condition: str
    failure_modes: list[str]
    cause_effect_chain: str
    audit_checks: list[str]
    targeted_fixes: list[str]
    queue_reduction_minutes: float | None
    lead_time_reduction_minutes: float | None
    throughput_gain_units_per_hour: float | None
    stability_effect: str
    utilization: float | None
    queue_risk: float | None
    queue_delay_minutes: float | None
    lead_time_minutes: float | None
    wip_qty: float | None
    downtime_pct: float | None
    variability_cv: float | None
    changeover_penalty_minutes: float | None
    worker_count: int
    effective_units: float | None
    bottleneck_index: float | None


def step_override(scenario: dict[str, Any], step_id: str, field: str) -> Any:
    return scenario.get(f"step_{step_id}_{field}")


def assumption_count(model: dict[str, Any], step_id: str, step_name: str) -> int:
    lowered_id = step_id.lower()
    lowered_name = step_name.lower()
    count = 0
    for assumption in model.get("assumptions", []):
        text = clean(assumption.get("text", "")).lower()
        if lowered_id in text or lowered_name in text:
            count += 1
    return count


def build_step_facts(model: dict[str, Any], scenario: dict[str, Any], metrics: dict[str, Any]) -> list[StepFact]:
    facts: list[StepFact] = []
    node_metrics = metrics.get("nodeMetrics", {})
    global_downtime = clamp(num(scenario.get("unplannedDowntimePct"), 7.0), 0, 95)
    for step in model.get("stepModels", []):
        step_id = step["stepId"]
        step_name = step["label"]
        ct_minutes = num(step.get("ctMinutes"), math.nan)
        lead_time_minutes = num(step.get("leadTimeMinutes"), math.nan)
        node = node_metrics.get(step_id, {})
        queue_delay = max(0.0, lead_time_minutes - ct_minutes) if math.isfinite(ct_minutes) and math.isfinite(lead_time_minutes) else None
        facts.append(
            StepFact(
                step_id=step_id,
                step_name=step_name,
                utilization=node.get("utilization"),
                queue_risk=node.get("queueRisk"),
                bottleneck_index=node.get("bottleneckIndex"),
                lead_time_minutes=lead_time_minutes if math.isfinite(lead_time_minutes) else None,
                explicit_lead_time_minutes=lead_time_minutes if math.isfinite(lead_time_minutes) else None,
                queue_delay_minutes=queue_delay,
                wip_qty=node.get("wipQty"),
                variability_cv=num(step.get("variabilityCv"), 0.18),
                changeover_penalty_minutes=max(0.0, num(step.get("changeoverPenaltyPerUnitMinutes"), 0.0)),
                worker_count=max(1, int(round(num(step.get("workerCount"), 1)))),
                effective_units=step.get("effectiveUnits"),
                headroom=node.get("headroom"),
                downtime_pct=clamp(num(step_override(scenario, step_id, "downtimePct"), global_downtime), 0, 95),
                missing_ct=step.get("ctMinutes") is None,
                missing_lead_time=step.get("leadTimeMinutes") is None,
                assumption_count=assumption_count(model, step_id, step_name),
            )
        )
    return facts


def max_known(values: Iterable[Any], fallback: float = 1.0) -> float:
    best = 0.0
    for value in values:
        if isinstance(value, (int, float)) and math.isfinite(float(value)):
            best = max(best, float(value))
    return best if best > 0 else fallback


def normalized(value: Any, max_value: float) -> float:
    if not isinstance(value, (int, float)) or not math.isfinite(float(value)) or max_value <= 0:
        return 0.0
    return clamp(float(value) / max_value, 0.0, 1.0)


def category_label(category: str) -> str:
    return {
        "manpower": "Manpower",
        "machine": "Machine",
        "method": "Method",
        "material": "Material / Information",
        "measurement": "Measurement",
    }.get(category, "Kaizen")


def score_category(category: str, fact: StepFact, maxima: dict[str, float]) -> float:
    util = clamp(num(fact.utilization, 0.0), 0.0, 1.25) / 1.25
    queue = clamp(num(fact.queue_risk, 0.0), 0.0, 1.0)
    bottleneck = clamp(num(fact.bottleneck_index, 0.0), 0.0, 1.0)
    headroom_loss = 1.0 - clamp(num(fact.headroom, 0.0), 0.0, 1.0)
    lead_time = normalized(fact.lead_time_minutes, maxima["maxLeadTime"])
    explicit_lead = normalized(fact.explicit_lead_time_minutes, maxima["maxExplicitLeadTime"])
    wip = normalized(fact.wip_qty, maxima["maxWip"])
    variability = normalized(fact.variability_cv, maxima["maxVariability"])
    changeover = normalized(fact.changeover_penalty_minutes, maxima["maxChangeover"])
    downtime = clamp(fact.downtime_pct / 100.0, 0.0, 1.0)
    staffing = clamp(fact.worker_count / 5.0, 0.0, 1.0)
    low_units = clamp(1 / max(1.0, num(fact.effective_units, 1.0)), 0.0, 1.0)
    measurement_gap = clamp((0.55 if fact.missing_ct else 0.0) + (0.35 if fact.missing_lead_time else 0.0) + min(0.25, fact.assumption_count * 0.08), 0.0, 1.0)
    if category == "manpower":
        return 100 * (0.36 * bottleneck + 0.24 * util + 0.16 * queue + 0.14 * headroom_loss + 0.10 * staffing)
    if category == "machine":
        return 100 * (0.34 * downtime + 0.30 * bottleneck + 0.16 * queue + 0.12 * low_units + 0.08 * wip)
    if category == "method":
        return 100 * (0.28 * queue + 0.24 * lead_time + 0.20 * bottleneck + 0.16 * changeover + 0.12 * wip)
    if category == "material":
        return 100 * (0.38 * explicit_lead + 0.24 * lead_time + 0.18 * queue + 0.12 * wip + 0.08 * bottleneck)
    return 100 * (0.38 * measurement_gap + 0.24 * variability + 0.18 * queue + 0.12 * lead_time + 0.08 * bottleneck)


def top_fact(category: str, facts: list[StepFact], maxima: dict[str, float]) -> tuple[StepFact, float]:
    ranked = sorted(((fact, score_category(category, fact, maxima)) for fact in facts), key=lambda row: row[1], reverse=True)
    return ranked[0]


def observed_condition(category: str, fact: StepFact) -> str:
    if category == "manpower":
        return f"{fact.step_name} is running at {fmt_pct(fact.utilization)} utilization with {fmt_minutes(fact.queue_delay_minutes)} of queue delay, {fmt_num(fact.wip_qty, 1)} units of WIP, and {fact.worker_count} modeled operators. Headroom is {fmt_pct(fact.headroom)}."
    if category == "machine":
        return f"{fact.step_name} is carrying {fmt_pct(fact.utilization)} utilization with {fmt_num(fact.downtime_pct, 0)}% downtime, {fmt_num(fact.effective_units, 1)} effective units, {fmt_minutes(fact.queue_delay_minutes)} of queue delay, and {fmt_num(fact.wip_qty, 1)} units of WIP."
    if category == "method":
        return f"{fact.step_name} shows {fmt_minutes(fact.changeover_penalty_minutes)} of changeover drag per unit, {fmt_minutes(fact.queue_delay_minutes)} of queue delay, {fmt_minutes(fact.lead_time_minutes)} total lead time, and {fmt_pct(fact.queue_risk)} queue risk."
    if category == "material":
        return f"{fact.step_name} is carrying {fmt_minutes(fact.explicit_lead_time_minutes)} of explicit wait before work can move, {fmt_num(fact.wip_qty, 1)} units of WIP, {fmt_minutes(fact.queue_delay_minutes)} of queue delay, and {fmt_pct(fact.queue_risk)} queue risk."
    return f"{fact.step_name} is showing {fmt_num(fact.variability_cv, 2)} variation, {fmt_pct(fact.queue_risk)} queue risk, {fmt_minutes(fact.lead_time_minutes)} lead time, and {fact.assumption_count} open assumptions{' with missing time signals' if fact.missing_ct or fact.missing_lead_time else ''}."


def failure_modes(category: str, fact: StepFact) -> list[str]:
    if category == "manpower":
        return [
            f"Hourly staffing is likely misaligned to arrival peaks, so {fact.step_name} falls behind during the surge window.",
            f"{fact.step_name} is exposed to single-operator dependence; breaks, coaching, or rework immediately turn into queue growth." if fact.worker_count <= 1 else f"{fact.step_name} likely has cross-training or role-balance gaps; work waits for the right person instead of flowing.",
            "Handoff and standard-work differences are probably adding hidden cycle-time loss at the constraint.",
        ]
    if category == "machine":
        return [
            f"Short uptime losses at {fact.step_name} are likely removing the small amount of capacity margin that still exists.",
            f"Recovery after stops is likely too slow for a step with only {fmt_num(fact.effective_units, 1)} effective units.",
            "The bottleneck is probably experiencing minor stops, changeover stalls, or equipment readiness delays that do not show up as one large failure.",
        ]
    if category == "method":
        return [
            f"Batching and sequencing rules are likely forcing work to wait before {fact.step_name} can process it.",
            f"Setup discipline is likely weak enough that {fmt_minutes(fact.changeover_penalty_minutes)} of changeover drag is converting directly into queue growth.",
            "Supervisors are probably fighting the queue with expedites instead of a stable release and WIP rule.",
        ]
    if category == "material":
        return [
            "Jobs are likely being released before material, paperwork, approvals, or upstream prep are fully ready.",
            f"Input shortages or information gaps are likely causing stop-start flow at {fact.step_name} rather than steady feed.",
            "Queue is probably being created by readiness failures upstream, not only by local process speed.",
        ]
    return [
        "Queue growth is likely being detected too late because reason codes, trigger thresholds, or live control charts are weak or missing.",
        "Critical time signals are missing, so the team is likely debating symptoms instead of confirming the actual mechanism." if fact.missing_ct or fact.missing_lead_time else "Signals may exist, but the floor likely does not have a tight trigger for when to intervene before the queue runs away.",
        "Variation is high enough that average metrics are hiding the moment the line becomes unstable.",
    ]


def cause_effect(category: str, fact: StepFact, primary_constraint: str, is_direct: bool) -> str:
    constraint_phrase = f"{fact.step_name} stays pinned as the system bottleneck" if is_direct else f"{fact.step_name} feeds instability into {primary_constraint}, which keeps the system bottleneck from recovering"
    if category == "manpower":
        return f"When coverage or role balance slips at {fact.step_name}, effective service rate drops below arrivals. Queue delay rises to {fmt_minutes(fact.queue_delay_minutes)} and WIP builds to {fmt_num(fact.wip_qty, 1)} units, so {constraint_phrase}."
    if category == "machine":
        return f"Each uptime loss at {fact.step_name} removes capacity from a step already running at {fmt_pct(fact.utilization)} utilization. Because there are only {fmt_num(fact.effective_units, 1)} effective units, even short stops expand the queue quickly and {constraint_phrase}."
    if category == "method":
        return f"Changeovers, batching, and weak release rules add non-value time before units clear {fact.step_name}. That inflates queue delay to {fmt_minutes(fact.queue_delay_minutes)}, stretches lead time to {fmt_minutes(fact.lead_time_minutes)}, and {constraint_phrase}."
    if category == "material":
        return f"If work reaches {fact.step_name} before inputs are ready, the step alternates between waiting and surging. That creates hidden starvation and then queue spikes, which leaves {fmt_num(fact.wip_qty, 1)} units trapped in front of the bottleneck and {constraint_phrase}."
    return f"Without timely signals, the floor reacts after queue growth is already visible instead of when variation first appears. The line then carries {fmt_pct(fact.queue_risk)} queue risk and {fmt_minutes(fact.lead_time_minutes)} lead time before anyone intervenes, so {constraint_phrase}."


def audit_checks(category: str, fact: StepFact) -> list[str]:
    if category == "manpower":
        return [
            f"Compare scheduled versus actual headcount by hour at {fact.step_name} for the last 5 shifts.",
            f"Observe one full cycle at {fact.step_name} and count wait-for-person events, handoffs, and role interruptions.",
            f"Review cross-training and relief coverage for {fact.step_name}.",
        ]
    if category == "machine":
        return [
            f"Pull stop logs for {fact.step_name} and sort downtime by cause and duration.",
            f"Verify actual available units versus planned units at {fact.step_name}.",
            "Watch two recoveries from a stop and time restart-to-first-good-unit.",
        ]
    if category == "method":
        return [
            f"Review the actual dispatching and batching rule used at {fact.step_name} during the last 3 shifts.",
            f"Time changeovers and compare actual versus standard at {fact.step_name}.",
            f"Measure queue age in front of {fact.step_name}, not just queue count.",
        ]
    if category == "material":
        return [
            f"Audit the last 10 jobs released to {fact.step_name} for missing materials, paperwork, approvals, or prep.",
            f"Compare explicit wait before {fact.step_name} with upstream completion timestamps.",
            "Walk the queue physically and confirm whether queued work is truly ready to run.",
        ]
    return [
        f"Verify whether {fact.step_name} has live queue, WIP, downtime, and variation triggers visible to the floor.",
        "Review the last 5 escalations and confirm whether the first signal was measured or anecdotal.",
        f"Close missing CT/LT assumptions tied to {fact.step_name}.",
    ]


def targeted_fixes(category: str, fact: StepFact) -> list[str]:
    if category == "manpower":
        return [
            f"Move one trained operator-equivalent into {fact.step_name} during the peak arrival window before adding broader labor.",
            f"Standardize the handoff at {fact.step_name} so the operator does not wait on role clarification or approvals.",
            "Create explicit relief coverage for breaks, troubleshooting, and short absences at the constraint.",
        ]
    if category == "machine":
        return [
            f"Attack the top downtime cause at {fact.step_name} first and shorten restart-to-first-good-unit.",
            f"Protect one unit at {fact.step_name} from non-critical interruptions during the peak queue window.",
            "Pre-stage tools, parts, and settings so minor stops do not become extended capacity loss.",
        ]
    if category == "method":
        return [
            f"Enforce one dispatch rule into {fact.step_name} and stop re-prioritizing unless the reason is explicit.",
            f"Reduce setup loss at {fact.step_name} with prep-offline work and family sequencing.",
            "Set a local WIP cap and queue-age trigger so the line cannot flood the constraint unchecked.",
        ]
    if category == "material":
        return [
            f"Gate release into {fact.step_name} on material and information readiness, not calendar promise alone.",
            "Add a short pre-release check for missing paperwork, approvals, or prep that currently creates hidden waiting.",
            "Separate not-ready jobs from runnable jobs so the queue only contains executable work.",
        ]
    return [
        f"Add live trigger points for queue age, queue depth, and downtime at {fact.step_name}.",
        "Require one reason code whenever work is expedited around the constraint so the true mechanism becomes visible.",
        "Close the highest-impact missing time signals before the next improvement event.",
    ]


def impact_factors(category: str) -> tuple[float, float, float, str]:
    return {
        "manpower": (0.24, 0.12, 0.58, "Reduces staffing-driven queue spikes and handoff starvation."),
        "machine": (0.28, 0.14, 0.62, "Removes stop-start behavior that keeps the bottleneck pinned."),
        "method": (0.30, 0.18, 0.52, "Cuts bunching, re-sequencing, and migration between near-constraints."),
        "material": (0.22, 0.16, 0.42, "Reduces blocked waiting and keeps work release synchronized to readiness."),
        "measurement": (0.14, 0.08, 0.24, "Improves early intervention so queues are corrected before they cascade."),
    }.get(category, (0.2, 0.1, 0.3, "Improves control around the active constraint."))


def expected_impact(category: str, fact: StepFact, score: float, primary_constraint_id: str, baseline_throughput: float, forecast_delta: float) -> tuple[float | None, float | None, float | None, str]:
    queue_factor, lead_factor, throughput_factor, effect = impact_factors(category)
    severity_factor = clamp(score / 100.0, 0.45, 1.0)
    relationship_factor = 1.0 if fact.step_id == primary_constraint_id else 0.78
    recoverable_throughput = max(forecast_delta, baseline_throughput * 0.03, 0.1)
    queue_red = None if fact.queue_delay_minutes is None else round(fact.queue_delay_minutes * queue_factor * severity_factor * relationship_factor, 1)
    lead_red = None if fact.lead_time_minutes is None else round(fact.lead_time_minutes * lead_factor * severity_factor * relationship_factor, 1)
    throughput_gain = round(recoverable_throughput * throughput_factor * severity_factor * relationship_factor, 2)
    return queue_red, lead_red, throughput_gain, effect


def build_category_reports(model: dict[str, Any], scenario: dict[str, Any], metrics: dict[str, Any], diagnosis: dict[str, Any]) -> list[CategoryReport]:
    facts = build_step_facts(model, scenario, metrics)
    maxima = {
        "maxLeadTime": max_known(fact.lead_time_minutes for fact in facts),
        "maxExplicitLeadTime": max_known(fact.explicit_lead_time_minutes for fact in facts),
        "maxWip": max_known(fact.wip_qty for fact in facts),
        "maxVariability": max_known(fact.variability_cv for fact in facts),
        "maxChangeover": max_known(fact.changeover_penalty_minutes for fact in facts),
    }

    primary_constraint_id = ""
    for step_id, values in metrics.get("nodeMetrics", {}).items():
        if values.get("bottleneckFlag"):
            primary_constraint_id = step_id
            break
    if not primary_constraint_id:
        primary_constraint_id = model.get("baseline", {}).get("bottleneckStepId") or (model.get("stepModels", [{}])[0].get("stepId") if model.get("stepModels") else "")
    primary_constraint_label = next((step["label"] for step in model.get("stepModels", []) if step["stepId"] == primary_constraint_id), diagnosis.get("primaryConstraint", "Current constraint"))

    baseline_throughput = num(metrics.get("globalMetrics", {}).get("forecastThroughput"), 0.0)
    forecast_delta = max(0.1, num(metrics.get("globalMetrics", {}).get("throughputDelta"), 0.1))

    reports: list[CategoryReport] = []
    for category in ["manpower", "machine", "method", "material", "measurement"]:
        fact, score = top_fact(category, facts, maxima)
        queue_red, lead_red, throughput_gain, effect = expected_impact(category, fact, score, primary_constraint_id, baseline_throughput, forecast_delta)
        reports.append(
            CategoryReport(
                key=category,
                label=category_label(category),
                focus_step=fact.step_name,
                priority_score=score,
                observed_condition=observed_condition(category, fact),
                failure_modes=failure_modes(category, fact),
                cause_effect_chain=cause_effect(category, fact, primary_constraint_label, fact.step_id == primary_constraint_id),
                audit_checks=audit_checks(category, fact),
                targeted_fixes=targeted_fixes(category, fact),
                queue_reduction_minutes=queue_red,
                lead_time_reduction_minutes=lead_red,
                throughput_gain_units_per_hour=throughput_gain,
                stability_effect=effect,
                utilization=fact.utilization,
                queue_risk=fact.queue_risk,
                queue_delay_minutes=fact.queue_delay_minutes,
                lead_time_minutes=fact.lead_time_minutes,
                wip_qty=fact.wip_qty,
                downtime_pct=fact.downtime_pct,
                variability_cv=fact.variability_cv,
                changeover_penalty_minutes=fact.changeover_penalty_minutes,
                worker_count=fact.worker_count,
                effective_units=fact.effective_units,
                bottleneck_index=fact.bottleneck_index,
            )
        )
    return sorted(reports, key=lambda report: report.priority_score, reverse=True)


def make_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "Body": ParagraphStyle("Body", parent=base["BodyText"], fontName="Helvetica", fontSize=10.5, leading=15, textColor=TEXT_SECONDARY, alignment=TA_LEFT),
        "BodyMuted": ParagraphStyle("BodyMuted", parent=base["BodyText"], fontName="Helvetica", fontSize=10.2, leading=14.5, textColor=TEXT_MUTED, alignment=TA_LEFT),
        "BodyStrong": ParagraphStyle("BodyStrong", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=10.5, leading=15, textColor=TEXT, alignment=TA_LEFT),
        "Title": ParagraphStyle("Title", parent=base["Title"], fontName="Helvetica-Bold", fontSize=22, leading=26, textColor=TEXT),
        "Lead": ParagraphStyle("Lead", parent=base["BodyText"], fontName="Helvetica", fontSize=11.2, leading=16, textColor=TEXT_SECONDARY, alignment=TA_LEFT),
        "Section": ParagraphStyle("Section", parent=base["Heading2"], fontName="Helvetica-Bold", fontSize=15, leading=18, textColor=TEXT),
        "SubSection": ParagraphStyle("SubSection", parent=base["Heading3"], fontName="Helvetica-Bold", fontSize=12.5, leading=15, textColor=TEXT),
        "Eyebrow": ParagraphStyle("Eyebrow", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=8.5, leading=10, textColor=ACCENT_BLUE),
        "MetricLabel": ParagraphStyle("MetricLabel", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=8.2, leading=10, textColor=TEXT_MUTED),
        "MetricValue": ParagraphStyle("MetricValue", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=16, leading=18, textColor=TEXT),
        "Bullet": ParagraphStyle("Bullet", parent=base["BodyText"], fontName="Helvetica", fontSize=10.5, leading=15, textColor=TEXT_SECONDARY),
    }


def paragraph(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(clean(text), style)


def bullet_list(items: Iterable[str], style: ParagraphStyle) -> ListFlowable:
    return ListFlowable(
        [paragraph(item, style) for item in items],
        bulletType="bullet",
        bulletText="-",
        leftIndent=16,
        bulletFontName="Helvetica-Bold",
        bulletFontSize=10,
        bulletOffsetY=2,
    )


def tinted_box(content: list[Any], fill: colors.Color = SURFACE_ALT, border: colors.Color = BORDER, left_accent: colors.Color | None = None) -> Table:
    table = Table([[content]], colWidths=[CONTENT_W])
    style = [
        ("BACKGROUND", (0, 0), (-1, -1), fill),
        ("BOX", (0, 0), (-1, -1), 0.8, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]
    if left_accent is not None:
        style.append(("LINEBEFORE", (0, 0), (0, 0), 4, left_accent))
    table.setStyle(TableStyle(style))
    return table


def metric_grid(metrics: dict[str, Any], diagnosis: dict[str, Any], styles: dict[str, ParagraphStyle]) -> Table:
    rows = [
        [paragraph("Forecast throughput / hr", styles["MetricLabel"]), paragraph("Primary bottleneck", styles["MetricLabel"])],
        [paragraph(f"<b>{fmt_num(metrics.get('globalMetrics', {}).get('forecastThroughput'), 3)}</b>", styles["MetricValue"]), paragraph(clean(metrics.get("globalMetrics", {}).get("leadTimeTopContributor") or diagnosis.get("primaryConstraint", "n/a")), styles["MetricValue"])],
        [paragraph("Queue risk", styles["MetricLabel"]), paragraph("Total WIP", styles["MetricLabel"])],
        [paragraph(f"<b>{fmt_pct(metrics.get('globalMetrics', {}).get('bottleneckIndex'), 0)}</b>", styles["MetricValue"]), paragraph(f"<b>{fmt_num(metrics.get('globalMetrics', {}).get('totalWipQty'), 1)}</b>", styles["MetricValue"])],
        [paragraph("Brittleness", styles["MetricLabel"]), paragraph("Confidence", styles["MetricLabel"])],
        [paragraph(f"<b>{fmt_pct(metrics.get('globalMetrics', {}).get('brittleness'), 0)}</b>", styles["MetricValue"]), paragraph(f"<b>{clean(diagnosis.get('confidence', 'n/a')).title()}</b>", styles["MetricValue"])],
    ]
    table = Table(rows, colWidths=[CONTENT_W / 2.0 - 6, CONTENT_W / 2.0 - 6], rowHeights=[0.34 * inch, 0.40 * inch, 0.34 * inch, 0.40 * inch, 0.34 * inch, 0.40 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SURFACE),
                ("BOX", (0, 0), (-1, -1), 0.8, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.8, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [SURFACE, SURFACE_ALT]),
            ]
        )
    )
    return table


def status_box(diagnosis: dict[str, Any], styles: dict[str, ParagraphStyle]) -> Table:
    status_fill, status_accent = {
        "stable": (SOFT_GREEN, ACCENT_GREEN),
        "stressed": (SOFT_AMBER, ACCENT_AMBER),
        "brittle": (colors.HexColor("#FFF4E5"), colors.HexColor("#C2410C")),
        "overloaded": (SOFT_RED, ACCENT_RED),
    }.get(clean(diagnosis.get("status", "unknown")).lower(), (SOFT_BLUE, ACCENT_BLUE))
    table = Table(
        [[paragraph("SYSTEM STATUS", styles["Eyebrow"]), paragraph(f"<b>{clean(diagnosis.get('status', 'unknown')).upper()}</b><br/>{clean(diagnosis.get('statusSummary', ''))}", styles["Body"])],],
        colWidths=[0.85 * inch, CONTENT_W - 0.85 * inch],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SURFACE),
                ("BOX", (0, 0), (-1, -1), 0.8, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LINEBEFORE", (0, 0), (0, 0), 4, status_accent),
                ("BACKGROUND", (0, 0), (0, 0), status_fill),
            ]
        )
    )
    return table


def page_decorator(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFillColor(ACCENT_BLUE)
    canvas.rect(0, PAGE_H - 6, PAGE_W, 6, stroke=0, fill=1)
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(1)
    canvas.line(MARGIN, 30, PAGE_W - MARGIN, 30)
    canvas.setFont("Helvetica", 8.5)
    canvas.setFillColor(TEXT_DISABLED)
    canvas.drawString(MARGIN, 16, "Kaizen Executive Report")
    canvas.drawRightString(PAGE_W - MARGIN, 16, f"Page {canvas.getPageNumber()}")
    canvas.restoreState()


def build_cover_page(model: dict[str, Any], metrics: dict[str, Any], diagnosis: dict[str, Any], styles: dict[str, ParagraphStyle]) -> list[Any]:
    story: list[Any] = [Spacer(1, 0.12 * inch), paragraph("KAIZEN EXECUTIVE REPORT", styles["Eyebrow"]), Spacer(1, 0.06 * inch)]
    story.append(Paragraph(clean(model.get("metadata", {}).get("name") or "Current Scenario"), styles["Title"]))
    story.append(Spacer(1, 0.08 * inch))
    story.append(Paragraph("Print-first executive summary for leadership review. This page is intentionally sparse so key risks are visible at a glance.", styles["Lead"]))
    story.append(Spacer(1, 0.18 * inch))
    story.append(status_box(diagnosis, styles))
    story.append(Spacer(1, 0.18 * inch))
    story.append(Paragraph("Key Metrics", styles["Section"]))
    story.append(Spacer(1, 0.08 * inch))
    story.append(metric_grid(metrics, diagnosis, styles))
    story.append(Spacer(1, 0.18 * inch))
    story.append(Paragraph("Recommended Action", styles["Section"]))
    story.append(Spacer(1, 0.05 * inch))
    story.append(tinted_box([paragraph(clean(diagnosis.get("recommendedAction", "")), styles["Lead"])], left_accent=ACCENT_BLUE))
    story.append(Spacer(1, 0.10 * inch))
    story.append(paragraph("Confidence note", styles["Eyebrow"]))
    story.append(Spacer(1, 0.04 * inch))
    story.append(Paragraph(clean(diagnosis.get("confidenceNote", "")), styles["BodyMuted"]))
    return story


def category_fill(category_key: str) -> tuple[colors.Color, colors.Color]:
    return {
        "manpower": (SOFT_GREEN, ACCENT_GREEN),
        "machine": (SOFT_BLUE, ACCENT_BLUE),
        "method": (SOFT_AMBER, ACCENT_AMBER),
        "material": (SOFT_TEAL, ACCENT_TEAL),
        "measurement": (SOFT_RED, ACCENT_RED),
    }.get(category_key, (SURFACE_ALT, ACCENT_BLUE))


def build_category_page(report: CategoryReport, position: int, styles: dict[str, ParagraphStyle]) -> list[Any]:
    fill, accent = category_fill(report.key)
    score = f"Priority score {report.priority_score:.1f}"
    score_box = Table([[paragraph(f"<b>{clean(score)}</b>", styles["BodyStrong"])]], colWidths=[1.55 * inch])
    score_box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), accent),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ]
        )
    )
    story: list[Any] = [
        PageBreak(),
        Spacer(1, 0.12 * inch),
        paragraph(f"FOCUS AREA {position}", styles["Eyebrow"]),
        Spacer(1, 0.05 * inch),
        Paragraph(clean(report.label), styles["Section"]),
        Spacer(1, 0.05 * inch),
        Paragraph(f"Focus step: {clean(report.focus_step)}", styles["BodyMuted"]),
        score_box,
        Spacer(1, 0.10 * inch),
        Paragraph(f"Key signals: utilization {fmt_pct(report.utilization)}, queue risk {fmt_pct(report.queue_risk)}, WIP {fmt_num(report.wip_qty, 1)}, lead time {fmt_minutes(report.lead_time_minutes)}.", styles["Lead"]),
        Spacer(1, 0.08 * inch),
        tinted_box([paragraph("Observed condition", styles["Eyebrow"]), Spacer(1, 0.03 * inch), Paragraph(clean(report.observed_condition), styles["Body"])], fill=fill, border=BORDER, left_accent=accent),
        Spacer(1, 0.12 * inch),
    ]
    for title, body in [
        ("Failure Modes", bullet_list(report.failure_modes, styles["Bullet"])),
        ("Cause and Effect", Paragraph(clean(report.cause_effect_chain), styles["Body"])),
        ("Audit Checks", bullet_list(report.audit_checks, styles["Bullet"])),
        ("Targeted Fixes", bullet_list(report.targeted_fixes, styles["Bullet"])),
    ]:
        story.append(Paragraph(title, styles["SubSection"]))
        story.append(Spacer(1, 0.04 * inch))
        story.append(body)
        story.append(Spacer(1, 0.10 * inch))
    story.append(tinted_box([Paragraph(f"<b>Expected impact:</b> queue reduction {fmt_minutes(report.queue_reduction_minutes)}, lead time reduction {fmt_minutes(report.lead_time_reduction_minutes)}, throughput gain {fmt_num(report.throughput_gain_units_per_hour, 2)} /hr.", styles["BodyStrong"]), Spacer(1, 0.02 * inch), Paragraph(clean(report.stability_effect), styles["BodyMuted"])], fill=fill, border=BORDER, left_accent=accent))
    return story


def render_preview(pdf_path: Path, preview_dir: Path, max_pages: int = 2) -> None:
    preview_dir.mkdir(parents=True, exist_ok=True)
    with fitz.open(pdf_path.as_posix()) as doc:
        for page_index in range(min(max_pages, doc.page_count)):
            pix = doc[page_index].get_pixmap(matrix=fitz.Matrix(1.7, 1.7), alpha=False)
            pix.save((preview_dir / f"{pdf_path.stem}-page-{page_index + 1}.png").as_posix())


def build_pdf(output_path: Path, preview_dir: Path | None = None) -> Path:
    compiled = read_json(ACTIVE / "compiled_forecast_model.json")
    scenario = read_json(ACTIVE / "scenario_committed.json")
    metrics = read_json(ACTIVE / "result_metrics.json")
    diagnosis = read_json(ACTIVE / "operational_diagnosis.json")
    styles = make_styles()
    reports = build_category_reports(compiled, scenario, metrics, diagnosis)
    story = build_cover_page(compiled, metrics, diagnosis, styles)
    for index, report in enumerate(reports, start=1):
        story.extend(build_category_page(report, index, styles))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(output_path.as_posix(), pagesize=LETTER, leftMargin=MARGIN, rightMargin=MARGIN, topMargin=0.6 * inch, bottomMargin=0.62 * inch, title="Kaizen Executive Report", author="Stress Test Pro")
    doc.build(story, onFirstPage=page_decorator, onLaterPages=page_decorator)
    if preview_dir is not None:
        render_preview(output_path, preview_dir)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    shutil.copy2(output_path, PUBLIC / output_path.name)
    return output_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a print-first Kaizen PDF report.")
    parser.add_argument("--output", default=str(OUTPUT / "kaizen-executive-report.pdf"))
    parser.add_argument("--preview-dir", default="")
    args = parser.parse_args()
    preview_dir = Path(args.preview_dir).resolve() if args.preview_dir else None
    path = build_pdf(Path(args.output).resolve(), preview_dir)
    print(f"PDF exported to {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
