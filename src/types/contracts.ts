export type FieldType = "slider" | "number" | "dropdown";

export interface SelectOption {
  label: string;
  value: string;
}

export interface VsmNode {
  id: string;
  label: string;
  type: string;
}

export interface VsmEdge {
  from: string;
  to: string;
  probability?: number;
}

export interface VsmGraph {
  nodes: VsmNode[];
  edges: VsmEdge[];
  startNodes: string[];
  endNodes: string[];
}

export interface ProductRow {
  productId: string;
  family: string;
  mixPct?: number;
  demandRate?: number;
  sellingPricePerUnit?: number | null;
}

export interface EquipmentRow {
  equipmentType: string;
  count: number;
  availability?:
    | number
    | {
        shiftHours?: number | null;
        uptimePct?: number | null;
      }
    | null;
}

export interface DistributionConfig {
  type: string;
  params: Record<string, number>;
}

export interface SetupRuleConfig {
  type: string;
  by?: string;
}

export interface ProcessingRow {
  stepId: string;
  equipmentType: string;
  productKey: string;
  ct_dist?: DistributionConfig;
  ct?: {
    dist: string;
    params: Record<string, number | string | null>;
  } | null;
  setup_rule?: SetupRuleConfig;
  setup_dist?: DistributionConfig;
  changeover?: {
    rule?: string | null;
    time?: {
      dist: string;
      params: Record<string, number | string | null>;
    } | null;
  } | null;
  leadTimeMinutes?: number | null;
  leadTimeRaw?: string | null;
  parallelProcedures?: number | null;
  materialCostPerUnit?: number | null;
  laborRatePerHour?: number | null;
  equipmentRatePerHour?: number | null;
}

export interface VariabilityRow {
  stepId: string;
  cv?: number;
  notes?: string;
}

export interface MasterData {
  products: ProductRow[];
  equipment: EquipmentRow[];
  processing: ProcessingRow[];
  ctVariability?: VariabilityRow[];
  economicsDefaults?: {
    sellingPricePerUnit?: number | null;
  };
}

export interface ParameterField {
  key: string;
  label: string;
  helpText?: string;
  type: FieldType;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: Array<string | SelectOption>;
  defaultValue: number | string;
}

export interface ParameterGroup {
  groupId: string;
  label: string;
  fields: ParameterField[];
}

export interface KpiConfig {
  key: string;
  label: string;
  helpText?: string;
  format?: "number" | "percent" | "duration" | "delta" | "text" | "currency";
  decimals?: number;
}

export type OperationalSystemStatus = "stable" | "stressed" | "brittle" | "overloaded";

export interface OperationalDiagnosis {
  status: OperationalSystemStatus;
  statusSummary: string;
  primaryConstraint: string;
  constraintMechanism: string;
  downstreamEffects: string;
  economicInterpretation: string;
  recommendedAction: string;
  scenarioGuidance: string;
  aiOpportunityLens: {
    dataAlreadyExists: string;
    manualPatternDecisions: string;
    predictiveGap: string;
    tribalKnowledge: string;
    visibilityGap: string;
  };
  confidence: "high" | "medium" | "low";
  confidenceNote: string;
}

export interface DashboardConfig {
  appTitle: string;
  subtitle?: string;
  parameterGroups: ParameterGroup[];
  kpis: KpiConfig[];
  nodeCardFields: string[];
  graphStyle?: {
    edgeAnimation?: "flow" | "none";
    showProbabilities?: boolean;
  };
}

export type SimulatorResultsMode = "flow" | "diagnosis" | "kaizen" | "throughput" | "waste" | "assumptions";

export interface ChecklistItem {
  severity: "warning" | "critical";
  code: string;
  message: string;
}

export interface CompiledSimSpec {
  version: string;
  generatedAt: string;
  graph: VsmGraph;
  masterData: MasterData;
  scenarioDefaults: Record<string, number | string>;
  validationSummary: {
    missingItemCount: number;
    hasCritical: boolean;
  };
}

export type ForecastInputType = "number" | "select";

export interface ForecastInputDefinition {
  key: string;
  label: string;
  type: ForecastInputType;
  defaultValue: number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<string | SelectOption>;
}

export interface ForecastStepBaseline {
  demandRatePerHour: number;
  utilization: number | null;
  headroom: number | null;
  queueRisk: number | null;
  bottleneckIndex: number | null;
  status: "healthy" | "risk" | "critical" | "unknown";
}

export interface ForecastStepModel {
  stepId: string;
  label: string;
  equipmentType: string | null;
  workerCount: number;
  parallelProcedures: number;
  effectiveUnits: number;
  ctMinutes: number | null;
  changeoverMinutes: number | null;
  changeoverPenaltyPerUnitMinutes: number | null;
  leadTimeMinutes: number | null;
  variabilityCv: number;
  effectiveCtMinutes: number | null;
  effectiveCapacityPerHour: number | null;
  baseline: ForecastStepBaseline;
}

