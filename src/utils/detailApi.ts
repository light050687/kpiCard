/**
 * Server-side detail data fetching API.
 *
 * Replaces client-side aggregation (aggregateDetailData) with
 * server GROUP BY + SUM queries. Each request returns ~20
 * aggregated rows instead of loading 50K raw rows.
 */

import { getMetricLabel } from '@superset-ui/core';
import type { QueryFormMetric } from '@superset-ui/core';
import type {
  AggregationType,
  ComparisonColorScheme,
  DeltaFormat,
  DetailQueryParams,
  DetailRow,
} from '../types';
import { formatRow } from './aggregation';
import { formatRussianPercent, formatRussianPP } from './formatRussian';

/** Find metric object by its label string */
function findMetricByLabel(
  metrics: QueryFormMetric[],
  label: string,
): QueryFormMetric | undefined {
  return metrics.find((m) => getMetricLabel(m) === label);
}

// ═══════════════════════════════════════
// Sort target resolution
// ═══════════════════════════════════════

type SortColumn =
  | 'name'
  | 'value'
  | 'comp1Value'
  | 'comp1Delta'
  | 'comp2Value'
  | 'comp2Delta';

/**
 * Map UI sort column to a server-side column/metric label.
 *
 * For computed deltas (no delta metric in SQL), fall back to
 * the main metric as a sorting proxy.
 */
export function resolveSortTarget(
  sortColumn: SortColumn,
  groupbyCol: string,
  metricLabel: string,
  comp1Label: string | null,
  comp2Label: string | null,
  delta1Label: string | null,
  delta2Label: string | null,
): string {
  switch (sortColumn) {
    case 'name':
      return groupbyCol;
    case 'value':
      return metricLabel;
    case 'comp1Value':
      return comp1Label ?? metricLabel;
    case 'comp1Delta':
      // Server can sort by delta metric if it exists in SQL
      return delta1Label ?? metricLabel;
    case 'comp2Value':
      return comp2Label ?? metricLabel;
    case 'comp2Delta':
      return delta2Label ?? metricLabel;
    default:
      return metricLabel;
  }
}

// ═══════════════════════════════════════
// Payload builders
// ═══════════════════════════════════════

interface GroupsPayloadParams {
  queryParams: DetailQueryParams;
  activeMode: 'a' | 'b';
  groupbyCol: string;
  childCol: string | undefined;
  page: number;
  pageSize: number;
  sortTarget: string;
  sortAsc: boolean; // true = ascending, false = descending (matches Superset API)
  searchQuery: string;
  searchScope: 'group' | 'child';
  exactMatch: boolean;
  metricLabel: string;
}

/**
 * Build POST /api/v1/chart/data payload for aggregated groups.
 *
 * Server performs GROUP BY groupbyCol with SUM/AVG on all metrics.
 * Returns pageSize+1 rows for cursor-based "has next page" detection.
 */
