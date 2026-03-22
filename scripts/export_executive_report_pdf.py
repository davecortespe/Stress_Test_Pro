#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import re
import shutil
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable

import fitz
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Flowable,
    KeepTogether,
    ListFlowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
ACTIVE = ROOT / "models" / "active"
OUTPUT = ROOT / "output" / "pdf"
PUBLIC = ROOT / "public" / "generated"

PAGE_W, PAGE_H = LETTER
MARGIN = 0.62 * inch
CONTENT_W = PAGE_W - (MARGIN * 2)

TEXT = colors.HexColor("#202733")
TEXT_SECONDARY = colors.HexColor("#405062")
TEXT_MUTED = colors.HexColor("#667587")
TEXT_DISABLED = colors.HexColor("#8391A3")
ACCENT = colors.HexColor("#314A68")
ACCENT_SOFT = colors.HexColor("#E8EEF5")
ACCENT_MUTED = colors.HexColor("#C9D4E1")
SUCCESS = colors.HexColor("#2E6E5B")
CAUTION = colors.HexColor("#9A6A1F")
ALERT = colors.HexColor("#9A3B2F")
SURFACE = colors.white
SURFACE_ALT = colors.HexColor("#F7F9FC")
BORDER = colors.HexColor("#D8E0EA")
DIVIDER = colors.HexColor("#E6EBF2")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def clean(value: Any) -> str:
    text = "" if value is None else str(value)
    text = text.replace("\r", " ").replace("\n", " ")
    text = text.replace("\u2014", "-").replace("\u2013", "-").replace("\u2011", "-")
    text = text.replace("\u2018", "'").replace("\u2019", "'")
    text = text.replace("\u201c", '"').replace("\u201d", '"')
    text = text.replace("\u00a0", " ")
    return re.sub(r"\s+", " ", text).strip()


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


def optional_num(value: Any) -> float | None:
    if isinstance(value, (int, float)) and math.isfinite(float(value)):
        return float(value)
    if isinstance(value, str) and value.strip():
        try:
            parsed = float(value)
            if math.isfinite(parsed):
                return parsed
        except ValueError:
            pass
    return None


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


def fmt_currency(value: Any) -> str:
    if not isinstance(value, (int, float)) or not math.isfinite(float(value)):
        return "--"
    return f"${float(value):,.2f}"


def confidence_label(trust_level: str) -> str:
    return {
        "high": "Confidence: Decision-ready",
        "medium": "Confidence: Directional",
        "low": "Confidence: Assumption-sensitive",
    }.get(clean(trust_level).lower(), "Confidence: Directional")


def round_or_none(value: float | None, digits: int = 1) -> float | None:
    if value is None or not math.isfinite(value):
        return None
    scale = 10 ** digits
    return round(value * scale) / scale


def safe_div(numerator: float | None, denominator: float | None) -> float | None:
    if numerator is None or denominator is None or not math.isfinite(numerator) or not math.isfinite(denominator):
        return None
    if abs(denominator) < 1e-9:
        return None
    return numerator / denominator


def chunked(items: list[Any], size: int) -> list[list[Any]]:
    return [items[index:index + size] for index in range(0, len(items), size)]


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


def step_override(scenario: dict[str, Any], step_id: str, field: str) -> Any:
    return scenario.get(f"step_{step_id}_{field}")


@dataclass
class StepFact:
    step_id: str
    step_name: str
    stage: str
    utilization: float | None
    queue_risk: float | None
    bottleneck_index: float | None
    lead_time_minutes: float | None
    explicit_lead_time_minutes: float | None
    queue_delay_minutes: float | None
    queue_depth: float | None
    wip_qty: float | None
    variability_cv: float
    changeover_penalty_minutes: float
    worker_count: int
    effective_units: float | None
    headroom: float | None
    downtime_pct: float
    effective_ct_minutes: float | None
    ct_minutes: float | None
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


@dataclass
class FlowBehaviorSummary:
    top_queue_steps: list[StepFact]
    top_pressure_steps: list[StepFact]
    top_lead_time_steps: list[StepFact]
    queue_instability_steps: list[StepFact]


@dataclass
class ThroughputSummary:
    primary_bottleneck: str
    next_bottleneck: str
    current_throughput: float | None
    improved_throughput: float | None
    estimated_gain_units: float | None
    estimated_gain_percent: float | None
    selling_price: float | None
    material_cost_per_unit: float | None
    labor_cost_per_unit: float | None
    equipment_cost_per_unit: float | None
    toc_throughput_per_unit: float | None
    fully_loaded_profit_per_unit: float | None
    bottleneck_time_per_unit: float | None
    toc_throughput_per_bottleneck_minute: float | None
    validations: list[str]
    top_cost_step: str | None


@dataclass
class WasteStep:
    step_name: str
    touch_time_minutes: float | None
    elapsed_time_minutes: float | None
    delay_minutes: float | None
    delay_pct: float | None
    fallback_note: str | None


@dataclass
class WasteSummary:
    total_elapsed_minutes: float | None
    total_touch_minutes: float | None
    total_delay_minutes: float | None
    delay_share: float | None
    value_add_ratio: float | None
    top_delay_step: str
    warnings: list[str]
    steps: list[WasteStep]


@dataclass
class AssumptionItem:
    identifier: str
    severity: str
    category: str
    title: str
    plain_language: str
    why_it_matters: str
    recommended_check: str


@dataclass
class AssumptionsSummary:
    trust_level: str
    headline: str
    summary: str
    safe_to_use_for: list[str]
    use_caution_for: list[str]
    priority_checks: list[str]
    items: list[AssumptionItem]
    counts: dict[str, int]


class RankedBarChart(Flowable):
    def __init__(self, items: list[tuple[str, float, str]], max_value: float, width: float = CONTENT_W, accent: colors.Color = ACCENT, item_colors: list[Any] | None = None, threshold: float | None = None):
        super().__init__()
        self.items = items
        self.max_value = max(max_value, 0.01)
        self.width = width
        self.height = max(1, len(items)) * 24
        self.accent = accent
        self.item_colors = item_colors
        self.threshold = threshold

    def wrap(self, availWidth, availHeight):
        return min(self.width, availWidth), self.height

    def draw(self):
        canvas = self.canv
        label_width = self.width * 0.44
        bar_width = self.width * 0.39
        start_y = self.height - 16
        canvas.setFont("Helvetica", 8.8)
        for index, (label, value, display) in enumerate(self.items):
            y = start_y - (index * 24)
            canvas.setFillColor(TEXT_SECONDARY)
            canvas.drawString(0, y, clean(label)[:42])
            canvas.setFillColor(colors.HexColor("#EEF3F8"))
            canvas.roundRect(label_width, y - 8, bar_width, 8, 2, fill=1, stroke=0)
            bar_color = self.item_colors[index] if self.item_colors and index < len(self.item_colors) else self.accent
            canvas.setFillColor(bar_color)
            fill_width = clamp(value / self.max_value, 0.0, 1.0) * bar_width
            canvas.roundRect(label_width, y - 8, fill_width, 8, 2, fill=1, stroke=0)
            canvas.setFillColor(TEXT)
            canvas.drawRightString(self.width - 2, y, clean(display))
        if self.threshold is not None:
            tx = label_width + clamp(self.threshold / self.max_value, 0.0, 1.0) * bar_width
            canvas.setStrokeColor(CAUTION)
            canvas.setLineWidth(1)
            canvas.setDash(3, 3)
            canvas.line(tx, 0, tx, self.height)
            canvas.setDash()


class CoverBand(Flowable):
    def __init__(self, operation_name: str, generated: str, stakes_text: str | None = None):
        super().__init__()
        self.operation_name = operation_name
        self.generated = generated
        self.stakes_text = stakes_text
        self.width = CONTENT_W
        self.height = 3.4 * inch

    def wrap(self, availWidth, availHeight):
        return min(self.width, availWidth), self.height

    def draw(self):
        c = self.canv
        c.saveState()
        c.translate(-MARGIN, 0)
        c.setFillColor(ACCENT)
        c.rect(0, 0, PAGE_W, self.height, stroke=0, fill=1)
        c.setFillColor(colors.HexColor("#FFD966"))
        c.setFont("Helvetica-Bold", 8)
        c.drawString(MARGIN, self.height - 0.44 * inch, "LEANSTORMING OPERATIONAL STRESS LABS")
        c.setStrokeColor(colors.white)
        c.setLineWidth(0.4)
        c.setStrokeAlpha(0.3)
        c.line(MARGIN, self.height - 0.56 * inch, PAGE_W - MARGIN, self.height - 0.56 * inch)
        c.setStrokeAlpha(1.0)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 26)
        c.drawString(MARGIN, self.height - 1.12 * inch, "Operational Decision Report")
        c.setFillColor(colors.HexColor("#C9D4E1"))
        c.setFont("Helvetica", 12.5)
        c.drawString(MARGIN, self.height - 1.56 * inch, self.operation_name)
        c.setFillColor(colors.HexColor("#8391A3"))
        c.setFont("Helvetica-Oblique", 9)
        c.drawString(MARGIN, self.height - 1.84 * inch, f"Simulation-backed operational diagnosis  \u00b7  {self.generated}")
        if self.stakes_text:
            c.setFillColor(colors.HexColor("#E8B46A"))
            c.setFont("Helvetica-Bold", 9.5)
            c.drawString(MARGIN, self.height - 2.22 * inch, self.stakes_text)
        c.restoreState()