export interface CompiledForecastModel {
  version: string;
  generatedAt: string;
  metadata: {
    name: string;
    units: string;
    mode: string;
  };
  graph: VsmGraph;
  inputs: ForecastInputDefinition[];
  inputDefaults: Record<string, number | string>;
  stepModels: ForecastStepModel[];
  baseline: {
    demandRatePerHour: number;
    lineCapacityPerHour: number;
    bottleneckStepId: string | null;
    globalMetrics: Record<string, number | string>;
    nodeMetrics: Record<
      string,
      {
        utilization: number | null;
        headroom: number | null;
        queueRisk: number | null;
        queueDepth?: number | null;
        wipQty?: number | null;
        completedQty?: number | null;
        idleWaitHours?: number | null;
        idleWaitPct?: number | null;
        leadTimeMinutes?: number | null;
        capacityPerHour?: number | null;
        bottleneckIndex: number | null;
        bottleneckFlag: boolean;
        status: "healthy" | "risk" | "critical" | "unknown";
      }
    >;
  };
  assumptions: Array<{
    id: string;
    severity: "info" | "warning" | "blocker";
    text: string;
  }>;
}

export interface SimulationOutput {
  globalMetrics: Record<string, number | string>;
  nodeMetrics: Record<
    string,
    {
      utilization: number | null;
      headroom: number | null;
      queueRisk: number | null;
      queueDepth?: number | null;
      wipQty?: number | null;
      completedQty?: number | null;
      idleWaitHours?: number | null;
      idleWaitPct?: number | null;
      leadTimeMinutes?: number | null;
      capacityPerHour?: number | null;
      bottleneckIndex: number | null;
      bottleneckFlag: boolean;
      status: "healthy" | "risk" | "critical" | "unknown";
    }
  >;
}

export type ThroughputEfficiencyStatus = "high" | "medium" | "low";

export interface ThroughputAnalysisValidation {
  code: string;
  severity: "error" | "warning";
  message: string;
  stepId?: string;
  metricKey?: string;
}

export interface ThroughputSummaryMetrics {
  sellingPrice: number | null;
  materialCostPerUnit: number | null;
  laborCostPerUnit: number | null;
  equipmentCostPerUnit: number | null;
  tocThroughputPerUnit: number | null;
  fullyLoadedProfitPerUnit: number | null;
  primaryBottleneck: string;
  bottleneckTimePerUnit: number | null;
  tocThroughputPerBottleneckMinute: number | null;
  nextBottleneck: string;
  estimatedGainUnits: number | null;
  estimatedGainDollars: number | null;
  estimatedGainPercent: number | null;
  currentThroughput: number | null;
  improvedThroughput: number | null;
  efficiencyStatus: ThroughputEfficiencyStatus;
}

export interface ThroughputSummaryRow {
  key: string;
  label: string;
  value: number | string | null;
  format?: "number" | "percent" | "currency" | "text" | "duration";
  decimals?: number;
}

export interface ThroughputStepCostRow {
  stepId: string;
  stepName: string;
  materialCost: number | null;
  laborRatePerHour: number | null;
  equipmentRatePerHour: number | null;
  laborCostPerUnit: number | null;
  equipmentCostPerUnit: number | null;
  totalStepCost: number | null;
  hasMissingCosts: boolean;
}

export interface ThroughputInsight {
  finding: string;
  impactEstimate: string;
  recommendedAction: string;
}

export interface ThroughputProfitLossRow {
  key: string;
  label: string;
  total: number | null;
}

export interface ThroughputAnalysisResult {
  scenarioLabel: string;
  productFamilyLabel: string | null;
  efficiencyStatus: ThroughputEfficiencyStatus;
  efficiencyLabel: "High" | "Medium" | "Low";
  validations: ThroughputAnalysisValidation[];
  hasBlockingErrors: boolean;
  summary: ThroughputSummaryMetrics;
  summaryRows: ThroughputSummaryRow[];
  stepRows: ThroughputStepCostRow[];
  profitLossRows: ThroughputProfitLossRow[];
  insights: ThroughputInsight[];
}

export interface WasteAnalysisValidation {
  code: string;
  severity: "error" | "warning";
  message: string;
  stepId?: string;
  metricKey?: string;
}

export interface WasteSummaryMetrics {
  totalLeadTimeMinutes: number | null;
  totalTouchTimeMinutes: number | null;
  totalWasteMinutes: number | null;
  totalWastePct: number | null;
  valueAddRatio: number | null;
  topWasteStep: string;
  fallbackCount: number;
  warningCount: number;
}