export function buildGroupsPayload(
  params: GroupsPayloadParams,
): Record<string, unknown> {
  const { queryParams, activeMode, groupbyCol, childCol, page, pageSize,
    sortTarget, sortAsc, searchQuery, searchScope, exactMatch, metricLabel } = params;

  const isA = activeMode === 'a';
  const metrics = isA ? queryParams.metricsA : queryParams.metricsB;

  // Build filters: base + search
  const filters: Array<{ col: string; op: string; val?: unknown }> = [...queryParams.filters];
  const trimmed = searchQuery.trim();
  if (trimmed) {
    const searchCol =
      searchScope === 'group' ? groupbyCol : (childCol ?? groupbyCol);
    const op = exactMatch ? '==' : 'ILIKE';
    const val = exactMatch ? trimmed : `%${trimmed}%`;
    filters.push({ col: searchCol, op, val });
  }

  // Extras with HAVING to filter zero-metric groups (merge with existing)
  // metricLabel is already an aggregate expression like "SUM(loss_sum)"
  // so use it directly — no extra SUM() wrapping
  const baseExtras = queryParams.extras ?? {};
  const existingHaving = (baseExtras.having as string | undefined) ?? '';
  const zeroFilter = `${metricLabel} != 0`;
  const having = existingHaving
    ? `${existingHaving} AND ${zeroFilter}`
    : zeroFilter;
  const extras: Record<string, unknown> = {
    ...baseExtras,
    having,
  };

  // Resolve orderby: use metric object if sortTarget matches a metric label,
  // otherwise use column name string
  const sortMetric = findMetricByLabel(metrics, sortTarget);
  const orderbyTarget = sortMetric ?? sortTarget;

  return {
    datasource: {
      id: queryParams.datasourceId,
      type: queryParams.datasourceType,
    },
    queries: [
      {
        columns: [groupbyCol],
        metrics,
        time_range: queryParams.timeRange || 'No filter',
        granularity: queryParams.granularity,
        filters,
        extras,
        row_limit: pageSize + 1, // +1 for hasNextPage detection
        row_offset: page * pageSize,
        orderby: [[orderbyTarget, sortAsc]],
        post_processing: [],
      },
    ],
    result_format: 'json',
    result_type: 'full',
  };
}

/**
 * Build a COUNT(*) query to get exact total number of non-zero groups.
 *
 * Uses a subquery approach: GROUP BY groupbyCol with HAVING metric != 0,
 * then wraps with COUNT. Since API doesn't support subqueries directly,
 * we request all group names (no metrics, no pagination) and count client-side.
 * row_limit = 100000 to get all groups.
 */
export function buildCountPayload(
  params: Omit<GroupsPayloadParams, 'page' | 'pageSize' | 'sortTarget' | 'sortAsc'>,
): Record<string, unknown> {
  const { queryParams, activeMode, groupbyCol, childCol,
    searchQuery, searchScope, exactMatch, metricLabel } = params;

  const isA = activeMode === 'a';
  const metrics = isA ? queryParams.metricsA : queryParams.metricsB;

  // Same filters as groups query
  const filters: Array<{ col: string; op: string; val?: unknown }> = [...queryParams.filters];
  const trimmed = searchQuery.trim();
  if (trimmed) {
    const searchCol =
      searchScope === 'group' ? groupbyCol : (childCol ?? groupbyCol);
    const op = exactMatch ? '==' : 'ILIKE';
    const val = exactMatch ? trimmed : `%${trimmed}%`;
    filters.push({ col: searchCol, op, val });
  }

  // Same HAVING as groups query
  const baseExtras = queryParams.extras ?? {};
  const existingHaving = (baseExtras.having as string | undefined) ?? '';
  const zeroFilter = `${metricLabel} != 0`;
  const having = existingHaving
    ? `${existingHaving} AND ${zeroFilter}`
    : zeroFilter;

  // Only request the metric (needed for HAVING) — minimal data transfer
  const primaryMetric = findMetricByLabel(metrics, metricLabel) ?? metrics[0];

  return {
    datasource: {
      id: queryParams.datasourceId,
      type: queryParams.datasourceType,
    },
    queries: [
      {
        columns: [groupbyCol],
        metrics: [primaryMetric],
        time_range: queryParams.timeRange || 'No filter',
        granularity: queryParams.granularity,
        filters,
        extras: { ...baseExtras, having },
        row_limit: 100000,
        post_processing: [],
      },
    ],
    result_format: 'json',
    result_type: 'full',
  };
}

interface ChildrenPayloadParams {
  queryParams: DetailQueryParams;
  activeMode: 'a' | 'b';
  parentCol: string;
  parentValue: string;
  childCol: string;
  metricLabel: string;
  searchQuery?: string;
  searchScope?: 'group' | 'child';
  exactMatch?: boolean;
}

/**
 * Build POST /api/v1/chart/data payload for children of a specific group.
 *
 * Adds an equality filter on the parent column to scope results.
 */