class ConstraintMap(Flowable):
    def __init__(self, steps: list[tuple[str, float]], width: float = CONTENT_W):
        super().__init__()
        self.steps = steps[:7]
        self.width = width
        self.height = 1.7 * inch

    def wrap(self, availWidth, availHeight):
        return min(self.width, availWidth), self.height

    def draw(self):
        c = self.canv
        n = max(len(self.steps), 1)
        gap = 6
        box_w = (self.width - gap * (n - 1)) / n
        box_h = 0.82 * inch
        top_y = self.height - 0.08 * inch
        max_bi = max((bi for _, bi in self.steps), default=0.0)

        def _cm_pressure_color(bi: float) -> Any:
            if bi >= 0.85:
                return ALERT
            if bi >= 0.65:
                return CAUTION
            return SUCCESS

        for i, (name, bi) in enumerate(self.steps):
            x = i * (box_w + gap)
            c.setFillColor(_cm_pressure_color(bi))
            c.roundRect(x, top_y - box_h, box_w, box_h, 4, fill=1, stroke=0)
            c.setFillColor(colors.white)
            c.setFont("Helvetica-Bold", 7.8)
            c.drawCentredString(x + box_w / 2, top_y - 0.30 * inch, clean(name)[:18])
            c.setFont("Helvetica-Bold", 13)
            c.drawCentredString(x + box_w / 2, top_y - 0.60 * inch, fmt_pct(bi, 0))
            if i < n - 1:
                c.setFillColor(TEXT_MUTED)
                c.setFont("Helvetica", 9)
                c.drawCentredString(x + box_w + gap / 2, top_y - box_h / 2 - 4, "\u2192")
            if bi == max_bi:
                c.setFillColor(ALERT)
                c.setFont("Helvetica-Bold", 7)
                c.drawCentredString(x + box_w / 2, top_y - box_h - 0.18 * inch, "\u25bc  BOTTLENECK")


class ThroughputBars(Flowable):
    def __init__(self, current: float, potential: float, width: float = CONTENT_W * 0.62):
        super().__init__()
        self.current = max(current, 0.001)
        self.potential = max(potential, self.current)
        self.width = width
        self.height = 1.8 * inch

    def wrap(self, availWidth, availHeight):
        return min(self.width, availWidth), self.height

    def draw(self):
        c = self.canv
        max_val = self.potential
        bar_area_h = 1.28 * inch
        bar_w = self.width * 0.30
        gap = self.width * 0.10
        label_h = 0.28 * inch

        def _bar(x: float, value: float, fill: Any, label_top: str, label_bot: str) -> None:
            h = (value / max_val) * bar_area_h
            c.setFillColor(fill)
            c.roundRect(x, label_h, bar_w, h, 3, fill=1, stroke=0)
            c.setFillColor(TEXT)
            c.setFont("Helvetica-Bold", 9)
            c.drawCentredString(x + bar_w / 2, label_h + h + 5, label_top)
            c.setFillColor(TEXT_MUTED)
            c.setFont("Helvetica", 7.8)
            c.drawCentredString(x + bar_w / 2, 2, label_bot)

        _bar(0, self.current, ACCENT, fmt_num(self.current, 2) + " /hr", "Current")
        _bar(bar_w + gap, self.potential, SUCCESS, fmt_num(self.potential, 2) + " /hr", "Potential")

        gain = self.potential - self.current
        if gain > 0:
            curr_top_y = label_h + (self.current / max_val) * bar_area_h
            pot_top_y = label_h + bar_area_h
            mid_x = bar_w + gap / 2
            c.setStrokeColor(CAUTION)
            c.setFillColor(CAUTION)
            c.setLineWidth(0.8)
            c.setDash(2, 2)
            c.line(bar_w + 4, curr_top_y, bar_w + gap - 4, curr_top_y)
            c.line(bar_w + 4, pot_top_y, bar_w + gap - 4, pot_top_y)
            c.line(mid_x, curr_top_y, mid_x, pot_top_y)
            c.setDash()
            c.setFont("Helvetica-Bold", 7.5)
            c.drawCentredString(mid_x, (curr_top_y + pot_top_y) / 2 - 4, f"+{fmt_num(gain, 2)}")


def category_label(category: str) -> str:
    return {
        "manpower": "Manpower",
        "machine": "Machine",
        "method": "Method",
        "material": "Material / Information",
        "measurement": "Measurement",
    }.get(category, "Kaizen")


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
        node = node_metrics.get(step_id, {})
        ct_minutes = optional_num(step.get("ctMinutes"))
        lead_time_minutes = optional_num(node.get("leadTimeMinutes"))
        if lead_time_minutes is None:
            lead_time_minutes = optional_num(step.get("leadTimeMinutes"))
        effective_ct_minutes = optional_num(step.get("effectiveCtMinutes"))
        base_ct = effective_ct_minutes if effective_ct_minutes is not None else ct_minutes
        queue_delay = max(0.0, lead_time_minutes - base_ct) if lead_time_minutes is not None and base_ct is not None else None
        facts.append(
            StepFact(
                step_id=step_id,
                step_name=clean(step.get("label", step_id)),
                stage=clean(step.get("stage", "")),
                utilization=optional_num(node.get("utilization")),
                queue_risk=optional_num(node.get("queueRisk")),
                bottleneck_index=optional_num(node.get("bottleneckIndex")),
                lead_time_minutes=lead_time_minutes,
                explicit_lead_time_minutes=optional_num(step.get("leadTimeMinutes")),
                queue_delay_minutes=queue_delay,
                queue_depth=optional_num(node.get("queueDepth")),
                wip_qty=optional_num(node.get("wipQty")),
                variability_cv=num(step.get("variabilityCv"), 0.18),
                changeover_penalty_minutes=max(0.0, num(step.get("changeoverPenaltyPerUnitMinutes"), 0.0)),
                worker_count=max(1, int(round(num(step.get("workerCount"), 1)))),
                effective_units=optional_num(step.get("effectiveUnits")),
                headroom=optional_num(node.get("headroom")),
                downtime_pct=clamp(num(step_override(scenario, step_id, "downtimePct"), global_downtime), 0, 95),
                effective_ct_minutes=effective_ct_minutes,
                ct_minutes=ct_minutes,
                missing_ct=step.get("ctMinutes") is None,
                missing_lead_time=step.get("leadTimeMinutes") is None and node.get("leadTimeMinutes") is None,
                assumption_count=assumption_count(model, step_id, clean(step.get("label", step_id))),
            )
        )
    return facts


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
    measurement_gap = clamp(
        (0.55 if fact.missing_ct else 0.0)
        + (0.35 if fact.missing_lead_time else 0.0)
        + min(0.25, fact.assumption_count * 0.08),
        0.0,
        1.0,
    )
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
            f"Jobs are likely being released before material, paperwork, approvals, or upstream prep are fully ready.",
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
            f"Watch two recoveries from a stop and time restart-to-first-good-unit.",
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
            f"Walk the queue physically and confirm whether queued work is truly ready to run.",
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
            f"Add a short pre-release check for missing paperwork, approvals, or prep that currently creates hidden waiting.",
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


def build_flow_behavior(facts: list[StepFact]) -> FlowBehaviorSummary:
    by_queue = sorted(facts, key=lambda fact: (num(fact.queue_depth, -1), num(fact.wip_qty, -1)), reverse=True)
    by_pressure = sorted(facts, key=lambda fact: (num(fact.bottleneck_index, -1), num(fact.utilization, -1)), reverse=True)
    by_lead = sorted(facts, key=lambda fact: num(fact.lead_time_minutes, -1), reverse=True)
    unstable = [fact for fact in facts if num(fact.queue_risk, 0) >= 0.7 or num(fact.bottleneck_index, 0) >= 0.85]
    unstable = sorted(unstable, key=lambda fact: (num(fact.queue_risk, -1), num(fact.bottleneck_index, -1)), reverse=True)
    return FlowBehaviorSummary(
        top_queue_steps=by_queue[:4],
        top_pressure_steps=by_pressure[:4],
        top_lead_time_steps=by_lead[:4],
        queue_instability_steps=unstable[:4] if unstable else by_pressure[:3],
    )


def assumption_category(text: str) -> str:
    lower = text.lower()
    if re.search(r"(worker|staff|equipment count|shift|uptime)", lower):
        return "Capacity inputs"
    if re.search(r"(demand|mix|lot size)", lower):
        return "Demand inputs"
    if re.search(r"(lead time|wait)", lower):
        return "Time data"
    if re.search(r"(variability|queue risk|bottleneck index|brittleness|migration|heuristic)", lower):
        return "Forecast logic"
    if re.search(r"(changeover|setup)", lower):
        return "Setup data"
    return "General setup"


def assumption_title(text: str) -> str:
    lower = text.lower()
    if re.search(r"(worker|staff|equipment count)", lower):
        return "Staffing and equipment counts are incomplete"
    if re.search(r"(demand rate is not shown|baseline demand.*seeded|demand rate and product mix are not visible)", lower):
        return "Demand was estimated"
    if re.search(r"(demand rate, product mix, lot size, shift hours, and uptime)", lower):
        return "Several planning inputs are missing"
    if re.search(r"(shift calendar|active.*shift|hours per shift)", lower):
        return "Shift schedule was defaulted"
    if re.search(r"(variability.*default)", lower):
        return "Variability was defaulted"
    if re.search(r"(lot-size fallback|lot size)", lower):
        return "Lot size was assumed for setup math"
    if re.search(r"(lead time.*transcribed|wait/flow-delay)", lower):
        return "Lead time was taken from the VSM image"
    if re.search(r"(heuristics|rapid recompute)", lower):
        return "Some risk signals are heuristic"
    words = text.strip().split()
    return " ".join(words[:6]).rstrip(".,;") if words else "Model assumption"