export interface WasteSummaryRow {
  key: string;
  label: string;
  value: number | string | null;
  format?: "number" | "percent" | "currency" | "text" | "duration";
  decimals?: number;
}

export interface WasteStepRow {
  stepId: string;
  stepName: string;
  comparisonCtMinutes: number | null;
  comparisonLtMinutes: number | null;
  wasteMinutes: number | null;
  wastePct: number | null;
  valueAddPct: number | null;
  routeWeight: number;
  weightedWasteMinutes: number | null;
  weightedLtMinutes: number | null;
  weightedCtMinutes: number | null;
  usedCtFallback: boolean;
  usedLtFallback: boolean;
  missingBoth: boolean;
  ltBelowCt: boolean;
}

export interface WasteInsight {
  finding: string;
  impactEstimate: string;
  recommendedAction: string;
}

export interface WasteAnalysisResult {
  scenarioLabel: string;
  validations: WasteAnalysisValidation[];
  hasBlockingErrors: boolean;
  summary: WasteSummaryMetrics;
  summaryRows: WasteSummaryRow[];
  stepRows: WasteStepRow[];
  insights: WasteInsight[];
}

export type KaizenFishboneCategoryKey =
  | "manpower"
  | "machine"
  | "method"
  | "material"
  | "measurement";

export interface KaizenOpportunityEvidence {
  utilization: number | null;
  queueRisk: number | null;
  bottleneckIndex: number | null;
  leadTimeMinutes: number | null;
  wipQty: number | null;
  downtimePct: number | null;
  variabilityCv: number | null;
}

export interface KaizenOpportunity {
  rank: number;
  fishboneCategory: KaizenFishboneCategoryKey;
  stepId: string | null;
  stepName: string;
  title: string;
  score: number;
  rationale: string;
  likelyRootCause: string;
  expectedImpact: string;
  recommendedEvent: string;
  confidence: "high" | "medium" | "low";
  evidence: KaizenOpportunityEvidence;
}

export interface KaizenFishboneCategory {
  key: KaizenFishboneCategoryKey;
  label: string;
  focusStep: string;
  priorityScore: number;
  observedCondition: string;
  failureModes: string[];
  causeEffectChain: string;
  auditChecks: Array<{
    check: string;
    source: string;
    successSignal: string;
  }>;
  targetedFixes: string[];
  expectedImpact: {
    queueReductionMinutes: number | null;
    leadTimeReductionMinutes: number | null;
    throughputGainUnitsPerHour: number | null;
    stabilityEffect: string;
  };
  confidence: "high" | "medium" | "low";
  metrics: {
    utilization: number | null;
    queueRisk: number | null;
    queueDelayMinutes: number | null;
    leadTimeMinutes: number | null;
    wipQty: number | null;
    downtimePct: number | null;
    variabilityCv: number | null;
    changeoverPenaltyMinutes: number | null;
    workerCount: number;
    effectiveUnits: number | null;
    bottleneckIndex: number | null;
  };
}

export interface KaizenKpiSummary {
  topOpportunity: string;
  topOpportunityScore: number;
  opportunityCount: number;
  fishboneFocus: string;
  missingSignalsCount: number;
}

export interface KaizenReportResult {
  scenarioLabel: string;
  primaryConstraint: string;
  headline: string;
  practitionerSummary: string;
  selectionBasis: string;
  confidence: "high" | "medium" | "low";
  topOpportunities: KaizenOpportunity[];
  fishboneCategories: KaizenFishboneCategory[];
  missingSignals: string[];
  kpiSummary: KaizenKpiSummary;
}

export interface AssumptionsReportItem {
  id: string;
  severity: "info" | "warning" | "blocker";
  category: string;
  title: string;
  plainLanguage: string;
  whyItMatters: string;
  recommendedCheck: string;
}

export interface AssumptionsReportResult {
  scenarioLabel: string;
  trustLevel: "high" | "medium" | "low";
  headline: string;
  summary: string;
  safeToUseFor: string[];
  useCautionFor: string[];
  priorityChecks: string[];
  items: AssumptionsReportItem[];
  counts: {
    total: number;
    info: number;
    warning: number;
    blocker: number;
  };
}

export interface ScenarioLibraryEntry {
  scenarioId: string;
  scenarioName: string;
  savedAt: string;
  scenario: Record<string, number | string>;
}

export interface ScenarioLibraryFileContext {
  schemaVersion: string;
  appTitle: string;
  modelName: string;
}

export interface ScenarioLibraryIssue {
  severity: "error" | "warning";
  message: string;
  rowNumber?: number;
  column?: string;
}

export interface ScenarioLibraryParseResult {
  entries: ScenarioLibraryEntry[];
  issues: ScenarioLibraryIssue[];
  discoveredColumns: string[];
  context: ScenarioLibraryFileContext | null;
}
