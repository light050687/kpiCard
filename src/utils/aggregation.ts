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
  ComparisonColorScheme,
  DeltaStatus,
  DetailRow,
} from '../types';
import { formatDeltaByFormat } from './formatRussian';

// ═══════════════════════════════════════
// NOTE: aggregateValues / aggregateNullable removed —
// aggregation now happens server-side via GROUP BY + SUM.
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// Delta & status computation
// ═══════════════════════════════════════

export function getDeltaStatus(
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

export function computeDelta(
  current: number,
  reference: number,
  isPercentMode: boolean,
  deltaFormat: string,
  defaultFormatDelta: (n: number) => string,
): { formatted: string; status_value: number } {
  const diff = current - reference;

  if (deltaFormat !== 'auto') {
    // Custom format — use formatDeltaByFormat directly
    return {
      formatted: formatDeltaByFormat(diff, reference, deltaFormat, isPercentMode),
      status_value: diff,
    };
  }

  // 'auto' mode — use existing behavior via defaultFormatDelta
  if (isPercentMode) {
    return { formatted: defaultFormatDelta(diff), status_value: diff };
  }
  if (reference === 0) {
    return { formatted: '—', status_value: 0 };
  }
  const pctDelta = diff / reference;
  return { formatted: defaultFormatDelta(pctDelta), status_value: diff };
}

// ═══════════════════════════════════════
// Row formatting
// ═══════════════════════════════════════

export function formatRow(
  name: string,
  metric: number,
  comp1: number | null,
  comp2: number | null,
  isPercentMode: boolean,
  formatValue: (n: number) => string,
  defaultFormatDelta: (n: number) => string,
  colorScheme1: ComparisonColorScheme,
  colorScheme2: ComparisonColorScheme,
  enableComp1: boolean,
  enableComp2: boolean,
  deltaFormat1: string,
  deltaFormat2: string,
  fmtComp1?: (n: number) => string,
  fmtComp2?: (n: number) => string,
  fmtDelta1?: (n: number) => string,
  fmtDelta2?: (n: number) => string,
  showDelta1 = true,
  showDelta2 = true,
  delta1Raw: number | null = null,
  delta2Raw: number | null = null,
): DetailRow {
  const row: DetailRow = {
    name,
    value: formatValue(metric),
  };

  if (enableComp1 && comp1 != null) {
    row.comp1Value = fmtComp1 ? fmtComp1(comp1) : formatValue(comp1);
    if (showDelta1) {
      if (delta1Raw != null) {
        // User-provided delta from SQL — use directly
        row.comp1Delta = fmtDelta1 ? fmtDelta1(delta1Raw) : String(delta1Raw);
        row.comp1Status = getDeltaStatus(delta1Raw, colorScheme1);
      } else {
        const d = computeDelta(metric, comp1, isPercentMode, deltaFormat1, defaultFormatDelta);
        row.comp1Delta = fmtDelta1 ? fmtDelta1(d.status_value) : d.formatted;
        row.comp1Status = getDeltaStatus(d.status_value, colorScheme1);
      }
    }
  }

  if (enableComp2 && comp2 != null) {
    row.comp2Value = fmtComp2 ? fmtComp2(comp2) : formatValue(comp2);
    if (showDelta2) {
      if (delta2Raw != null) {
        row.comp2Delta = fmtDelta2 ? fmtDelta2(delta2Raw) : String(delta2Raw);
        row.comp2Status = getDeltaStatus(delta2Raw, colorScheme2);
      } else {
        const d = computeDelta(metric, comp2, isPercentMode, deltaFormat2, defaultFormatDelta);
        row.comp2Delta = fmtDelta2 ? fmtDelta2(d.status_value) : d.formatted;
        row.comp2Status = getDeltaStatus(d.status_value, colorScheme2);
      }
    }
  }

  return row;
}

// ═══════════════════════════════════════
// NOTE: aggregateDetailData removed — aggregation
// now happens server-side. See utils/detailApi.ts
// for formatServerRow() which uses formatRow/getDeltaStatus/computeDelta.
// ═══════════════════════════════════════