def assumption_plain_language(text: str) -> str:
    lower = text.lower()
    if re.search(r"(worker|staff|equipment count)", lower):
        return "The model does not know the real staffing or equipment counts for every step."
    if re.search(r"(demand rate is not shown|baseline demand.*seeded|demand rate and product mix are not visible)", lower):
        return "The incoming demand level was estimated instead of read from confirmed planning data."
    if re.search(r"(demand rate, product mix, lot size, shift hours, and uptime)", lower):
        return "Important planning inputs were not visible in the source, so the model had to fill gaps."
    if re.search(r"(shift calendar|active.*shift|hours per shift)", lower):
        return "The model assumes a default shift pattern unless you override it."
    if re.search(r"(variability.*default)", lower):
        return "The model uses a standard variability setting rather than measured variation from the process."
    if re.search(r"(lot-size fallback|lot size)", lower):
        return "Setup impact per unit was estimated because the actual lot size was not available."
    if re.search(r"(lead time.*transcribed|wait/flow-delay)", lower):
        return "Lead-time values came directly from the VSM image and were treated as waiting or delay time."
    if re.search(r"(heuristics|rapid recompute)", lower):
        return "Some risk scores are fast forecast indicators, not detailed simulation physics."
    return clean(text)


def assumption_why(text: str) -> str:
    lower = text.lower()
    if re.search(r"(worker|staff|equipment count)", lower):
        return "Capacity and bottleneck advice can shift once the true resource counts are known."
    if re.search(r"(demand|mix)", lower):
        return "If demand or mix is wrong, the model can point to the wrong constraint or overstate risk."
    if re.search(r"(shift|uptime)", lower):
        return "Operating time assumptions directly change available capacity and queue build-up."
    if re.search(r"(variability)", lower):
        return "Queue growth and brittleness are very sensitive to real-world variability."
    if re.search(r"(lot size|changeover|setup)", lower):
        return "Setup losses can be under- or over-estimated without the actual batch policy."
    if re.search(r"(heuristics|queue risk|bottleneck index|brittleness|migration)", lower):
        return "These indicators are useful for screening, but they should not be treated like precise predictions."
    category = assumption_category(text)
    if category == "Capacity inputs":
        return "Capacity and bottleneck conclusions are sensitive to resource counts — verify before acting."
    if category == "Demand inputs":
        return "Demand errors can misidentify the bottleneck entirely — treat constraint findings as directional."
    if category == "Time data":
        return "Lead time figures drive waste calculations — confirm these are measured, not estimated."
    if category == "Forecast logic":
        return "These are screening indicators — validate with floor observation before making structural decisions."
    if category == "Setup data":
        return "Setup loss estimates affect capacity calculations — confirm the actual batch policy."
    return "This assumption changes how much confidence you should place in the final recommendation."


def assumption_recommended_check(text: str) -> str:
    lower = text.lower()
    if re.search(r"(worker|staff|equipment count)", lower):
        return "Confirm the actual headcount, parallel units, and usable equipment at the constrained steps."
    if re.search(r"(demand rate is not shown|baseline demand.*seeded|demand rate and product mix are not visible)", lower):
        return "Replace the estimated demand with the real hourly or daily demand plan."
    if re.search(r"(demand rate, product mix, lot size, shift hours, and uptime)", lower):
        return "Fill in the missing planning inputs before using the report for commitments or budget decisions."
    if re.search(r"(shift calendar|active.*shift|hours per shift)", lower):
        return "Set the real number of operating shifts for this line."
    if re.search(r"(variability.*default)", lower):
        return "Use measured cycle-time variation if it exists."
    if re.search(r"(lot-size fallback|lot size)", lower):
        return "Enter the normal batch or lot size used for setup and changeover decisions."
    if re.search(r"(heuristics|queue risk|bottleneck index|brittleness|migration)", lower):
        return "Use these signals to focus discussion, then validate the conclusion with floor knowledge or scenario testing."
    category = assumption_category(text)
    if category == "Capacity inputs":
        return "Confirm headcount, parallel units, and usable equipment at the affected steps."
    if category == "Demand inputs":
        return "Pull confirmed demand rate and product mix from planning data before treating results as final."
    if category == "Time data":
        return "Verify lead time values against a direct timed observation or production log."
    if category == "Forecast logic":
        return "Use these signals to focus discussion, then validate conclusions with floor knowledge."
    if category == "Setup data":
        return "Enter the actual batch or lot size used for changeover and scheduling decisions."
    return "Confirm this assumption with the process owner before treating results as final."


def build_assumptions_summary(model: dict[str, Any]) -> AssumptionsSummary:
    assumptions = model.get("assumptions", [])
    items = [
        AssumptionItem(
            identifier=clean(assumption.get("id") or f"assumption-{index + 1}"),
            severity=clean(assumption.get("severity", "info")),
            category=assumption_category(clean(assumption.get("text", ""))),
            title=assumption_title(clean(assumption.get("text", ""))),
            plain_language=assumption_plain_language(clean(assumption.get("text", ""))),
            why_it_matters=assumption_why(clean(assumption.get("text", ""))),
            recommended_check=assumption_recommended_check(clean(assumption.get("text", ""))),
        )
        for index, assumption in enumerate(assumptions)
    ]
    counts = {
        "total": len(items),
        "info": sum(1 for item in items if item.severity == "info"),
        "warning": sum(1 for item in items if item.severity == "warning"),
        "blocker": sum(1 for item in items if item.severity == "blocker"),
    }
    trust_level = "high"
    if counts["blocker"] > 0 or counts["warning"] >= 4:
        trust_level = "low"
    elif counts["warning"] >= 2:
        trust_level = "medium"
    safe_to_use_for = {
        "high": ["Quick bottleneck screening", "Internal improvement discussions", "Comparing small scenario changes"],
        "medium": ["Directional prioritization", "Early bottleneck discussions", "Preparing data-collection follow-up"],
        "low": ["Framing questions for the team", "Spotting where more data is needed", "Guiding what to validate next"],
    }[trust_level]
    use_caution_for = ["Final budget approval", "External commitments"] if trust_level == "high" else ["Final staffing commitments", "Budget or ROI decisions", "Customer or production promises"]
    priority_checks: list[str] = []
    for item in items:
        if item.severity == "info":
            continue
        if item.recommended_check not in priority_checks:
            priority_checks.append(item.recommended_check)
        if len(priority_checks) >= 4:
            break
    headline = {
        "high": "These results are based on a mostly complete model.",
        "medium": "These results are directionally useful, but some key inputs still need confirmation.",
        "low": "These results should be treated as a first-pass forecast, not a final answer.",
    }[trust_level]
    if counts["total"] == 0:
        summary = "No model assumptions were recorded for this scenario."
    elif trust_level == "high":
        summary = f"The model includes {counts['total']} documented assumptions, but most are low-risk context notes rather than major gaps."
    elif trust_level == "medium":
        summary = f"The model includes {counts['total']} documented assumptions, including {counts['warning']} that could change the recommendation if they are wrong."
    else:
        summary = f"The model includes {counts['total']} documented assumptions, including {counts['warning'] + counts['blocker']} high-impact gaps that can materially change the results."
    return AssumptionsSummary(trust_level, headline, summary, safe_to_use_for, use_caution_for, priority_checks, items, counts)


