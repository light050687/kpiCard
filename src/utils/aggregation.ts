/**
 * Aggregation engine for KPI Card detail drill-down.
 *
 * Takes raw numeric rows and groups/aggregates them into
 * hierarchical DetailGroup[] using the specified aggregation type.
 *
 * Re-runs on every hierarchy swap — grouping by "primary → secondary"
 * produces DIFFERENT aggregated values than "secondary → primary"
 * (e.g., average per segment ≠ average per store).
 */

import type {
  AggregationType,
  ComparisonColorScheme,
  DeltaStatus,
  DetailGroup,
  DetailRow,
  RawDetailRow,
} from '../types';
import { formatRussianPercent, formatRussianPP } from './formatRussian';

// ═══════════════════════════════════════
// Core aggregation functions
// ═══════════════════════════════════════

function aggregateValues(values: number[], type: AggregationType): number {
  if (values.length === 0) return 0;

  switch (type) {
    case 'SUM':
      return values.reduce((a, b) => a + b, 0);
    case 'AVERAGE':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'PERCENT':
      // Weighted average for percentages
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'MAX':
      return Math.max(...values);
    case 'MIN':
      return Math.min(...values);
    default:
      return values.reduce((a, b) => a + b, 0);
  }
}

function aggregateNullable(
  values: Array<number | null>,
  type: AggregationType,
): number | null {
  const nonNull = values.filter((v): v is number => v != null);
  if (nonNull.length === 0) return null;
  return aggregateValues(nonNull, type);
}

// ═══════════════════════════════════════
// Delta & status computation
// ═══════════════════════════════════════

function getDeltaStatus(
  delta: number,
  colorScheme: ComparisonColorScheme,
): DeltaStatus {
  if (delta === 0) return 'neutral';
  const isPositive = delta > 0;

  if (colorScheme === 'green_up') {
    return isPositive ? 'up' : 'dn';
  }
  // green_down: positive delta is bad (e.g., expenses grew)
  return isPositive ? 'dn' : 'up';
}

function computeDelta(
  current: number,
  reference: number,
  aggregationType: AggregationType,
  formatDelta: (n: number) => string,
): { formatted: string; status_value: number } {
  if (aggregationType === 'PERCENT') {
    // Percentage points: current% - reference%
    const ppDelta = current - reference;
    return { formatted: formatDelta(ppDelta), status_value: ppDelta };
  }

  // Relative percentage change
  if (reference === 0) {
    return { formatted: '—', status_value: 0 };
  }
  const pctDelta = (current - reference) / reference;
  return { formatted: formatDelta(pctDelta), status_value: current - reference };
}

// ═══════════════════════════════════════
// Row formatting
// ═══════════════════════════════════════

function formatRow(
  name: string,
  metric: number,
  plan: number | null,
  prev: number | null,
  aggregationType: AggregationType,
  formatValue: (n: number) => string,
  formatDelta: (n: number) => string,
  colorScheme: ComparisonColorScheme,
  enablePlan: boolean,
  enableYoy: boolean,
): DetailRow {
  const row: DetailRow = {
    name,
    value: formatValue(metric),
  };

  if (enablePlan && plan != null) {
    const d = computeDelta(metric, plan, aggregationType, formatDelta);
    row.planValue = formatValue(plan);
    row.planDelta = d.formatted;
    row.planStatus = getDeltaStatus(d.status_value, colorScheme);
  }

  if (enableYoy && prev != null) {
    const d = computeDelta(metric, prev, aggregationType, formatDelta);
    row.prevValue = formatValue(prev);
    row.prevDelta = d.formatted;
    row.prevStatus = getDeltaStatus(d.status_value, colorScheme);
  }

  return row;
}

// ═══════════════════════════════════════
// Main aggregation pipeline
// ═══════════════════════════════════════

export interface AggregateOptions {
  rows: RawDetailRow[];
  groupByField: 'primaryGroup' | 'secondaryGroup';
  childField: 'primaryGroup' | 'secondaryGroup';
  aggregationType: AggregationType;
  topN: number;
  formatValue: (n: number) => string;
  formatDelta: (n: number) => string;
  colorScheme: ComparisonColorScheme;
  enablePlan: boolean;
  enableYoy: boolean;
}

/**
 * Aggregate raw detail rows into hierarchical groups.
 *
 * Groups by `groupByField`, children by `childField`.
 * Summary values are computed using `aggregationType`.
 *
 * When topN > 0, only the top N groups (by metric value desc) are returned.
 */