export function buildChildrenPayload(
  params: ChildrenPayloadParams,
): Record<string, unknown> {
  const { queryParams, activeMode, parentCol, parentValue, childCol,
    metricLabel, searchQuery, searchScope, exactMatch } = params;

  const isA = activeMode === 'a';
  const metrics = isA ? queryParams.metricsA : queryParams.metricsB;

  const filters: Array<{ col: string; op: string; val?: unknown }> = [
    ...queryParams.filters,
    { col: parentCol, op: '==', val: parentValue },
  ];

  // When searching by child scope, also filter children by search query
  const trimmed = searchQuery?.trim();
  if (trimmed && searchScope === 'child') {
    const op = exactMatch ? '==' : 'ILIKE';
    const val = exactMatch ? trimmed : `%${trimmed}%`;
    filters.push({ col: childCol, op, val });
  }

  // HAVING to filter zero-metric children (same as groups)
  const baseExtras = queryParams.extras ?? {};
  const existingHaving = (baseExtras.having as string | undefined) ?? '';
  const zeroFilter = `${metricLabel} != 0`;
  const having = existingHaving
    ? `${existingHaving} AND ${zeroFilter}`
    : zeroFilter;
  const extras: Record<string, unknown> = { ...baseExtras, having };

  // Resolve orderby: use metric object for proper API format
  const sortMetric = findMetricByLabel(metrics, metricLabel);
  const orderbyTarget = sortMetric ?? metricLabel;

  return {
    datasource: {
      id: queryParams.datasourceId,
      type: queryParams.datasourceType,
    },
    queries: [
      {
        columns: [childCol],
        metrics,
        time_range: queryParams.timeRange || 'No filter',
        granularity: queryParams.granularity,
        filters,
        extras,
        row_limit: 500,
        orderby: [[orderbyTarget, false]], // false = descending in Superset API
        post_processing: [],
      },
    ],
    result_format: 'json',
    result_type: 'full',
  };
}

/**
 * Build payload for CSV export — both GROUP BY columns, no pagination.
 *
 * Server aggregates by (groupbyCol, childCol) combination.
 * Each row = one parent+child pair with aggregated metrics.
 */
export function buildExportPayload(
  queryParams: DetailQueryParams,
  activeMode: 'a' | 'b',
  groupbyCol: string,
  childCol: string,
  metricLabel: string,
  searchQuery: string,
  searchScope: 'group' | 'child',
  exactMatch = false,
): Record<string, unknown> {
  const isA = activeMode === 'a';
  const metrics = isA ? queryParams.metricsA : queryParams.metricsB;

  const filters: Array<{ col: string; op: string; val?: unknown }> = [...queryParams.filters];
  const trimmed = searchQuery.trim();
  if (trimmed) {
    const searchCol = searchScope === 'group' ? groupbyCol : childCol;
    const op = exactMatch ? '==' : 'ILIKE';
    const val = exactMatch ? trimmed : `%${trimmed}%`;
    filters.push({ col: searchCol, op, val });
  }

  return {
    datasource: {
      id: queryParams.datasourceId,
      type: queryParams.datasourceType,
    },
    queries: [
      {
        columns: [groupbyCol, childCol],
        metrics,
        time_range: queryParams.timeRange || 'No filter',
        granularity: queryParams.granularity,
        filters,
        extras: (() => {
          const be = queryParams.extras ?? {};
          const eh = (be.having as string | undefined) ?? '';
          const zf = `${metricLabel} != 0`;
          return { ...be, having: eh ? `${eh} AND ${zf}` : zf };
        })(),
        row_limit: 50000,
        orderby: [[findMetricByLabel(metrics, metricLabel) ?? metricLabel, false]], // false = descending
        post_processing: [],
      },
    ],
    result_format: 'json',
    result_type: 'full',
  };
}

// ═══════════════════════════════════════
// Server row formatting
// ═══════════════════════════════════════