def build_throughput_summary(model: dict[str, Any], master_data: dict[str, Any], scenario: dict[str, Any], metrics: dict[str, Any]) -> ThroughputSummary:
    step_models = model.get("stepModels", [])
    node_metrics = metrics.get("nodeMetrics", {})
    primary_step_id = next((step_id for step_id, values in node_metrics.items() if values.get("bottleneckFlag")), None)
    if primary_step_id is None:
        primary_step_id = model.get("baseline", {}).get("bottleneckStepId")
    step_name_by_id = {step.get("stepId"): clean(step.get("label", step.get("stepId"))) for step in step_models}
    current_throughput = optional_num(metrics.get("globalMetrics", {}).get("forecastThroughput"))
    throughput_delta = optional_num(metrics.get("globalMetrics", {}).get("throughputDelta"))
    improved_throughput = None if current_throughput is None or throughput_delta is None else current_throughput + throughput_delta
    estimated_gain_percent = safe_div(throughput_delta, current_throughput)
    migration_text = clean(metrics.get("globalMetrics", {}).get("bottleneckMigration", ""))
    migration_parts = [part.strip() for part in migration_text.split("->") if part.strip()]
    next_bottleneck = re.sub(r"\s*\(.*\)$", "", migration_parts[0]).strip() if migration_parts else ""
    if not next_bottleneck:
        ranked = sorted(((step_id, optional_num(values.get("bottleneckIndex")) or 0.0) for step_id, values in node_metrics.items() if step_id != primary_step_id), key=lambda row: row[1], reverse=True)
        next_bottleneck = step_name_by_id.get(ranked[0][0], ranked[0][0]) if ranked else step_name_by_id.get(primary_step_id, "n/a")
    processing_rows = {clean(row.get("stepId")): row for row in master_data.get("processing", [])}
    selling_price = optional_num(scenario.get("sellingPricePerUnit"))
    if selling_price is None or selling_price <= 0:
        first_product = (master_data.get("products") or [{}])[0]
        selling_price = optional_num(first_product.get("sellingPricePerUnit"))
    if selling_price is not None and selling_price <= 0:
        selling_price = None
    material_costs: list[float | None] = []
    labor_costs: list[float | None] = []
    equipment_costs: list[float | None] = []
    top_cost_step = None
    top_cost_value = -1.0
    bottleneck_time_per_unit = None
    if primary_step_id:
        primary_step = next((step for step in step_models if clean(step.get("stepId")) == primary_step_id), None)
        effective_ct = optional_num(primary_step.get("effectiveCtMinutes")) if primary_step else None
        effective_units = optional_num(primary_step.get("effectiveUnits")) if primary_step else None
        if effective_ct is not None and effective_units is not None and effective_units > 0:
            bottleneck_time_per_unit = effective_ct / effective_units
    for step in step_models:
        step_id = clean(step.get("stepId"))
        processing = processing_rows.get(step_id, {})
        material_cost = optional_num(processing.get("materialCostPerUnit"))
        labor_rate = optional_num(processing.get("laborRatePerHour"))
        equipment_rate = optional_num(processing.get("equipmentRatePerHour"))
        effective_ct = optional_num(step.get("effectiveCtMinutes")) or optional_num(step.get("ctMinutes"))
        effective_units = optional_num(step.get("effectiveUnits"))
        time_hours = effective_ct / effective_units / 60.0 if effective_ct is not None and effective_units is not None and effective_units > 0 else None
        labor_cost = labor_rate * time_hours if labor_rate is not None and time_hours is not None else None
        equipment_cost = equipment_rate * time_hours if equipment_rate is not None and time_hours is not None else None
        total_step_cost = None if material_cost is None or labor_cost is None or equipment_cost is None else material_cost + labor_cost + equipment_cost
        material_costs.append(material_cost)
        labor_costs.append(labor_cost)
        equipment_costs.append(equipment_cost)
        if total_step_cost is not None and total_step_cost > top_cost_value:
            top_cost_value = total_step_cost
            top_cost_step = clean(step.get("label", step_id))
    material_cost_per_unit = sum(material_costs) if material_costs and all(value is not None for value in material_costs) else None
    labor_cost_per_unit = sum(labor_costs) if labor_costs and all(value is not None for value in labor_costs) else None
    equipment_cost_per_unit = sum(equipment_costs) if equipment_costs and all(value is not None for value in equipment_costs) else None
    toc_throughput_per_unit = selling_price - material_cost_per_unit if selling_price is not None and material_cost_per_unit is not None else None
    fully_loaded_profit_per_unit = selling_price - material_cost_per_unit - labor_cost_per_unit - equipment_cost_per_unit if selling_price is not None and material_cost_per_unit is not None and labor_cost_per_unit is not None and equipment_cost_per_unit is not None else None
    toc_throughput_per_bottleneck_minute = toc_throughput_per_unit / bottleneck_time_per_unit if toc_throughput_per_unit is not None and bottleneck_time_per_unit is not None and bottleneck_time_per_unit > 0 else None
    validations: list[str] = []
    if selling_price is None:
        validations.append("Transfer price per unit is missing, so economics are shown as directional only.")
    if material_cost_per_unit is None:
        validations.append("Step-level material costs are incomplete, so throughput value per unit cannot be finalized.")
    if labor_cost_per_unit is None:
        validations.append("Labor rates are incomplete, so fully loaded profit is not available.")
    if equipment_cost_per_unit is None:
        validations.append("Equipment rates are incomplete, so fully loaded profit is not available.")
    if throughput_delta is None:
        validations.append("The next-constraint gain estimate is not available from the current metrics snapshot.")
    return ThroughputSummary(
        primary_bottleneck=step_name_by_id.get(primary_step_id, clean(primary_step_id or "n/a")),
        next_bottleneck=next_bottleneck or "n/a",
        current_throughput=current_throughput,
        improved_throughput=improved_throughput,
        estimated_gain_units=throughput_delta,
        estimated_gain_percent=estimated_gain_percent,
        selling_price=selling_price,
        material_cost_per_unit=material_cost_per_unit,
        labor_cost_per_unit=labor_cost_per_unit,
        equipment_cost_per_unit=equipment_cost_per_unit,
        toc_throughput_per_unit=toc_throughput_per_unit,
        fully_loaded_profit_per_unit=fully_loaded_profit_per_unit,
        bottleneck_time_per_unit=bottleneck_time_per_unit,
        toc_throughput_per_bottleneck_minute=toc_throughput_per_bottleneck_minute,
        validations=validations,
        top_cost_step=top_cost_step,
    )


def build_waste_summary(facts: list[StepFact]) -> WasteSummary:
    steps: list[WasteStep] = []
    warnings: list[str] = []
    for fact in facts:
        touch_time = fact.effective_ct_minutes if fact.effective_ct_minutes is not None else fact.ct_minutes
        elapsed_time = fact.lead_time_minutes if fact.lead_time_minutes is not None else fact.explicit_lead_time_minutes
        fallback_note = None
        if touch_time is None and elapsed_time is not None:
            touch_time = elapsed_time
            fallback_note = "CT copied from LT because step time is missing."
        elif elapsed_time is None and touch_time is not None:
            elapsed_time = touch_time
            fallback_note = "LT copied from CT because elapsed time is missing."
        delay = None
        delay_pct = None
        if touch_time is not None and elapsed_time is not None:
            delay = max(0.0, elapsed_time - touch_time)
            delay_pct = delay / elapsed_time if elapsed_time > 0 else 0.0
            if elapsed_time + 1e-9 < touch_time:
                warnings.append(f"{fact.step_name} shows LT below CT in the source data; delay is forced to zero.")
        if fallback_note:
            warnings.append(f"{fact.step_name}: {fallback_note}")
        steps.append(WasteStep(fact.step_name, round_or_none(touch_time, 1), round_or_none(elapsed_time, 1), round_or_none(delay, 1), round_or_none(delay_pct, 3), fallback_note))
    total_elapsed = sum(step.elapsed_time_minutes for step in steps if step.elapsed_time_minutes is not None) if steps else None
    total_touch = sum(step.touch_time_minutes for step in steps if step.touch_time_minutes is not None) if steps else None
    total_delay = sum(step.delay_minutes for step in steps if step.delay_minutes is not None) if steps else None
    delay_share = safe_div(total_delay, total_elapsed)
    value_add_ratio = None if delay_share is None else max(0.0, 1.0 - delay_share)
    ranked = sorted(steps, key=lambda step: num(step.delay_minutes, -1), reverse=True)
    return WasteSummary(round_or_none(total_elapsed, 1), round_or_none(total_touch, 1), round_or_none(total_delay, 1), delay_share, value_add_ratio, ranked[0].step_name if ranked else "n/a", list(dict.fromkeys(warnings))[:6], ranked)


def build_recommended_actions(diagnosis: dict[str, Any], kaizen_reports: list[CategoryReport], waste_summary: WasteSummary, assumptions_summary: AssumptionsSummary, flow_summary: FlowBehaviorSummary) -> list[dict[str, str]]:
    actions: list[dict[str, str]] = [
        {
            "title": "Stabilize the active constraint first",
            "why": clean(diagnosis.get("recommendedAction", "Reduce effective cycle time at the active bottleneck before expanding elsewhere.")),
            "effect": f"Expected immediate gain is about {fmt_num(kaizen_reports[0].throughput_gain_units_per_hour, 2)} units/hr if the bottleneck mechanism is removed." if kaizen_reports else "Expected effect is better queue stability at the bottleneck.",
            "when": "This week",
        }
    ]
    if kaizen_reports:
        top_report = kaizen_reports[0]
        actions.append(
            {
                "title": f"Run the first improvement event at {top_report.focus_step}",
                "why": clean(top_report.cause_effect_chain),
                "effect": f"Likely leverage: {fmt_minutes(top_report.queue_reduction_minutes)} less queue delay and {fmt_minutes(top_report.lead_time_reduction_minutes)} less lead time.",
                "when": "30 days",
            }
        )
    if flow_summary.top_queue_steps:
        actions.append(
            {
                "title": "Put release and WIP discipline around the largest queue",
                "why": f"{flow_summary.top_queue_steps[0].step_name} is carrying the heaviest queue and is driving system-level delay.",
                "effect": "Reduces hidden delay and prevents the line from flooding the next near-constraint.",
                "when": "This week",
            }
        )
    actions.append(
        {
            "title": "Separate data validation from action execution",
            "why": assumptions_summary.priority_checks[0] if assumptions_summary.priority_checks else "Several inputs still need confirmation before using the report for bigger commitments.",
            "effect": "Improves trust in the recommendation without delaying immediate containment work.",
            "when": "Ongoing",
        }
    )
    if waste_summary.top_delay_step != "n/a":
        actions.append(
            {
                "title": f"Attack structural waiting at {waste_summary.top_delay_step}",
                "why": f"{waste_summary.top_delay_step} is contributing the largest delay pocket in the current modeled path.",
                "effect": "Separates touch time from waiting so the team works on real delay instead of anecdotal friction.",
                "when": "30\u201360 days",
            }
        )
    return actions[:5]


