function num(input, fallback) {
    if (typeof input === "number" && Number.isFinite(input)) {
        return input;
    }
    if (typeof input === "string" && input.trim().length > 0) {
        const parsed = Number(input);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return fallback;
}
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function readShiftConfig(scenario) {
    const activeShiftCount = clamp(Math.round(num(scenario.activeShiftCount, 3)), 1, 3);
    const defaultShiftDuration = activeShiftCount * 8;
    const shiftDurationHours = clamp(num(scenario.shiftDurationHours, defaultShiftDuration), 1, 24);
    const shiftStartHour = clamp(num(scenario.shiftStartHour, 0), 0, 23.99);
    return {
        activeShiftCount,
        shiftDurationHours,
        shiftStartHour,
        activeHoursPerDay: shiftDurationHours
    };
}
function activeHoursBetween(startHour, endHour, shiftDurationHours, shiftStartHour) {
    if (endHour <= startHour || shiftDurationHours <= 0) {
        return 0;
    }
    if (shiftDurationHours >= 24) {
        return endHour - startHour;
    }
    let cursor = startHour;
    let activeHours = 0;
    while (cursor < endHour - 1e-9) {
        const dayIndex = Math.floor(cursor / 24);
        const dayStart = dayIndex * 24;
        const nextBoundary = Math.min(endHour, dayStart + 24);
        const shiftStart = dayStart + shiftStartHour;
        const shiftEnd = shiftStart + shiftDurationHours;
        const overlap = (windowStart, windowEnd) => Math.max(0, Math.min(nextBoundary, windowEnd) - Math.max(cursor, windowStart));
        activeHours += overlap(shiftStart, Math.min(shiftEnd, dayStart + 24));
        if (shiftEnd > dayStart + 24) {
            activeHours += overlap(dayStart, dayStart + (shiftEnd - (dayStart + 24)));
        }
        cursor = nextBoundary;
    }
    return activeHours;
}
function normalizeOutgoing(edges) {
    if (edges.length === 0) {
        return [];
    }
    const explicitTotal = edges.reduce((sum, edge) => sum + (typeof edge.probability === "number" ? edge.probability : 0), 0);
    const missingCount = edges.filter((edge) => typeof edge.probability !== "number").length;
    const remaining = Math.max(0, 1 - explicitTotal);
    const implied = missingCount > 0 ? (remaining > 0 ? remaining / missingCount : 1 / edges.length) : 0;
    const provisional = edges.map((edge) => ({
        to: edge.to,
        probability: typeof edge.probability === "number" ? num(edge.probability, 0) : implied
    }));
    const total = provisional.reduce((sum, edge) => sum + edge.probability, 0);
    if (total <= 0) {
        const uniform = 1 / edges.length;
        return edges.map((edge) => ({ to: edge.to, probability: uniform }));
    }
    return provisional.map((edge) => ({ to: edge.to, probability: edge.probability / total }));
}
function rawMixModifier(index, total, mixProfile) {
    if (mixProfile === "front-loaded") {
        return index < Math.ceil(total / 3) ? 1.12 : 0.94;
    }
    if (mixProfile === "midstream-heavy") {
        const start = Math.floor(total / 3);
        const end = Math.ceil((total * 2) / 3);
        return index >= start && index < end ? 1.12 : 0.94;
    }
    if (mixProfile === "back-loaded") {
        return index >= Math.floor((total * 2) / 3) ? 1.12 : 0.94;
    }
    return 1;
}
function buildMixModifiers(total, mixProfile) {
    if (total <= 0) {
        return [];
    }
    const raw = Array.from({ length: total }, (_, index) => rawMixModifier(index, total, mixProfile));
    const sum = raw.reduce((acc, value) => acc + value, 0);
    if (sum <= 0) {
        return raw.map(() => 1);
    }
    const normalization = total / sum;
    return raw.map((value) => value * normalization);
}
function stepStatus(utilization, bottleneckIndex) {
    if (utilization >= 0.98 || bottleneckIndex >= 0.82) {
        return "critical";
    }
    if (utilization >= 0.85 || bottleneckIndex >= 0.62) {
        return "risk";
    }
    return "healthy";
}
// Equivalent single-server wait-probability approximation.
// Under M/G/1-style single-server semantics, P(wait) = rho when rho < 1.
// We keep queueRisk as that arrival-waits approximation, not a queue-occupancy ratio.
function queueRiskFromUtilization(utilizationRaw) {
    return clamp(utilizationRaw, 0, 1);
}
function bottleneckIndexFrom(utilization, queueRisk) {
    return clamp(0.65 * clamp(utilization, 0, 1.35) + 0.35 * clamp(queueRisk, 0, 1), 0, 1);
}
function littleLawResidualPct(throughputPerHour, leadTimeMinutes, wipQty) {
    const expectedWipQty = Math.max(0, throughputPerHour) * Math.max(0, leadTimeMinutes) / 60;
    return Math.abs(Math.max(0, wipQty) - expectedWipQty) / Math.max(1e-9, expectedWipQty);
}
function littleLawReferenceWipQty(throughputPerHour, leadTimeMinutes) {
    return Math.max(0, throughputPerHour) * Math.max(0, leadTimeMinutes) / 60;
}
function analyzeGraph(graph) {
    const nodeIds = graph.nodes.map((node) => node.id);
    const outgoingRaw = new Map();
    const outgoingMap = new Map();
    const indegree = new Map();
    for (const nodeId of nodeIds) {
        outgoingRaw.set(nodeId, []);
        outgoingMap.set(nodeId, []);
        indegree.set(nodeId, 0);
    }
    for (const edge of graph.edges) {
        const group = outgoingRaw.get(edge.from) ?? [];
        group.push(edge);
        outgoingRaw.set(edge.from, group);
        if (indegree.has(edge.to) && indegree.has(edge.from)) {
            indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
        }
    }
    for (const [nodeId, edges] of outgoingRaw.entries()) {
        outgoingMap.set(nodeId, normalizeOutgoing(edges));
    }
    const queue = nodeIds.filter((nodeId) => (indegree.get(nodeId) ?? 0) === 0);
    const orderedNodes = [];
    while (queue.length > 0) {
        const nodeId = queue.shift();
        orderedNodes.push(nodeId);
        for (const edge of outgoingMap.get(nodeId) ?? []) {
            const nextDegree = (indegree.get(edge.to) ?? 0) - 1;
            indegree.set(edge.to, nextDegree);
            if (nextDegree === 0) {
                queue.push(edge.to);
            }
        }
    }
    const isDag = orderedNodes.length === nodeIds.length;
    const finalOrder = isDag ? orderedNodes : nodeIds;
    return {
        orderedNodes: finalOrder,
        nodeOrder: new Map(finalOrder.map((nodeId, index) => [nodeId, index])),
        outgoingMap,
        isDag
    };
}
function solveLinearSystem(matrix, vector) {
    const size = matrix.length;
    const augmented = matrix.map((row, index) => [...row, vector[index] ?? 0]);
    for (let pivotIndex = 0; pivotIndex < size; pivotIndex += 1) {
        let maxRow = pivotIndex;
        for (let rowIndex = pivotIndex + 1; rowIndex < size; rowIndex += 1) {
            if (Math.abs(augmented[rowIndex][pivotIndex]) > Math.abs(augmented[maxRow][pivotIndex])) {
                maxRow = rowIndex;
            }
        }
        if (Math.abs(augmented[maxRow][pivotIndex]) < 1e-9) {
            return null;
        }
        if (maxRow !== pivotIndex) {
            const tmp = augmented[pivotIndex];
            augmented[pivotIndex] = augmented[maxRow];
            augmented[maxRow] = tmp;
        }
        const pivot = augmented[pivotIndex][pivotIndex];
        for (let column = pivotIndex; column <= size; column += 1) {
            augmented[pivotIndex][column] /= pivot;
        }
        for (let rowIndex = 0; rowIndex < size; rowIndex += 1) {
            if (rowIndex === pivotIndex) {
                continue;
            }
            const factor = augmented[rowIndex][pivotIndex];
            if (Math.abs(factor) < 1e-12) {
                continue;
            }
            for (let column = pivotIndex; column <= size; column += 1) {
                augmented[rowIndex][column] -= factor * augmented[pivotIndex][column];
            }
        }
    }
    return augmented.map((row) => row[size]);
}
function fallbackVisitFactors(graph, outgoingMap) {
    const nodeIds = graph.nodes.map((node) => node.id);
    const fallbackStart = nodeIds.length > 0 ? [nodeIds[0]] : [];
    const startNodes = graph.startNodes.length > 0 ? graph.startNodes : fallbackStart;
    const base = new Map();
    for (const nodeId of nodeIds) {
        base.set(nodeId, 0);
    }
    const perStart = 1 / Math.max(1, startNodes.length);
    for (const nodeId of startNodes) {
        base.set(nodeId, (base.get(nodeId) ?? 0) + perStart);
    }
    let visits = new Map(base);
    for (let iteration = 0; iteration < 350; iteration += 1) {
        const next = new Map(base);
        for (const nodeId of nodeIds) {
            const fromVisits = visits.get(nodeId) ?? 0;
            if (fromVisits <= 0) {
                continue;
            }
            for (const edge of outgoingMap.get(nodeId) ?? []) {
                next.set(edge.to, (next.get(edge.to) ?? 0) + fromVisits * edge.probability);
            }
        }
        let maxDelta = 0;
        for (const nodeId of nodeIds) {
            maxDelta = Math.max(maxDelta, Math.abs((next.get(nodeId) ?? 0) - (visits.get(nodeId) ?? 0)));
        }
        visits = next;
        if (maxDelta < 1e-8) {
            break;
        }
    }
    const result = {};
    for (const nodeId of nodeIds) {
        result[nodeId] = clamp(num(visits.get(nodeId), 0), 0.01, 12);
    }
    return result;
}
function computeVisitFactors(graph) {
    const nodeIds = graph.nodes.map((node) => node.id);
    const graphAnalysis = analyzeGraph(graph);
    const warnings = [];
    const fallbackStart = nodeIds.length > 0 ? [nodeIds[0]] : [];
    const startNodes = graph.startNodes.length > 0 ? graph.startNodes : fallbackStart;
    const base = new Map();
    for (const nodeId of nodeIds) {
        base.set(nodeId, 0);
    }
    const perStart = 1 / Math.max(1, startNodes.length);
    for (const nodeId of startNodes) {
        base.set(nodeId, (base.get(nodeId) ?? 0) + perStart);
    }
    if (graphAnalysis.isDag) {
        const visits = new Map(base);
        for (const nodeId of graphAnalysis.orderedNodes) {
            const fromVisits = visits.get(nodeId) ?? 0;
            for (const edge of graphAnalysis.outgoingMap.get(nodeId) ?? []) {
                visits.set(edge.to, (visits.get(edge.to) ?? 0) + fromVisits * edge.probability);
            }
        }
        const visitFactors = {};
        for (const nodeId of nodeIds) {
            visitFactors[nodeId] = Math.max(0.01, num(visits.get(nodeId), 0));
        }
        return { visitFactors, warnings, graph: graphAnalysis };
    }
    const indexByNode = new Map(nodeIds.map((nodeId, index) => [nodeId, index]));
    const matrix = nodeIds.map((nodeId) => nodeIds.map((candidate) => (candidate === nodeId ? 1 : 0)));
    const vector = nodeIds.map((nodeId) => base.get(nodeId) ?? 0);
    for (const fromNodeId of nodeIds) {
        const fromIndex = indexByNode.get(fromNodeId) ?? 0;
        for (const edge of graphAnalysis.outgoingMap.get(fromNodeId) ?? []) {
            const toIndex = indexByNode.get(edge.to);
            if (toIndex === undefined) {
                continue;
            }
            matrix[toIndex][fromIndex] -= edge.probability;
        }
    }
    const solved = solveLinearSystem(matrix, vector);
    if (solved &&
        solved.every((value) => Number.isFinite(value) && value >= -1e-6) &&
        solved.some((value) => value > 0)) {
        const visitFactors = {};
        nodeIds.forEach((nodeId, index) => {
            visitFactors[nodeId] = Math.max(0.01, solved[index] ?? 0);
        });
        warnings.push("Graph contains a rework loop; visit factors were solved analytically for a convergent cycle.");
        return { visitFactors, warnings, graph: graphAnalysis };
    }
    warnings.push("Graph contains a non-absorbing or unstable cycle; visit factors are capped using a fallback approximation and outputs are not decision-grade.");
    return {
        visitFactors: fallbackVisitFactors(graph, graphAnalysis.outgoingMap),
        warnings,
        graph: graphAnalysis
    };
}
function analyticalQueueDepth(demandRatePerHour, capacityPerHour, variabilityCv, horizonHours) {
    const rhoRaw = demandRatePerHour / Math.max(0.001, capacityPerHour);
    if (rhoRaw < 1) {
        const rho = Math.min(0.9999, Math.max(0, rhoRaw));
        const cv = Math.max(0.03, variabilityCv);
        return (rho * rho * (1 + cv * cv)) / (2 * Math.max(0.0001, 1 - rho));
    }
    return Math.max(0, demandRatePerHour - capacityPerHour) * Math.max(0, horizonHours);
}
function readStepOverride(scenario, stepId, field) {
    const value = num(scenario[`step_${stepId}_${field}`], Number.NaN);
    return Number.isFinite(value) ? value : null;
}
function evaluateSystem(model, scenario, visitFactors, reliefStepId, reliefUnits) {
    const baselineDemand = num(model.inputDefaults.demandRatePerHour, num(model.baseline.demandRatePerHour, 10));
    const demandMultiplier = clamp(num(scenario.demandMultiplier, 1), 0, 3);
    const lineDemand = Math.max(0, baselineDemand * demandMultiplier);
    const staffingMultiplier = clamp(num(scenario.staffingMultiplier, 1), 0.25, 3);
    const equipmentMultiplier = clamp(num(scenario.equipmentMultiplier, 1), 0.25, 3);
    const availabilityMultiplier = clamp(1 - num(scenario.unplannedDowntimePct, 7) / 100, 0.2, 1);
    const ctMultiplier = clamp(num(scenario.ctMultiplier, 1), 0.25, 3);
    const setupPenaltyMultiplier = clamp(num(scenario.setupPenaltyMultiplier, 1), 0, 3);
    const variabilityMultiplier = clamp(num(scenario.variabilityMultiplier, 1), 0.2, 3);
    const horizonHours = clamp(num(scenario.simulationHorizonHours, 8), 8, 720);
    const shiftConfig = readShiftConfig(scenario);
    const activeCapacityFraction = shiftConfig.activeHoursPerDay / 24;
    const mixProfile = String(scenario.mixProfile ?? "balanced");
    const mixFactors = buildMixModifiers(model.stepModels.length, mixProfile);
    const stepEvals = {};
    const ranked = [];
    let lineCapacity = Number.POSITIVE_INFINITY;
    let totalWipQty = 0;
    let totalLeadTimeMinutes = 0;
    let totalExplicitLeadTimeMinutes = 0;
    let leadTimeTopStepId = "";
    let leadTimeTopValue = -1;
    let worstCaseTouchTime = 0;
    model.stepModels.forEach((step, index) => {
        const ctMinutes = typeof step.ctMinutes === "number" ? step.ctMinutes : null;
        if (ctMinutes === null) {
            stepEvals[step.stepId] = {
                demandRatePerHour: null,
                utilization: null,
                headroom: null,
                queueRisk: null,
                queueDepth: null,
                queueDelayMinutes: null,
                wipQty: null,
                effectiveUnits: null,
                effectiveCtMinutes: null,
                capacityPerHour: null,
                calendarCapacityPerHour: null,
                serviceTimeHours: null,
                explicitLeadTimeMinutes: null,
                stepLeadTimeMinutes: null,
                bottleneckIndex: null,
                status: "unknown",
                throughputLimit: null
            };
            return;
        }
        const stepVisitFactor = Math.max(0.01, num(visitFactors[step.stepId], 1));
        const stepMixFactor = mixFactors[index] ?? 1;
        const stepDemandRate = lineDemand * stepVisitFactor * stepMixFactor;
        const stepCapacityUnitsOverride = readStepOverride(scenario, step.stepId, "capacityUnits");
        const stepCtBaselineOverride = readStepOverride(scenario, step.stepId, "ctBaseline");
        const stepCtMultiplier = Math.max(0.1, readStepOverride(scenario, step.stepId, "ctMultiplier") ?? 1);
        const stepDowntimePct = clamp(readStepOverride(scenario, step.stepId, "downtimePct") ?? 0, 0, 95);
        const stepLeadTimeMinutesOverride = readStepOverride(scenario, step.stepId, "leadTimeMinutes");
        const ctBaseline = Math.max(0.05, stepCtBaselineOverride ?? ctMinutes);
        const setupPenalty = Math.max(0, num(step.changeoverPenaltyPerUnitMinutes, 0));
        const effectiveCt = Math.max(0.05, ctBaseline * ctMultiplier * stepCtMultiplier) +
            Math.max(0, setupPenalty * setupPenaltyMultiplier);
        const baseUnits = Math.max(0.05, (stepCapacityUnitsOverride ?? num(step.effectiveUnits, 1)) * staffingMultiplier * equipmentMultiplier);
        const relief = step.stepId === reliefStepId ? Math.max(0, reliefUnits) : 0;
        const effectiveUnits = baseUnits + relief;
        const stepAvailabilityMultiplier = availabilityMultiplier * (1 - stepDowntimePct / 100);
        const computedCapacityRate = (effectiveUnits * 60 * clamp(stepAvailabilityMultiplier, 0.05, 1)) / Math.max(0.05, effectiveCt);
        const capacityRate = Math.max(0.001, computedCapacityRate);
        const calendarCapacityRate = Math.max(0.001, capacityRate * activeCapacityFraction);
        const serviceTimeHours = effectiveCt / 60;
        const worstCtMinutes = Math.max(0.05, ctBaseline * ctMultiplier * stepCtMultiplier);
        worstCaseTouchTime += worstCtMinutes;
        const utilizationRaw = stepDemandRate / Math.max(0.001, calendarCapacityRate);
        const utilization = clamp(utilizationRaw, 0, 1.35);
        const headroom = Math.max(0, 1 - utilizationRaw);
        const cv = Math.max(0.03, num(step.variabilityCv, 0.18) * variabilityMultiplier);
        const queueDepth = analyticalQueueDepth(stepDemandRate, calendarCapacityRate, cv, horizonHours);
        const queueRisk = queueRiskFromUtilization(utilizationRaw);
        const queueDelayMinutes = (queueDepth / Math.max(0.001, calendarCapacityRate)) * 60;
        const explicitLeadTimeMinutesBase = typeof step.leadTimeMinutes === "number" && Number.isFinite(step.leadTimeMinutes)
            ? Math.max(0, step.leadTimeMinutes)
            : null;
        const explicitLeadTimeMinutes = stepLeadTimeMinutesOverride !== null
            ? Math.max(0, stepLeadTimeMinutesOverride)
            : explicitLeadTimeMinutesBase;
        const stepLeadTimeMinutes = Math.max(0.01, effectiveCt + queueDelayMinutes + Math.max(0, explicitLeadTimeMinutes ?? 0));
        totalLeadTimeMinutes += stepLeadTimeMinutes;
        totalExplicitLeadTimeMinutes += Math.max(0, explicitLeadTimeMinutes ?? 0);
        if (stepLeadTimeMinutes > leadTimeTopValue) {
            leadTimeTopValue = stepLeadTimeMinutes;
            leadTimeTopStepId = step.stepId;
        }
        const inServiceWip = Math.max(0, Math.min(stepDemandRate, calendarCapacityRate) * serviceTimeHours);
        const wipQty = Math.max(0, queueDepth + inServiceWip);
        totalWipQty += wipQty;
        const bottleneckIndex = bottleneckIndexFrom(utilization, queueRisk);
        const status = stepStatus(utilization, bottleneckIndex);
        const throughputLimit = calendarCapacityRate / Math.max(0.01, stepVisitFactor * stepMixFactor);
        lineCapacity = Math.min(lineCapacity, throughputLimit);
        stepEvals[step.stepId] = {
            demandRatePerHour: stepDemandRate,
            utilization,
            headroom,
            queueRisk,
            queueDepth,
            queueDelayMinutes,
            wipQty,
            effectiveUnits,
            effectiveCtMinutes: effectiveCt,
            capacityPerHour: capacityRate,
            calendarCapacityPerHour: calendarCapacityRate,
            serviceTimeHours,
            explicitLeadTimeMinutes,
            stepLeadTimeMinutes,
            bottleneckIndex,
            status,
            throughputLimit
        };
        ranked.push({ stepId: step.stepId, score: bottleneckIndex });
    });
    ranked.sort((a, b) => {
        const scoreDelta = b.score - a.score;
        if (Math.abs(scoreDelta) > 1e-9) {
            return scoreDelta;
        }
        const aLimit = stepEvals[a.stepId]?.throughputLimit ?? Number.POSITIVE_INFINITY;
        const bLimit = stepEvals[b.stepId]?.throughputLimit ?? Number.POSITIVE_INFINITY;
        return aLimit - bLimit;
    });
    const throughput = Math.min(lineDemand, Number.isFinite(lineCapacity) ? lineCapacity : lineDemand);
    const avgQueueRisk = ranked.length > 0
        ? ranked.reduce((sum, row) => sum + (stepEvals[row.stepId]?.queueRisk ?? 0), 0) / ranked.length
        : 0;
    return {
        lineDemand,
        throughput,
        stepEvals,
        bottleneckStepId: ranked[0]?.stepId ?? "",
        leadTimeTopStepId,
        avgQueueRisk,
        totalWipQty,
        totalLeadTimeMinutes,
        totalExplicitLeadTimeMinutes,
        worstCaseTouchTime,
        horizonHours,
        sortedByBottleneck: ranked,
        warnings: []
    };
}
function resolveTerminalNodeIds(graph, outgoingMap) {
    const declaredTerminalIds = (graph.endNodes ?? []).filter((nodeId) => (outgoingMap.get(nodeId) ?? []).length === 0);
    if (declaredTerminalIds.length > 0) {
        return new Set(declaredTerminalIds);
    }
    return new Set(graph.nodes
        .map((node) => node.id)
        .filter((nodeId) => (outgoingMap.get(nodeId) ?? []).length === 0));
}
function estimateWarmupHours(orderedNodes, outgoingMap, system, startNodes, isDag) {
    if (!isDag) {
        return 0;
    }
    const pathHours = new Map(orderedNodes.map((nodeId) => [nodeId, 0]));
    for (const startId of startNodes) {
        pathHours.set(startId, 0);
    }
    for (const nodeId of orderedNodes) {
        const current = pathHours.get(nodeId) ?? 0;
        const serviceTimeHours = Math.max(0, system.stepEvals[nodeId]?.serviceTimeHours ?? 0);
        const departure = current + serviceTimeHours;
        for (const edge of outgoingMap.get(nodeId) ?? []) {
            pathHours.set(edge.to, Math.max(pathHours.get(edge.to) ?? 0, departure));
        }
    }
    return orderedNodes.reduce((max, nodeId) => {
        const total = (pathHours.get(nodeId) ?? 0) + Math.max(0, system.stepEvals[nodeId]?.serviceTimeHours ?? 0);
        return Math.max(max, total);
    }, 0);
}
function simulateRuntimeFlow(model, system, elapsedHours, scenario) {
    const graphAnalysis = analyzeGraph(model.graph);
    const orderedNodes = graphAnalysis.orderedNodes;
    const nodeIds = model.graph.nodes.map((node) => node.id);
    const startNodes = model.graph.startNodes.length > 0 ? model.graph.startNodes : orderedNodes.length > 0 ? [orderedNodes[0]] : [];
    const startRatePerNode = startNodes.length > 0 ? system.lineDemand / startNodes.length : 0;
    const shiftConfig = readShiftConfig(scenario);
    const outgoingMap = graphAnalysis.outgoingMap;
    const terminalNodeSet = resolveTerminalNodeIds(model.graph, outgoingMap);
    const queueQty = new Map(nodeIds.map((nodeId) => [nodeId, 0]));
    const processedQtyByStep = new Map(nodeIds.map((nodeId) => [nodeId, 0]));
    const snapshotProcessedRateByStep = new Map(nodeIds.map((nodeId) => [nodeId, 0]));
    const completedQtyByStep = new Map(nodeIds.map((nodeId) => [nodeId, 0]));
    const blockedIdleHoursByStep = new Map(nodeIds.map((nodeId) => [nodeId, 0]));
    let arrivals = new Map(nodeIds.map((nodeId) => [nodeId, 0]));
    let totalCompletedQty = 0;
    const cappedElapsed = Math.max(0, elapsedHours);
    const activeElapsedHours = activeHoursBetween(0, cappedElapsed, shiftConfig.shiftDurationHours, shiftConfig.shiftStartHour);
    const warnings = [];
    if (!graphAnalysis.isDag) {
        warnings.push("Runtime flow uses conservative next-tick carry for cycle edges; cyclic throughput should be treated cautiously.");
    }
    const warmupHours = estimateWarmupHours(orderedNodes, outgoingMap, system, startNodes, graphAnalysis.isDag);
    if (cappedElapsed > 0) {
        const maxSteps = 1800;
        const targetDt = 1 / 240; // 15 seconds in simulation time
        const rawSteps = Math.ceil(cappedElapsed / targetDt);
        const steps = Math.max(1, Math.min(maxSteps, rawSteps));
        const makeZeroMap = () => new Map(nodeIds.map((nodeId) => [nodeId, 0]));
        const dtHours = cappedElapsed / steps;
        for (let tick = 0; tick < steps; tick += 1) {
            const intervalStartHours = tick * dtHours;
            const intervalEndHours = intervalStartHours + dtHours;
            const activeHours = activeHoursBetween(intervalStartHours, intervalEndHours, shiftConfig.shiftDurationHours, shiftConfig.shiftStartHour);
            const tickArrivals = new Map(arrivals);
            for (const startId of startNodes) {
                tickArrivals.set(startId, (tickArrivals.get(startId) ?? 0) + startRatePerNode * dtHours);
            }
            const nextArrivals = makeZeroMap();
            for (const nodeId of orderedNodes) {
                const stepEval = system.stepEvals[nodeId];
                const currentOrder = graphAnalysis.nodeOrder.get(nodeId) ?? -1;
                const incomingQty = tickArrivals.get(nodeId) ?? 0;
                const outgoing = outgoingMap.get(nodeId) ?? [];
                const routeForward = (toNodeId, quantity) => {
                    if (quantity <= 0) {
                        return;
                    }
                    const targetOrder = graphAnalysis.nodeOrder.get(toNodeId) ?? Number.MAX_SAFE_INTEGER;
                    if (graphAnalysis.isDag && targetOrder > currentOrder) {
                        tickArrivals.set(toNodeId, (tickArrivals.get(toNodeId) ?? 0) + quantity);
                        return;
                    }
                    nextArrivals.set(toNodeId, (nextArrivals.get(toNodeId) ?? 0) + quantity);
                };
                if (!stepEval || stepEval.capacityPerHour === null || stepEval.capacityPerHour <= 0) {
                    if (terminalNodeSet.has(nodeId)) {
                        totalCompletedQty += incomingQty;
                        completedQtyByStep.set(nodeId, (completedQtyByStep.get(nodeId) ?? 0) + incomingQty);
                    }
                    for (const edge of outgoing) {
                        routeForward(edge.to, incomingQty * edge.probability);
                    }
                    processedQtyByStep.set(nodeId, (processedQtyByStep.get(nodeId) ?? 0) + incomingQty);
                    snapshotProcessedRateByStep.set(nodeId, activeHours > 0 ? incomingQty / activeHours : 0);
                    continue;
                }
                const availableQty = (queueQty.get(nodeId) ?? 0) + incomingQty;
                const capacityQty = stepEval.capacityPerHour * activeHours;
                let downstreamAcceptance = 1;
                if (outgoing.length > 0 && activeHours > 0) {
                    let weightedAcceptance = 0;
                    let totalProbability = 0;
                    for (const edge of outgoing) {
                        const childEval = system.stepEvals[edge.to];
                        const probability = edge.probability;
                        totalProbability += probability;
                        if (!childEval) {
                            weightedAcceptance += probability;
                            continue;
                        }
                        const childQueueQty = queueQty.get(edge.to) ?? 0;
                        const childPendingQty = (tickArrivals.get(edge.to) ?? 0) + (nextArrivals.get(edge.to) ?? 0);
                        const childProjectedLoad = childQueueQty + childPendingQty;
                        const childCalendarCapacity = childEval.calendarCapacityPerHour ?? childEval.capacityPerHour ?? 0;
                        const childBufferQty = Math.max(1, childCalendarCapacity * 2);
                        const childAcceptance = clamp(1 - childProjectedLoad / childBufferQty, 0, 1);
                        weightedAcceptance += childAcceptance * probability;
                    }
                    if (totalProbability > 0) {
                        downstreamAcceptance = weightedAcceptance / totalProbability;
                    }
                }
                const processedQty = Math.min(availableQty, capacityQty * downstreamAcceptance);
                const queueRemaining = Math.max(0, availableQty - processedQty);
                queueQty.set(nodeId, queueRemaining);
                processedQtyByStep.set(nodeId, (processedQtyByStep.get(nodeId) ?? 0) + processedQty);
                snapshotProcessedRateByStep.set(nodeId, activeHours > 0 ? processedQty / activeHours : 0);
                if (activeHours > 0 && outgoing.length > 0 && availableQty > 1e-9 && capacityQty > 1e-9) {
                    const blockedIdleRatio = clamp(1 - processedQty / Math.max(1e-9, Math.min(availableQty, capacityQty)), 0, 1);
                    blockedIdleHoursByStep.set(nodeId, (blockedIdleHoursByStep.get(nodeId) ?? 0) + activeHours * blockedIdleRatio);
                }
                if (terminalNodeSet.has(nodeId)) {
                    totalCompletedQty += processedQty;
                    completedQtyByStep.set(nodeId, (completedQtyByStep.get(nodeId) ?? 0) + processedQty);
                }
                if (outgoing.length === 0) {
                    continue;
                }
                for (const edge of outgoing) {
                    routeForward(edge.to, processedQty * edge.probability);
                }
            }
            arrivals = nextArrivals;
        }
        for (const nodeId of nodeIds) {
            const remainingArrivalQty = arrivals.get(nodeId) ?? 0;
            if (remainingArrivalQty > 0) {
                queueQty.set(nodeId, (queueQty.get(nodeId) ?? 0) + remainingArrivalQty);
            }
        }
    }
    const node = {};
    let totalWipQty = 0;
    const ranked = [];
    const realizedThroughput = cappedElapsed > 0 ? totalCompletedQty / Math.max(1e-9, cappedElapsed) : 0;
    for (const nodeId of nodeIds) {
        const stepEval = system.stepEvals[nodeId];
        if (!stepEval || stepEval.capacityPerHour === null || stepEval.capacityPerHour <= 0) {
            node[nodeId] = {
                utilization: null,
                queueRisk: null,
                queueDepth: null,
                wipQty: null,
                processedQty: Math.max(0, processedQtyByStep.get(nodeId) ?? 0),
                completedQty: Math.max(0, completedQtyByStep.get(nodeId) ?? 0),
                idleWaitHours: null,
                idleWaitPct: null,
                bottleneckIndex: null,
                status: "unknown"
            };
            continue;
        }
        const displayedCapacityPerHour = stepEval.calendarCapacityPerHour ?? stepEval.capacityPerHour ?? 0;
        const cumulativeProcessedQty = processedQtyByStep.get(nodeId) ?? 0;
        const realizedRate = cappedElapsed > 0 ? cumulativeProcessedQty / Math.max(1e-9, cappedElapsed) : 0;
        const utilizationRaw = realizedRate / Math.max(0.001, displayedCapacityPerHour);
        const utilization = clamp(utilizationRaw, 0, 1.35);
        const queueDepth = Math.max(0, queueQty.get(nodeId) ?? 0);
        const snapshotProcessedRate = snapshotProcessedRateByStep.get(nodeId) ?? 0;
        const processWip = Math.max(0, snapshotProcessedRate * Math.max(0, stepEval.serviceTimeHours ?? 0));
        const wipQty = queueDepth + processWip;
        totalWipQty += wipQty;
        const idleWaitHours = Math.max(0, blockedIdleHoursByStep.get(nodeId) ?? 0);
        const idleWaitPct = activeElapsedHours > 0 ? clamp(idleWaitHours / activeElapsedHours, 0, 1) : 0;
        const queueRisk = queueRiskFromUtilization(utilizationRaw);
        const stepBottleneckIndex = bottleneckIndexFrom(utilization, queueRisk);
        const status = stepStatus(utilization, stepBottleneckIndex);
        node[nodeId] = {
            utilization,
            queueRisk,
            queueDepth,
            wipQty,
            processedQty: Math.max(0, processedQtyByStep.get(nodeId) ?? 0),
            completedQty: Math.max(0, completedQtyByStep.get(nodeId) ?? 0),
            idleWaitHours,
            idleWaitPct,
            bottleneckIndex: stepBottleneckIndex,
            status
        };
        ranked.push({ stepId: nodeId, score: stepBottleneckIndex });
    }
    ranked.sort((a, b) => {
        const scoreDelta = b.score - a.score;
        if (Math.abs(scoreDelta) > 1e-9) {
            return scoreDelta;
        }
        const aCapacity = node[a.stepId]?.utilization !== null
            ? system.stepEvals[a.stepId]?.calendarCapacityPerHour ?? system.stepEvals[a.stepId]?.capacityPerHour ?? Number.POSITIVE_INFINITY
            : Number.POSITIVE_INFINITY;
        const bCapacity = node[b.stepId]?.utilization !== null
            ? system.stepEvals[b.stepId]?.calendarCapacityPerHour ?? system.stepEvals[b.stepId]?.capacityPerHour ?? Number.POSITIVE_INFINITY
            : Number.POSITIVE_INFINITY;
        return aCapacity - bCapacity;
    });
    const bottleneckStepId = ranked[0]?.stepId ?? null;
    const bottleneckIndex = ranked[0]?.score ?? 0;
    const processedQtyRecord = {};
    const completedQtyRecord = {};
    for (const nodeId of nodeIds) {
        processedQtyRecord[nodeId] = Math.max(0, processedQtyByStep.get(nodeId) ?? 0);
        completedQtyRecord[nodeId] = Math.max(0, completedQtyByStep.get(nodeId) ?? 0);
    }
    let throughputState = "fallback-analytical";
    if (cappedElapsed > 0) {
        throughputState = cappedElapsed + 1e-9 < warmupHours ? "transient" : "steady-state";
        if (throughputState === "transient") {
            warnings.push(`Forecast throughput is transient because elapsed time (${cappedElapsed.toFixed(2)} h) is shorter than the estimated warmup (${warmupHours.toFixed(2)} h).`);
        }
    }
    return {
        node,
        totalWipQty,
        bottleneckStepId,
        bottleneckIndex,
        realizedThroughput,
        completedOutputQty: totalCompletedQty,
        processedQtyByStep: processedQtyRecord,
        completedQtyByStep: completedQtyRecord,
        sortedByBottleneck: ranked,
        throughputState,
        warmupHours,
        warnings
    };
}
function migrationLabel(model, baseline, relief) {
    const nodeLabel = new Map(model.graph.nodes.map((node) => [node.id, node.label]));
    const currentLabel = nodeLabel.get(baseline.bottleneckStepId) ?? baseline.bottleneckStepId;
    const nextLabel = nodeLabel.get(relief.bottleneckStepId) ?? relief.bottleneckStepId;
    if (!currentLabel || !nextLabel) {
        return "n/a";
    }
    if (currentLabel === nextLabel) {
        return `${currentLabel} -> no change`;
    }
    const top = relief.sortedByBottleneck[0]?.score ?? 0;
    const second = relief.sortedByBottleneck[1]?.score ?? 0;
    const confidence = top - second < 0.05 ? " (low confidence)" : "";
    return `${currentLabel} -> ${nextLabel}${confidence}`;
}
export function createConstraintForecast(model, scenario) {
    const visitFactorResult = computeVisitFactors(model.graph);
    const baseline = evaluateSystem(model, scenario, visitFactorResult.visitFactors, "", 0);
    const reliefUnits = Math.max(0, Math.round(num(scenario.bottleneckReliefUnits, 1)));
    const relief = baseline.bottleneckStepId && reliefUnits > 0
        ? evaluateSystem(model, scenario, visitFactorResult.visitFactors, baseline.bottleneckStepId, reliefUnits)
        : baseline;
    const warnings = [...visitFactorResult.warnings, ...baseline.warnings, ...relief.warnings];
    return {
        baseline,
        relief,
        reliefUnits,
        visitFactors: visitFactorResult.visitFactors,
        warnings
    };
}
export function createBottleneckForecastOutput(model, scenario, elapsedHours = 0) {
    const stepLabelById = new Map(model.stepModels.map((step) => [step.stepId, step.label]));
    const forecast = createConstraintForecast(model, scenario);
    const { baseline, relief } = forecast;
    const runtime = simulateRuntimeFlow(model, baseline, elapsedHours, scenario);
    const topScore = runtime.bottleneckIndex;
    const secondScore = runtime.sortedByBottleneck[1]?.score ?? 0;
    const margin = Math.max(0, topScore - secondScore);
    const knownNodes = Object.values(runtime.node).filter((step) => step.utilization !== null);
    const nearSatCount = knownNodes.filter((step) => (step.utilization ?? 0) >= 0.9).length;
    const cascadePressure = knownNodes.length > 0 ? nearSatCount / knownNodes.length : 0;
    const referenceWipQty = littleLawReferenceWipQty(baseline.throughput, baseline.totalLeadTimeMinutes);
    const wipPressure = clamp(runtime.totalWipQty / Math.max(1, referenceWipQty), 0, 1);
    const migrationPenalty = baseline.bottleneckStepId !== relief.bottleneckStepId ? 0.08 : 0;
    const brittleness = clamp(0.48 * topScore +
        0.18 * (knownNodes.reduce((sum, row) => sum + (row.queueRisk ?? 0), 0) / Math.max(1, knownNodes.length)) +
        0.16 * cascadePressure +
        0.18 * wipPressure +
        migrationPenalty +
        (margin < 0.08 ? 0.06 : 0) -
        margin * 0.3, 0, 1);
    let totalLeadTimeMinutes = 0;
    let totalExplicitLeadTimeMinutes = 0;
    let leadTimeTopStepId = "";
    let leadTimeTopValue = -1;
    const nodeMetrics = {};
    for (const step of model.stepModels) {
        const evalStep = runtime.node[step.stepId];
        const stepBaseline = baseline.stepEvals[step.stepId];
        if (!evalStep) {
            nodeMetrics[step.stepId] = {
                utilization: null,
                headroom: null,
                queueRisk: null,
                queueDepth: null,
                wipQty: null,
                processedQty: 0,
                completedQty: 0,
                idleWaitHours: null,
                idleWaitPct: null,
                leadTimeMinutes: null,
                capacityPerHour: null,
                bottleneckIndex: null,
                bottleneckFlag: false,
                status: "unknown"
            };
            continue;
        }
        const capacityPerHour = stepBaseline?.calendarCapacityPerHour ?? stepBaseline?.capacityPerHour ?? null;
        const queueDelayMinutes = capacityPerHour !== null && capacityPerHour > 0
            ? ((evalStep.queueDepth ?? 0) / capacityPerHour) * 60
            : 0;
        const processMinutes = Math.max(0, (stepBaseline?.serviceTimeHours ?? 0) * 60);
        const explicitLeadMinutes = Math.max(0, stepBaseline?.explicitLeadTimeMinutes ?? 0);
        const leadTimeMinutes = processMinutes + queueDelayMinutes + explicitLeadMinutes;
        totalLeadTimeMinutes += leadTimeMinutes;
        totalExplicitLeadTimeMinutes += explicitLeadMinutes;
        if (leadTimeMinutes > leadTimeTopValue) {
            leadTimeTopValue = leadTimeMinutes;
            leadTimeTopStepId = step.stepId;
        }
        nodeMetrics[step.stepId] = {
            utilization: evalStep.utilization,
            headroom: evalStep.utilization !== null ? Math.max(0, 1 - evalStep.utilization) : stepBaseline?.headroom ?? null,
            queueRisk: evalStep.queueRisk,
            queueDepth: evalStep.queueDepth,
            wipQty: evalStep.wipQty,
            processedQty: evalStep.processedQty,
            completedQty: evalStep.completedQty,
            idleWaitHours: evalStep.idleWaitHours,
            idleWaitPct: evalStep.idleWaitPct,
            leadTimeMinutes,
            capacityPerHour,
            bottleneckIndex: evalStep.bottleneckIndex,
            bottleneckFlag: step.stepId === runtime.bottleneckStepId,
            status: evalStep.status
        };
    }
    const compiledBaselineLeadTime = num(model.baseline.globalMetrics.totalLeadTimeMinutes, baseline.totalLeadTimeMinutes);
    const waitSharePct = totalLeadTimeMinutes > 0 ? totalExplicitLeadTimeMinutes / totalLeadTimeMinutes : 0;
    const steadyStateThroughput = baseline.throughput;
    const forecastThroughput = runtime.throughputState === "fallback-analytical" ? baseline.throughput : runtime.realizedThroughput;
    const residualBasisThroughput = runtime.throughputState === "steady-state" ? forecastThroughput : baseline.throughput;
    const residualBasisLeadTimeHours = runtime.throughputState === "steady-state"
        ? totalLeadTimeMinutes / 60
        : baseline.totalLeadTimeMinutes / 60;
    const residualBasisWip = runtime.throughputState === "steady-state" ? runtime.totalWipQty : baseline.totalWipQty;
    const littleLawResidual = littleLawResidualPct(residualBasisThroughput, residualBasisLeadTimeHours * 60, residualBasisWip);
    const warnings = [...forecast.warnings, ...runtime.warnings];
    const globalMetrics = {
        simElapsedHours: elapsedHours,
        forecastThroughput,
        steadyStateThroughput,
        throughputState: runtime.throughputState,
        warmupHours: runtime.warmupHours,
        totalCompletedOutputPieces: runtime.completedOutputQty,
        totalWipQty: runtime.totalWipQty,
        worstCaseTouchTime: baseline.worstCaseTouchTime,
        totalLeadTimeMinutes,
        leadTimeDeltaMinutes: totalLeadTimeMinutes - compiledBaselineLeadTime,
        waitSharePct,
        leadTimeTopContributor: stepLabelById.get(leadTimeTopStepId) ?? "n/a",
        throughputDelta: relief.throughput - baseline.throughput,
        bottleneckMigration: migrationLabel(model, baseline, relief),
        bottleneckIndex: topScore,
        brittleness,
        littleLawResidualPct: littleLawResidual
    };
    return {
        globalMetrics,
        nodeMetrics,
        warnings
    };
}