export interface FormatRowOpts {
  aggregationType: AggregationType;
  formatValue: (n: number) => string;
  formatDelta: (n: number) => string;
  colorScheme1: ComparisonColorScheme;
  colorScheme2: ComparisonColorScheme;
  enableComp1: boolean;
  enableComp2: boolean;
  deltaFormat1: DeltaFormat;
  deltaFormat2: DeltaFormat;
  fmtComp1?: (n: number) => string;
  fmtComp2?: (n: number) => string;
  fmtDelta1?: (n: number) => string;
  fmtDelta2?: (n: number) => string;
  showDelta1: boolean;
  showDelta2: boolean;
}

/**
 * Convert a raw server row (keyed by metric labels) into a formatted DetailRow.
 *
 * For PERCENT mode: computes ratio = metric / comp1, formats as percentage.
 * For other modes: uses the raw SUM values directly.
 *
 * Returns both the formatted row and the raw metric for sorting verification.
 */
export function formatServerRow(
  row: Record<string, unknown>,
  nameCol: string,
  metricLabel: string,
  comp1Label: string | null,
  comp2Label: string | null,
  delta1Label: string | null,
  delta2Label: string | null,
  opts: FormatRowOpts,
): { name: string; summary: DetailRow; rawMetric: number } {
  const name = String(row[nameCol] ?? 'N/A');

  // Extract raw numeric values from server response
  let metric = Number(row[metricLabel] ?? 0);
  let comp1 = comp1Label != null ? Number(row[comp1Label] ?? 0) : null;
  let comp2 = comp2Label != null ? Number(row[comp2Label] ?? 0) : null;
  const delta1Raw = delta1Label != null ? Number(row[delta1Label] ?? 0) : null;
  const delta2Raw = delta2Label != null ? Number(row[delta2Label] ?? 0) : null;

  const isPercentMode = opts.aggregationType === 'PERCENT';

  // Effective formatters — PERCENT mode overrides with Russian percent format
  let effectiveFormatValue = opts.formatValue;
  let effectiveFormatDelta = opts.formatDelta;

  if (isPercentMode) {
    // Server returns SUM values — compute ratio on client
    const rawMetric = metric;
    const rawComp1 = comp1;
    metric = rawComp1 != null && rawComp1 !== 0 ? rawMetric / rawComp1 : 0;
    comp1 = comp1 != null ? 1 : null; // baseline = 100%
    comp2 =
      comp2 != null && comp2 !== 0 ? rawMetric / comp2 : null;

    effectiveFormatValue = (n: number) => formatRussianPercent(n, false);
    effectiveFormatDelta = (n: number) => formatRussianPP(n);
  }

  const rawMetric = metric;

  const summary = formatRow(
    name,
    metric,
    comp1,
    comp2,
    isPercentMode,
    effectiveFormatValue,
    effectiveFormatDelta,
    opts.colorScheme1,
    opts.colorScheme2,
    opts.enableComp1,
    opts.enableComp2,
    opts.deltaFormat1,
    opts.deltaFormat2,
    opts.fmtComp1,
    opts.fmtComp2,
    opts.fmtDelta1,
    opts.fmtDelta2,
    opts.showDelta1,
    opts.showDelta2,
    delta1Raw,
    delta2Raw,
  );

  // Attach raw numeric values for CSV export (no formatting)
  summary.rawValue = metric;
  if (comp1 != null) summary.rawComp1 = comp1;
  if (comp2 != null) summary.rawComp2 = comp2;
  // Delta: use pre-computed SQL delta if available, otherwise metric - comp
  if (delta1Raw != null) {
    summary.rawComp1Delta = delta1Raw;
  } else if (comp1 != null) {
    summary.rawComp1Delta = isPercentMode ? metric - comp1 : metric - comp1;
  }
  if (delta2Raw != null) {
    summary.rawComp2Delta = delta2Raw;
  } else if (comp2 != null) {
    summary.rawComp2Delta = isPercentMode ? metric - comp2 : metric - comp2;
  }

  return { name, summary, rawMetric };
}