def make_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "Body": ParagraphStyle("Body", parent=base["BodyText"], fontName="Helvetica", fontSize=10.4, leading=14.6, textColor=TEXT_SECONDARY, alignment=TA_LEFT),
        "BodyMuted": ParagraphStyle("BodyMuted", parent=base["BodyText"], fontName="Helvetica", fontSize=9.8, leading=13.5, textColor=TEXT_MUTED, alignment=TA_LEFT),
        "BodyStrong": ParagraphStyle("BodyStrong", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=10.3, leading=14.4, textColor=TEXT, alignment=TA_LEFT),
        "Title": ParagraphStyle("Title", parent=base["Title"], fontName="Helvetica-Bold", fontSize=24, leading=28, textColor=TEXT),
        "Lead": ParagraphStyle("Lead", parent=base["BodyText"], fontName="Helvetica", fontSize=11.2, leading=16.4, textColor=TEXT_SECONDARY, alignment=TA_LEFT),
        "Section": ParagraphStyle("Section", parent=base["Heading2"], fontName="Helvetica-Bold", fontSize=15.5, leading=19, textColor=TEXT),
        "SubSection": ParagraphStyle("SubSection", parent=base["Heading3"], fontName="Helvetica-Bold", fontSize=11.6, leading=14.8, textColor=TEXT),
        "Eyebrow": ParagraphStyle("Eyebrow", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=8.3, leading=10, textColor=ACCENT, alignment=TA_LEFT),
        "MetricLabel": ParagraphStyle("MetricLabel", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=8.1, leading=10, textColor=TEXT_MUTED),
        "MetricValue": ParagraphStyle("MetricValue", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=20, leading=23, textColor=TEXT),
        "Bullet": ParagraphStyle("Bullet", parent=base["BodyText"], fontName="Helvetica", fontSize=10.1, leading=14.1, textColor=TEXT_SECONDARY),
        "SmallCaps": ParagraphStyle("SmallCaps", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=7.8, leading=10, textColor=TEXT_MUTED),
        "AppendixBody": ParagraphStyle("AppendixBody", parent=base["BodyText"], fontName="Helvetica", fontSize=9.1, leading=12.0, textColor=TEXT_MUTED, alignment=TA_LEFT),
        "AppendixLabel": ParagraphStyle("AppendixLabel", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=7.5, leading=9.5, textColor=TEXT_DISABLED),
    }


def paragraph(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(clean(text), style)


def bullet_list(items: Iterable[str], style: ParagraphStyle) -> ListFlowable:
    return ListFlowable([paragraph(item, style) for item in items if clean(item)], bulletType="bullet", bulletText="-", leftIndent=16, bulletFontName="Helvetica-Bold", bulletFontSize=10, bulletOffsetY=2)


def divider() -> Table:
    table = Table([[""]], colWidths=[CONTENT_W], rowHeights=[2])
    table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), DIVIDER)]))
    return table


def tinted_box(content: list[Any], fill: colors.Color = SURFACE_ALT, border: colors.Color = BORDER, left_accent: colors.Color | None = None, padding: int = 12, width: float = CONTENT_W) -> Table:
    table = Table([[content]], colWidths=[width])
    style = [
        ("BACKGROUND", (0, 0), (-1, -1), fill),
        ("BOX", (0, 0), (-1, -1), 0.8, border),
        ("LEFTPADDING", (0, 0), (-1, -1), padding),
        ("RIGHTPADDING", (0, 0), (-1, -1), padding),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]
    if left_accent is not None:
        style.append(("LINEBEFORE", (0, 0), (0, 0), 3, left_accent))
    table.setStyle(TableStyle(style))
    return table


def section_header(kicker: str, title: str, takeaway: str, styles: dict[str, ParagraphStyle]) -> list[Any]:
    return [
        paragraph(kicker, styles["Eyebrow"]),
        Spacer(1, 0.05 * inch),
        Paragraph(clean(title), styles["Section"]),
        Spacer(1, 0.05 * inch),
        tinted_box([paragraph("What this means", styles["SmallCaps"]), Spacer(1, 0.04 * inch), Paragraph(clean(takeaway), styles["Lead"])], fill=SURFACE_ALT, border=BORDER, left_accent=ACCENT),
        Spacer(1, 0.12 * inch),
    ]


_SEMANTIC_FILLS: dict[str, Any] = {
    "positive": colors.HexColor("#EDF6F3"),
    "alert":    colors.HexColor("#F9EDEC"),
    "caution":  colors.HexColor("#FFF8EC"),
}

def kpi_strip(items: list[tuple[str, str]], styles: dict[str, ParagraphStyle], col_semantics: list[str] | None = None) -> Table:
    rows = [[paragraph(label, styles["MetricLabel"]) for label, _ in items], [paragraph(f"<b>{value}</b>", styles["MetricValue"]) for _, value in items]]
    widths = [CONTENT_W / max(1, len(items)) for _ in items]
    table = Table(rows, colWidths=widths)
    style_cmds = [("BOX", (0, 0), (-1, -1), 0.8, BORDER), ("INNERGRID", (0, 0), (-1, -1), 0.8, BORDER), ("BACKGROUND", (0, 0), (-1, -1), SURFACE), ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8), ("VALIGN", (0, 0), (-1, -1), "TOP")]
    if col_semantics:
        for col_index, semantic in enumerate(col_semantics):
            fill = _SEMANTIC_FILLS.get(semantic or "neutral")
            if fill:
                style_cmds.append(("BACKGROUND", (col_index, 0), (col_index, -1), fill))
    table.setStyle(TableStyle(style_cmds))
    return table


def evidence_table(headers: list[str], rows: list[list[str]], col_widths: list[float], styles: dict[str, ParagraphStyle]) -> Table:
    body = [[paragraph(header, styles["MetricLabel"]) for header in headers]]
    for row in rows:
        body.append([paragraph(cell, styles["Body"]) for cell in row])
    table = Table(body, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), SURFACE_ALT), ("TEXTCOLOR", (0, 0), (-1, -1), TEXT), ("BOX", (0, 0), (-1, -1), 0.8, BORDER), ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [SURFACE, SURFACE_ALT]), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    return table


def appendix_table(headers: list[str], rows: list[list[str]], col_widths: list[float], styles: dict[str, ParagraphStyle]) -> Table:
    body = [[paragraph(header, styles["AppendixLabel"]) for header in headers]]
    for row in rows:
        body.append([paragraph(cell, styles["AppendixBody"]) for cell in row])
    table = Table(body, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#FAFBFD")), ("TEXTCOLOR", (0, 0), (-1, -1), TEXT_MUTED), ("BOX", (0, 0), (-1, -1), 0.6, DIVIDER), ("INNERGRID", (0, 0), (-1, -1), 0.4, DIVIDER), ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FBFCFE")]), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    return table


def make_page_decorator(operation_name: str):
    def page_decorator(canvas, doc) -> None:
        canvas.saveState()
        canvas.setFillColor(ACCENT)
        canvas.rect(0, PAGE_H - 20, PAGE_W, 20, stroke=0, fill=1)
        canvas.setFillColor(colors.HexColor("#FFD966"))
        canvas.setFont("Helvetica-Bold", 7.2)
        canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 13.5, "LEANSTORMING OPERATIONAL STRESS LABS")
        canvas.setStrokeColor(DIVIDER)
        canvas.setLineWidth(1)
        canvas.line(MARGIN, 30, PAGE_W - MARGIN, 30)
        canvas.setFont("Helvetica", 8.2)
        canvas.setFillColor(TEXT_DISABLED)
        footer_left = f"{operation_name}  \u00b7  Operational Decision Report"
        canvas.drawString(MARGIN, 16, footer_left)
        canvas.drawRightString(PAGE_W - MARGIN, 16, f"Page {canvas.getPageNumber()}")
        canvas.restoreState()
    return page_decorator


def build_cover_page(model: dict[str, Any], diagnosis: dict[str, Any], facts: list[StepFact], assumptions_summary: AssumptionsSummary, throughput: "ThroughputSummary", styles: dict[str, ParagraphStyle]) -> list[Any]:
    generated = datetime.now().strftime("%B %d, %Y")
    operation_name = clean(model.get("metadata", {}).get("name") or "Current Operation")
    recommended_focus = clean(diagnosis.get("recommendedAction", "Stabilize the active bottleneck first."))
    fact_boxes = Table(
        [[
            tinted_box([paragraph("System status", styles["SmallCaps"]), Spacer(1, 0.03 * inch), Paragraph(clean(diagnosis.get("status", "Unknown")).title(), styles["BodyStrong"])], fill=SURFACE_ALT, border=BORDER, left_accent=ACCENT, padding=10, width=CONTENT_W * 0.22 - 8),
            tinted_box([paragraph("Primary constraint", styles["SmallCaps"]), Spacer(1, 0.03 * inch), Paragraph(clean(diagnosis.get("primaryConstraint", "n/a")), styles["Body"])], fill=SURFACE_ALT, border=BORDER, left_accent=ACCENT, padding=10, width=CONTENT_W * 0.32 - 8),
            tinted_box([paragraph("Recommended focus", styles["SmallCaps"]), Spacer(1, 0.03 * inch), Paragraph(recommended_focus, styles["Body"])], fill=SURFACE_ALT, border=BORDER, left_accent=ACCENT, padding=10, width=CONTENT_W * 0.46 - 8),
        ]],
        colWidths=[CONTENT_W * 0.22 - 8, CONTENT_W * 0.32 - 8, CONTENT_W * 0.46 - 8],
    )
    fact_boxes.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    trust = clean(assumptions_summary.trust_level).lower()
    confidence_fill = colors.HexColor("#FFF8EC") if trust in ("low", "assumption-sensitive") else (ACCENT_SOFT if trust == "medium" else colors.HexColor("#EDF6F3"))
    confidence_accent = CAUTION if trust in ("low", "assumption-sensitive") else (ACCENT if trust == "medium" else SUCCESS)
    stakes_band_text: str | None = None
    if throughput.estimated_gain_percent and throughput.estimated_gain_percent > 0:
        stakes_band_text = f"Fixing the active constraint could recover ~{round(throughput.estimated_gain_percent * 100)}% of current capacity \u2014 without adding headcount or capital."
    return [
        CoverBand(operation_name, generated, stakes_text=stakes_band_text),
        Spacer(1, 0.20 * inch),
        tinted_box([Paragraph(clean(diagnosis.get("statusSummary", "The current modeled system is under review.")), styles["Lead"])], fill=SURFACE, border=BORDER, left_accent=ACCENT),
        Spacer(1, 0.20 * inch),
        fact_boxes,
        Spacer(1, 0.16 * inch),
        tinted_box([Paragraph(confidence_label(assumptions_summary.trust_level), styles["BodyStrong"])], fill=confidence_fill, border=BORDER, left_accent=confidence_accent, padding=8),
    ]