export function aggregateDetailData(opts: AggregateOptions): DetailGroup[] {
  const {
    rows,
    groupByField,
    childField,
    aggregationType,
    topN,
    formatValue,
    formatDelta,
    colorScheme,
    enablePlan,
    enableYoy,
  } = opts;

  // ── PERCENT mode: convert absolute values to shares (0..1) ──
  // Sum of shares within a group = group's share of total.
  // Delta is in percentage points (п.п.).
  let processedRows: RawDetailRow[] = rows;
  let effectiveAggType: AggregationType = aggregationType;
  let effectiveFormatValue = formatValue;
  let effectiveFormatDelta = formatDelta;

  if (aggregationType === 'PERCENT') {
    const totalMetric = rows.reduce((s, r) => s + r.metricValue, 0);
    const totalPlan = rows.reduce((s, r) => s + (r.planValue ?? 0), 0);
    const totalPrev = rows.reduce((s, r) => s + (r.prevValue ?? 0), 0);

    processedRows = rows.map(r => ({
      ...r,
      metricValue: totalMetric !== 0 ? r.metricValue / totalMetric : 0,
      planValue:
        r.planValue != null && totalPlan !== 0
          ? r.planValue / totalPlan
          : null,
      prevValue:
        r.prevValue != null && totalPrev !== 0
          ? r.prevValue / totalPrev
          : null,
    }));

    // Sum shares within a group gives the group's share
    effectiveAggType = 'SUM';
    // Format as "22,4%" instead of "892 млн"
    effectiveFormatValue = (n: number) => formatRussianPercent(n, false);
    // Delta in percentage points: "+1,3 п.п."
    effectiveFormatDelta = (n: number) => formatRussianPP(n);
  }

  // 1. Group rows by parent field
  const grouped = new Map<string, RawDetailRow[]>();
  for (const row of processedRows) {
    const key = row[groupByField];
    const existing = grouped.get(key);
    if (existing) {
      existing.push(row);
    } else {
      grouped.set(key, [row]);
    }
  }

  // 2. Build DetailGroup for each parent
  const result: Array<{ group: DetailGroup; rawMetric: number }> = [];

  for (const [groupName, groupRows] of grouped) {
    // Build children (aggregate by child field within this group)
    const childMap = new Map<string, RawDetailRow[]>();
    for (const row of groupRows) {
      const childKey = row[childField];
      const existing = childMap.get(childKey);
      if (existing) {
        existing.push(row);
      } else {
        childMap.set(childKey, [row]);
      }
    }

    const children: DetailRow[] = [];
    for (const [childName, childRows] of childMap) {
      const m = aggregateValues(childRows.map(r => r.metricValue), effectiveAggType);
      const p = aggregateNullable(childRows.map(r => r.planValue), effectiveAggType);
      const pr = aggregateNullable(childRows.map(r => r.prevValue), effectiveAggType);
      children.push(
        formatRow(childName, m, p, pr, effectiveAggType, effectiveFormatValue, effectiveFormatDelta, colorScheme, enablePlan, enableYoy),
      );
    }

    // Sort children by metric value descending (approximate by parsing)
    children.sort((a, b) => {
      // Use original numeric values for sorting
      const aIdx = [...childMap.keys()].indexOf(a.name);
      const bIdx = [...childMap.keys()].indexOf(b.name);
      const aVal = aggregateValues(
        (childMap.get([...childMap.keys()][aIdx] ?? '') ?? []).map(r => r.metricValue),
        effectiveAggType,
      );
      const bVal = aggregateValues(
        (childMap.get([...childMap.keys()][bIdx] ?? '') ?? []).map(r => r.metricValue),
        effectiveAggType,
      );
      return bVal - aVal;
    });

    // Group summary
    const summaryMetric = aggregateValues(groupRows.map(r => r.metricValue), effectiveAggType);
    const summaryPlan = aggregateNullable(groupRows.map(r => r.planValue), effectiveAggType);
    const summaryPrev = aggregateNullable(groupRows.map(r => r.prevValue), effectiveAggType);

    const summary = formatRow(
      groupName, summaryMetric, summaryPlan, summaryPrev,
      effectiveAggType, effectiveFormatValue, effectiveFormatDelta, colorScheme, enablePlan, enableYoy,
    );

    result.push({ group: { name: groupName, summary, children }, rawMetric: summaryMetric });
  }

  // 3. Sort groups by metric value descending
  result.sort((a, b) => b.rawMetric - a.rawMetric);

  // 4. Apply TOP N
  const groups = result.map(r => r.group);
  if (topN > 0) {
    return groups.slice(0, topN);
  }
  return groups;
}