def build_executive_summary_page(diagnosis: dict[str, Any], throughput: ThroughputSummary, styles: dict[str, ParagraphStyle]) -> list[Any]:
    takeaway = clean(diagnosis.get("recommendedAction", "Stabilize the active bottleneck before expanding the rest of the line."))
    decision_boxes = Table(
        [[
            tinted_box([paragraph("Main constraint", styles["SmallCaps"]), Spacer(1, 0.03 * inch), Paragraph(clean(diagnosis.get("primaryConstraint", "")), styles["Body"])], fill=SURFACE_ALT, border=BORDER, left_accent=ACCENT, padding=10, width=CONTENT_W / 3 - 8),
            tinted_box([paragraph("Recommended focus", styles["SmallCaps"]), Spacer(1, 0.03 * inch), Paragraph(takeaway, styles["Body"])], fill=SURFACE_ALT, border=BORDER, left_accent=ACCENT, padding=10, width=CONTENT_W / 3 - 8),
            tinted_box([paragraph("Business implication", styles["SmallCaps"]), Spacer(1, 0.03 * inch), Paragraph(clean(diagnosis.get("economicInterpretation", "")), styles["Body"])], fill=SURFACE_ALT, border=BORDER, left_accent=ACCENT, padding=10, width=CONTENT_W / 3 - 8),
        ]],
        colWidths=[CONTENT_W / 3 - 8, CONTENT_W / 3 - 8, CONTENT_W / 3 - 8],
    )
    decision_boxes.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    return [
        PageBreak(),
        *section_header("EXECUTIVE SUMMARY", "Executive Summary", takeaway, styles),
        kpi_strip([("Current throughput (units/hr)", fmt_num(throughput.current_throughput, 3)), ("Potential lift (units/hr)", fmt_num(throughput.estimated_gain_units, 3)), ("Gain percent", fmt_pct(throughput.estimated_gain_percent, 1))], styles, col_semantics=["neutral", "positive", "positive"]),
        Spacer(1, 0.12 * inch),
        decision_boxes,
        Spacer(1, 0.14 * inch),
        tinted_box([paragraph("Leadership implication", styles["SmallCaps"]), Spacer(1, 0.04 * inch), Paragraph("The risk is not only lost output. It is schedule instability, recovery burden, and mis-prioritized leadership attention if effort spreads beyond the active mechanism too early.", styles["Body"])], fill=SURFACE_ALT, border=BORDER, left_accent=ACCENT),
    ]


def build_system_diagnosis_page(diagnosis: dict[str, Any], metrics: dict[str, Any], flow_summary: "FlowBehaviorSummary", styles: dict[str, ParagraphStyle]) -> list[Any]:
    takeaway = clean(diagnosis.get("constraintMechanism", diagnosis.get("statusSummary", "The system is under strain.")))
    table = evidence_table(["Question", "Answer"], [["What is happening?", clean(diagnosis.get("statusSummary", ""))], ["Mechanism summary", clean(diagnosis.get("constraintMechanism", ""))], ["Why this matters", clean(diagnosis.get("downstreamEffects", ""))]], [1.55 * inch, CONTENT_W - 1.55 * inch], styles)
    constraint_steps = sorted([(step.step_name, num(step.bottleneck_index, 0.0)) for step in flow_summary.top_pressure_steps], key=lambda s: s[1], reverse=True)
    return [
        PageBreak(),
        *section_header("DIAGNOSTIC EVIDENCE", "System Diagnosis", takeaway, styles),
        kpi_strip([("Constraint pressure", fmt_pct(metrics.get("globalMetrics", {}).get("bottleneckIndex"), 0)), ("Total WIP (units)", fmt_num(metrics.get("globalMetrics", {}).get("totalWipQty"), 1)), ("Lead time (minutes)", fmt_num(metrics.get("globalMetrics", {}).get("totalLeadTimeMinutes"), 1))], styles, col_semantics=["alert", "caution", "caution"]),
        Spacer(1, 0.14 * inch),
        paragraph("Process pressure map", styles["SubSection"]),
        Spacer(1, 0.04 * inch),
        ConstraintMap(constraint_steps),
        Spacer(1, 0.18 * inch),
        table,
        Spacer(1, 0.12 * inch),
        tinted_box([paragraph("Decision implication", styles["SmallCaps"]), Spacer(1, 0.04 * inch), Paragraph("If the mechanism is right, broad line-wide fixes will dilute effort while the active bottleneck stays pinned. The practical move is to act narrowly, then watch whether the next limit shifts as expected.", styles["Body"])], fill=ACCENT_SOFT, border=ACCENT_MUTED, left_accent=ACCENT),
    ]


def build_flow_behavior_page(flow_summary: FlowBehaviorSummary, styles: dict[str, ParagraphStyle]) -> list[Any]:
    unstable_names = ", ".join(step.step_name for step in flow_summary.queue_instability_steps[:3]) or "the active path"
    takeaway = f"Instability is concentrating around {unstable_names}, which means the system is behaving like a constrained flow, not a balanced line."
    queue_rows = [[step.step_name, fmt_num(step.queue_depth, 1), fmt_pct(step.queue_risk), fmt_minutes(step.lead_time_minutes)] for step in flow_summary.top_queue_steps]
    def _pressure_color(bi: float) -> Any:
        if bi >= 0.85: return ALERT
        if bi >= 0.65: return CAUTION
        return SUCCESS
    pressure_max = max_known(step.bottleneck_index for step in flow_summary.top_pressure_steps)
    pressure_chart = RankedBarChart(
        items=[(step.step_name, num(step.bottleneck_index, 0.0), fmt_pct(step.bottleneck_index, 0)) for step in flow_summary.top_pressure_steps],
        max_value=pressure_max,
        width=CONTENT_W,
        accent=ACCENT,
        item_colors=[_pressure_color(num(step.bottleneck_index, 0.0)) for step in flow_summary.top_pressure_steps],
        threshold=min(0.85, pressure_max),
    )
    return [
        PageBreak(),
        *section_header("FLOW AND OPERATING BEHAVIOR", "Flow and Operating Behavior", takeaway, styles),
        KeepTogether([paragraph("Primary evidence", styles["SubSection"]), Spacer(1, 0.04 * inch), pressure_chart, Spacer(1, 0.06 * inch), Paragraph("\u2588 Red \u2265 85%  \u00b7  \u2588 Amber \u2265 65%  \u00b7  \u2588 Green = healthy  \u00b7  dashed line = danger zone threshold", styles["BodyMuted"]), Spacer(1, 0.04 * inch), Paragraph("Interpretation: the highest-pressure steps are operating with very little recovery margin, so queue growth and bottleneck migration should be treated as structural, not random.", styles["BodyMuted"])]),
        Spacer(1, 0.12 * inch),
        evidence_table(["Step", "Queue", "Queue risk", "Lead time"], queue_rows, [CONTENT_W * 0.36, CONTENT_W * 0.16, CONTENT_W * 0.18, CONTENT_W * 0.18], styles),
        Spacer(1, 0.12 * inch),
        tinted_box([paragraph("Implication", styles["SmallCaps"]), Spacer(1, 0.04 * inch), Paragraph("This is not a static value stream map problem. The modeled line is showing flow behavior: queueing, pinned capacity, and limited headroom at a small set of steps. That is why the next action should start with the operating mechanism, not with a general dashboard review.", styles["Body"])], fill=SURFACE_ALT, border=BORDER, left_accent=ACCENT),
    ]


def build_kaizen_page(kaizen_reports: list[CategoryReport], styles: dict[str, ParagraphStyle]) -> list[Any]:
    top_reports = kaizen_reports[:3]
    takeaway = f"The highest-priority improvements are concentrated in {', '.join(report.focus_step for report in top_reports[:2]) or 'the constrained path'}, so the first Kaizen effort should be tightly sequenced rather than broad."
    kaizen_max = max_known(report.priority_score for report in kaizen_reports)
    def _kaizen_color(score: float) -> Any:
        ratio = score / max(kaizen_max, 0.01)
        if ratio >= 0.85: return ACCENT
        if ratio >= 0.65: return ACCENT_MUTED
        return TEXT_DISABLED
    chart = RankedBarChart(
        items=[(report.label, report.priority_score, f"{report.priority_score:.1f}") for report in kaizen_reports],
        max_value=kaizen_max,
        width=CONTENT_W,
        accent=ACCENT,
        item_colors=[_kaizen_color(report.priority_score) for report in kaizen_reports],
    )
    rows = [[report.label, report.focus_step, fmt_minutes(report.queue_reduction_minutes), fmt_num(report.throughput_gain_units_per_hour, 2) + " /hr"] for report in top_reports]
    return [
        PageBreak(),
        *section_header("KAIZEN PRIORITIES", "Kaizen Priorities", takeaway, styles),
        paragraph("Priority ranking", styles["SubSection"]),
        Spacer(1, 0.04 * inch),
        chart,
        Spacer(1, 0.08 * inch),
        Paragraph("Interpretation: the ranked opportunities show where targeted improvement work is most likely to release output first. The score is not a generic importance rating; it is a leverage signal tied to the current bottleneck behavior.", styles["BodyMuted"]),
        Spacer(1, 0.12 * inch),
        evidence_table(["Priority", "Focus step", "Likely queue relief", "Potential output lift"], rows, [CONTENT_W * 0.22, CONTENT_W * 0.36, CONTENT_W * 0.20, CONTENT_W * 0.16], styles),
        Spacer(1, 0.12 * inch),
        tinted_box([paragraph("What should be done next", styles["SmallCaps"]), Spacer(1, 0.04 * inch), bullet_list([f"{report.label}: {report.targeted_fixes[0]}" for report in top_reports if report.targeted_fixes], styles["Bullet"])], fill=ACCENT_SOFT, border=ACCENT_MUTED, left_accent=ACCENT),
    ]


def build_throughput_page(throughput: ThroughputSummary, diagnosis: dict[str, Any], styles: dict[str, ParagraphStyle]) -> list[Any]:
    takeaway = f"{throughput.primary_bottleneck} is the current output limit. If it is relieved, the line can move from {fmt_num(throughput.current_throughput, 3)} to about {fmt_num(throughput.improved_throughput, 3)} units/hr before the next limit is reached."
    summary_rows = [["Primary bottleneck", throughput.primary_bottleneck], ["Next likely limit", throughput.next_bottleneck], ["Current throughput", fmt_num(throughput.current_throughput, 3) + " /hr"], ["Improved throughput", fmt_num(throughput.improved_throughput, 3) + " /hr"], ["Potential lift", fmt_num(throughput.estimated_gain_units, 3) + " /hr"], ["Potential lift %", fmt_pct(throughput.estimated_gain_percent, 1)]]
    economics_rows = [["Transfer price", fmt_currency(throughput.selling_price)], ["Material cost / unit", fmt_currency(throughput.material_cost_per_unit)], ["Labor cost / unit", fmt_currency(throughput.labor_cost_per_unit)], ["Equipment cost / unit", fmt_currency(throughput.equipment_cost_per_unit)], ["Throughput value / unit", fmt_currency(throughput.toc_throughput_per_unit)], ["Profit / unit", fmt_currency(throughput.fully_loaded_profit_per_unit)]]
    economics_missing = all(
        v is None for v in [throughput.selling_price, throughput.material_cost_per_unit,
                            throughput.labor_cost_per_unit, throughput.equipment_cost_per_unit]
    )
    if economics_missing:
        economics_block = tinted_box(
            [paragraph("Economic data required to complete this section", styles["SmallCaps"]),
             Spacer(1, 0.06 * inch),
             bullet_list(throughput.validations if throughput.validations else [
                 "Transfer price per unit is missing.",
                 "Step-level material costs are not set.",
                 "Labor and equipment rates have not been entered.",
             ], styles["Bullet"]),
             Spacer(1, 0.06 * inch),
             Paragraph("Enter these values via the parameter sidebar or master data CSV to unlock full economics.", styles["Body"])],
            fill=SURFACE_ALT, border=BORDER, left_accent=CAUTION,
        )
    else:
        economics_block = evidence_table(["Economics lens", "Readout"], economics_rows, [CONTENT_W * 0.40, CONTENT_W * 0.50], styles)
    return [
        PageBreak(),
        *section_header("THROUGHPUT AND ECONOMICS", "Throughput and Economics", takeaway, styles),
        kpi_strip([("Current output (units/hr)", fmt_num(throughput.current_throughput, 3)), ("Potential lift (units/hr)", fmt_num(throughput.estimated_gain_units, 3)), ("Next limit", throughput.next_bottleneck)], styles, col_semantics=["neutral", "positive", "neutral"]),
        Spacer(1, 0.12 * inch),
        *([ ThroughputBars(num(throughput.current_throughput, 0.0), num(throughput.improved_throughput, 0.0)),
            Paragraph("Current vs. potential throughput at bottleneck relief", styles["BodyMuted"]),
            Spacer(1, 0.14 * inch),
          ] if throughput.current_throughput and throughput.improved_throughput else []),
        evidence_table(["Metric", "Readout"], summary_rows, [CONTENT_W * 0.40, CONTENT_W * 0.50], styles),
        Spacer(1, 0.10 * inch),
        economics_block,
        Spacer(1, 0.12 * inch),
        tinted_box([paragraph("Economic impact", styles["SmallCaps"]), Spacer(1, 0.04 * inch), Paragraph(clean(diagnosis.get("economicInterpretation", "The main business implication is hidden capacity loss at the active bottleneck.")), styles["Body"]), Spacer(1, 0.06 * inch), paragraph("Leadership implication", styles["SmallCaps"]), Spacer(1, 0.03 * inch), Paragraph(" ".join(throughput.validations) if throughput.validations else "Economics inputs are complete enough for directional discussion.", styles["Body"])], fill=SURFACE_ALT, border=BORDER, left_accent=CAUTION if throughput.validations else ACCENT),
    ]


def build_waste_page(waste_summary: WasteSummary, styles: dict[str, ParagraphStyle]) -> list[Any]:
    takeaway = f"Delay is materially larger than touch time in the current path, and {waste_summary.top_delay_step} is the clearest place to separate structural waiting from hands-on work."
    rows = [[step.step_name, fmt_minutes(step.touch_time_minutes), fmt_minutes(step.elapsed_time_minutes), fmt_minutes(step.delay_minutes), fmt_pct(step.delay_pct, 1)] for step in waste_summary.steps[:5]]
    return [
        PageBreak(),
        *section_header("WASTE ANALYSIS", "Waste Analysis", takeaway, styles),
        kpi_strip([("Elapsed time (min)", fmt_num(waste_summary.total_elapsed_minutes, 1)), ("Touch time (min)", fmt_num(waste_summary.total_touch_minutes, 1)), ("Delay share", fmt_pct(waste_summary.delay_share, 1)), ("Value-add ratio", fmt_pct(waste_summary.value_add_ratio, 1))], styles, col_semantics=["alert", "neutral", "alert", "caution"]),
        Spacer(1, 0.12 * inch),
        evidence_table(["Step", "Touch", "Elapsed", "Delay", "Delay %"], rows, [CONTENT_W * 0.34, CONTENT_W * 0.14, CONTENT_W * 0.16, CONTENT_W * 0.14, CONTENT_W * 0.14], styles),
        Spacer(1, 0.12 * inch),
        tinted_box([paragraph("Why this matters", styles["SmallCaps"]), Spacer(1, 0.04 * inch), Paragraph("This section separates work content from waiting. It highlights where elapsed time is being consumed by queue, hold, or release friction instead of hands-on activity.", styles["Body"]), Spacer(1, 0.06 * inch), paragraph("Recommended next move", styles["SmallCaps"]), Spacer(1, 0.03 * inch), Paragraph(" ".join(waste_summary.warnings[:2]) if waste_summary.warnings else f"Use {waste_summary.top_delay_step} to anchor the first waste-reduction discussion and validate whether the measured waiting is structural or caused by release behavior.", styles["Body"])], fill=ACCENT_SOFT, border=ACCENT_MUTED, left_accent=CAUTION if waste_summary.warnings else ACCENT),
    ]


def build_assumptions_page(assumptions_summary: AssumptionsSummary, styles: dict[str, ParagraphStyle]) -> list[Any]:
    takeaway = assumptions_summary.headline
    rows = [[item.category, item.title, item.recommended_check] for item in assumptions_summary.items[:4]]
    if not rows:
        rows = [["Model notes", "No assumptions were recorded.", "No additional validation notes were available."]]
    return [
        PageBreak(),
        *section_header("ASSUMPTIONS AND MODEL NOTES", "Assumptions and Model Notes", takeaway, styles),
        kpi_strip([("Confidence", confidence_label(assumptions_summary.trust_level).replace("Confidence: ", "")), ("Assumptions", str(assumptions_summary.counts["total"])), ("Warnings", str(assumptions_summary.counts["warning"])), ("Blockers", str(assumptions_summary.counts["blocker"]))], styles),
        Spacer(1, 0.12 * inch),
        tinted_box([paragraph("Confidence context", styles["SmallCaps"]), Spacer(1, 0.04 * inch), Paragraph(assumptions_summary.summary, styles["Body"]), Spacer(1, 0.06 * inch), paragraph("Use with confidence for", styles["SmallCaps"]), Spacer(1, 0.03 * inch), bullet_list(assumptions_summary.safe_to_use_for[:2], styles["Bullet"])], fill=SURFACE_ALT, border=BORDER, left_accent=ACCENT),
        Spacer(1, 0.12 * inch),
        evidence_table(["Category", "Key note", "Validate next"], rows, [CONTENT_W * 0.22, CONTENT_W * 0.34, CONTENT_W * 0.36], styles),
    ]


def build_recommended_actions_page(actions: list[dict[str, str]], styles: dict[str, ParagraphStyle]) -> list[Any]:
    takeaway = "The next move should be a sequenced set of actions: stabilize the active constraint, confirm the mechanism with a short validation loop, then protect the next likely limit."
    headers = ["Priority action", "Why now", "Expected effect", "When"]
    col_widths = [CONTENT_W * 0.22, CONTENT_W * 0.36, CONTENT_W * 0.24, CONTENT_W * 0.12]
    body = [[paragraph(h, styles["MetricLabel"]) for h in headers]]
    for action in actions[:3]:
        body.append([paragraph(action["title"], styles["Body"]), paragraph(action["why"], styles["Body"]), paragraph(action["effect"], styles["Body"]), paragraph(action["when"], styles["BodyStrong"])])
    actions_tbl = Table(body, colWidths=col_widths, repeatRows=1)
    actions_tbl.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), SURFACE_ALT), ("TEXTCOLOR", (0, 0), (-1, -1), TEXT), ("BOX", (0, 0), (-1, -1), 0.8, BORDER), ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [SURFACE, SURFACE_ALT]), ("BACKGROUND", (3, 1), (3, -1), ACCENT_SOFT), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    return [
        PageBreak(),
        *section_header("RECOMMENDED ACTIONS", "Recommended Actions", takeaway, styles),
        actions_tbl,
        Spacer(1, 0.12 * inch),
        tinted_box([paragraph("Recommended next move", styles["SmallCaps"]), Spacer(1, 0.04 * inch), Paragraph("Contain the current bottleneck first. Once that mechanism is confirmed or relieved, check whether the next limit migrates as expected before widening the scope of investment or changing staffing more broadly.", styles["Body"])], fill=ACCENT_SOFT, border=ACCENT_MUTED, left_accent=ACCENT),
    ]


def build_appendix_pages(metrics: dict[str, Any], flow_summary: FlowBehaviorSummary, waste_summary: WasteSummary, assumptions_summary: AssumptionsSummary, actions: list[dict[str, str]], styles: dict[str, ParagraphStyle]) -> list[Any]:
    pages: list[Any] = [PageBreak(), paragraph("APPENDIX A — CORE METRICS", styles["Eyebrow"]), Spacer(1, 0.04 * inch), Paragraph("Core Metrics", styles["Section"]), Spacer(1, 0.06 * inch)]
    metric_rows = [[clean(key), clean(value if not isinstance(value, float) else fmt_num(value, 3))] for key, value in metrics.get("globalMetrics", {}).items()]
    pages.append(appendix_table(["Metric", "Value"], metric_rows, [CONTENT_W * 0.46, CONTENT_W * 0.46], styles))
    step_rows = [[step.step_name, fmt_pct(step.utilization), fmt_num(step.queue_depth, 1), fmt_minutes(step.lead_time_minutes), fmt_pct(step.bottleneck_index, 0)] for step in flow_summary.top_pressure_steps]
    if step_rows:
        pages.extend([Spacer(1, 0.12 * inch), paragraph("Highest-pressure steps", styles["SubSection"]), Spacer(1, 0.03 * inch), appendix_table(["Step", "Utilization", "Queue", "Lead time", "Pressure"], step_rows[:6], [CONTENT_W * 0.30, CONTENT_W * 0.15, CONTENT_W * 0.14, CONTENT_W * 0.19, CONTENT_W * 0.14], styles)])
    if len(actions) > 3:
        pages.extend([Spacer(1, 0.12 * inch), paragraph("Secondary actions", styles["SubSection"]), Spacer(1, 0.03 * inch), appendix_table(["Action", "Why now", "Expected effect", "When"], [[action["title"], action["why"], action["effect"], action["when"]] for action in actions[3:]], [CONTENT_W * 0.22, CONTENT_W * 0.36, CONTENT_W * 0.24, CONTENT_W * 0.10], styles)])
    for chunk_index, waste_chunk in enumerate(chunked(waste_summary.steps[:10], 5), start=1):
        pages.extend([PageBreak(), paragraph(f"APPENDIX B{'' if chunk_index == 1 else f'-{chunk_index}'} — DETAILED DELAY TABLE", styles["Eyebrow"]), Spacer(1, 0.04 * inch), Paragraph(f"Detailed Delay Table {chunk_index}", styles["Section"]), Spacer(1, 0.05 * inch), appendix_table(["Step", "Touch", "Elapsed", "Delay", "Delay %"], [[step.step_name, fmt_minutes(step.touch_time_minutes), fmt_minutes(step.elapsed_time_minutes), fmt_minutes(step.delay_minutes), fmt_pct(step.delay_pct, 1)] for step in waste_chunk], [CONTENT_W * 0.34, CONTENT_W * 0.14, CONTENT_W * 0.16, CONTENT_W * 0.14, CONTENT_W * 0.14], styles)])
    if assumptions_summary.items:
        for chunk_index, assumption_chunk in enumerate(chunked(assumptions_summary.items, 4), start=1):
            pages.extend([PageBreak(), paragraph(f"APPENDIX C{'' if chunk_index == 1 else f'-{chunk_index}'} — ASSUMPTIONS LOG", styles["Eyebrow"]), Spacer(1, 0.04 * inch), Paragraph(f"Assumptions Log {chunk_index}", styles["Section"]), Spacer(1, 0.05 * inch), appendix_table(["Severity", "Assumption", "Why it matters"], [[item.severity.title(), item.plain_language, item.why_it_matters] for item in assumption_chunk], [CONTENT_W * 0.12, CONTENT_W * 0.40, CONTENT_W * 0.40], styles)])
    return pages


def build_report_spec(model: dict[str, Any], diagnosis: dict[str, Any], flow_summary: FlowBehaviorSummary, kaizen_reports: list[CategoryReport], throughput: ThroughputSummary, waste_summary: WasteSummary, assumptions_summary: AssumptionsSummary, actions: list[dict[str, str]]) -> dict[str, Any]:
    return {"title": "LeanStorming Executive Report", "operation_name": clean(model.get("metadata", {}).get("name") or "Current Operation"), "generated_at": datetime.now().isoformat(), "subtitle": "Simulation-backed operational diagnosis", "sections": [{"title": "Executive Summary", "takeaway": clean(diagnosis.get("recommendedAction", ""))}, {"title": "System Diagnosis", "takeaway": clean(diagnosis.get("constraintMechanism", ""))}, {"title": "Flow and Operating Behavior", "top_queue_steps": [step.step_name for step in flow_summary.top_queue_steps]}, {"title": "Kaizen Priorities", "focus_steps": [report.focus_step for report in kaizen_reports[:3]]}, {"title": "Throughput and Economics", "primary_bottleneck": throughput.primary_bottleneck}, {"title": "Waste Analysis", "top_delay_step": waste_summary.top_delay_step}, {"title": "Assumptions and Model Notes", "trust_level": assumptions_summary.trust_level}, {"title": "Recommended Actions", "actions": actions}]}


def render_preview(pdf_path: Path, preview_dir: Path, max_pages: int = 4) -> None:
    preview_dir.mkdir(parents=True, exist_ok=True)
    with fitz.open(pdf_path.as_posix()) as doc:
        for page_index in range(min(max_pages, doc.page_count)):
            pix = doc[page_index].get_pixmap(matrix=fitz.Matrix(1.65, 1.65), alpha=False)
            pix.save((preview_dir / f"{pdf_path.stem}-page-{page_index + 1}.png").as_posix())


def build_story() -> tuple[list[Any], dict[str, Any]]:
    compiled = read_json(ACTIVE / "compiled_forecast_model.json")
    scenario = read_json(ACTIVE / "scenario_committed.json")
    metrics = read_json(ACTIVE / "result_metrics.json")
    diagnosis = read_json(ACTIVE / "operational_diagnosis.json")
    master_data_path = ACTIVE / "master_data.json"
    master_data = read_json(master_data_path) if master_data_path.exists() else {}
    styles = make_styles()
    facts = build_step_facts(compiled, scenario, metrics)
    flow_summary = build_flow_behavior(facts)
    kaizen_reports = build_category_reports(compiled, scenario, metrics, diagnosis)
    throughput = build_throughput_summary(compiled, master_data, scenario, metrics)
    waste_summary = build_waste_summary(facts)
    assumptions_summary = build_assumptions_summary(compiled)
    actions = build_recommended_actions(diagnosis, kaizen_reports, waste_summary, assumptions_summary, flow_summary)
    spec = build_report_spec(compiled, diagnosis, flow_summary, kaizen_reports, throughput, waste_summary, assumptions_summary, actions)
    story: list[Any] = []
    story.extend(build_cover_page(compiled, diagnosis, facts, assumptions_summary, throughput, styles))
    story.extend(build_executive_summary_page(diagnosis, throughput, styles))
    story.extend(build_system_diagnosis_page(diagnosis, metrics, flow_summary, styles))
    story.extend(build_flow_behavior_page(flow_summary, styles))
    story.extend(build_kaizen_page(kaizen_reports, styles))
    story.extend(build_throughput_page(throughput, diagnosis, styles))
    story.extend(build_waste_page(waste_summary, styles))
    story.extend(build_assumptions_page(assumptions_summary, styles))
    story.extend(build_recommended_actions_page(actions, styles))
    story.extend(build_appendix_pages(metrics, flow_summary, waste_summary, assumptions_summary, actions, styles))
    return story, spec


def build_pdf(output_path: Path, spec_path: Path | None = None, preview_dir: Path | None = None) -> Path:
    story, spec = build_story()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    operation_name = clean(spec.get("operation_name", "LeanStorming"))
    decorator = make_page_decorator(operation_name)
    doc = SimpleDocTemplate(output_path.as_posix(), pagesize=LETTER, leftMargin=MARGIN, rightMargin=MARGIN, topMargin=0.72 * inch, bottomMargin=0.62 * inch, title="LeanStorming Executive Report", author="LeanStorming")
    doc.build(story, onFirstPage=decorator, onLaterPages=decorator)
    if spec_path is not None:
        spec_path.parent.mkdir(parents=True, exist_ok=True)
        spec_path.write_text(f"{json.dumps(spec, indent=2)}\n", encoding="utf-8")
    if preview_dir is not None:
        render_preview(output_path, preview_dir)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    shutil.copy2(output_path, PUBLIC / output_path.name)
    return output_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate the LeanStorming executive PDF report.")
    parser.add_argument("--output", default=str(OUTPUT / "leanstorming-executive-report.pdf"))
    parser.add_argument("--spec-output", default=str(OUTPUT / "leanstorming-executive-report.json"))
    parser.add_argument("--preview-dir", default=str(ROOT / "tmp" / "pdfs"))
    args = parser.parse_args()
    output_path = Path(args.output).resolve()
    spec_path = Path(args.spec_output).resolve() if args.spec_output else None
    preview_dir = Path(args.preview_dir).resolve() if args.preview_dir else None
    path = build_pdf(output_path, spec_path=spec_path, preview_dir=preview_dir)
    print(f"Executive PDF exported to {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
