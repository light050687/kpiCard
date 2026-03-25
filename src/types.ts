import { QueryFormData, QueryFormMetric, supersetTheme } from '@superset-ui/core';

// ═══════════════════════════════════════
// Enums & Utility Types
// ═══════════════════════════════════════

/** Status direction for delta pills */
export type DeltaStatus = 'up' | 'dn' | 'wn' | 'neutral';

/** Whether "up" is good (revenue) or bad (expenses) */
export type ComparisonColorScheme = 'green_up' | 'green_down';

/** Aggregation strategy for numeric values (kept for KpiCard/DetailModal compatibility) */
export type AggregationType = 'SUM' | 'PERCENT' | 'AVERAGE' | 'MAX' | 'MIN';

/** How deltas are formatted — known keywords or arbitrary suffix text */
export type DeltaFormat = 'auto' | 'percent' | 'pp' | 'absolute' | (string & {});

/** Hierarchy grouping direction */
export type HierarchyMode = 'primary' | 'secondary';

/** Component data state per Design System v2.0 (6 mandatory states) */
export type DataState = 'loading' | 'error' | 'empty' | 'partial' | 'stale' | 'populated';

// ═══════════════════════════════════════
// Form Data (controlPanel → buildQuery → transformProps)
// ═══════════════════════════════════════

/**
 * Form data from Superset control panel (camelCase).
 *
 * controlPanel.tsx uses snake_case names (metric_a, metric_plan_a, …).
 * Superset auto-converts them to camelCase in chartProps.formData.
 * buildQuery.ts receives the original snake_case keys.
 */
export interface KpiCardFormData extends QueryFormData {
  // ── Query — Mode A metrics ──
  // controlPanel: metric_a → camelCase: metricA
  metricA: QueryFormMetric;
  metricPlanA?: QueryFormMetric;
  metricComp2A?: QueryFormMetric;

  // ── Query — Mode B metrics ──
  metricB?: QueryFormMetric;
  metricPlanB?: QueryFormMetric;
  metricComp2B?: QueryFormMetric;

  // ── Card display ──
  headerText?: string;
  autoFormatRussian: boolean;

  // ── Modes ──
  modeCount: 'single' | 'dual';
  toggleLabelA?: string;
  toggleLabelB?: string;
  subtitleA?: string;
  subtitleB?: string;
  numberFormatA?: string;
  numberFormatB?: string;

  // ── Color schemes (per comparison type × per mode) ──
  // controlPanel: color_scheme_1a → lodash camelCase → colorScheme1A
  colorScheme1A: ComparisonColorScheme;
  colorScheme1B: ComparisonColorScheme;
  colorScheme2A: ComparisonColorScheme;
  colorScheme2B: ComparisonColorScheme;

  // ── Delta format (per comparison type × per mode) ──
  // controlPanel: delta_format_1a → lodash camelCase → deltaFormat1A
  deltaFormat1A: DeltaFormat;
  deltaFormat2A: DeltaFormat;
  deltaFormat1B: DeltaFormat;
  deltaFormat2B: DeltaFormat;

  // ── Delta metric (optional — user-provided delta value from SQL) ──
  metricDelta1A?: QueryFormMetric;
  metricDelta2A?: QueryFormMetric;
  metricDelta1B?: QueryFormMetric;
  metricDelta2B?: QueryFormMetric;

  // ── Per-value suffixes — Mode A ──
  // controlPanel: suffix_main_a → lodash camelCase → suffixMainA
  suffixMainA?: string;
  suffixComp1A?: string;
  suffixComp2A?: string;
  suffixDelta1A?: string;
  suffixDelta2A?: string;
  // ── Per-value decimals — Mode A ──
  decimalsMainA?: number;
  decimalsComp1A?: number;
  decimalsComp2A?: number;
  decimalsDelta1A?: number;
  decimalsDelta2A?: number;
  // ── Per-value suffixes — Mode B ──
  suffixMainB?: string;
  suffixComp1B?: string;
  suffixComp2B?: string;
  suffixDelta1B?: string;
  suffixDelta2B?: string;
  // ── Per-value decimals — Mode B ──
  decimalsMainB?: number;
  decimalsComp1B?: number;
  decimalsComp2B?: number;
  decimalsDelta1B?: number;
  decimalsDelta2B?: number;

  // ── Detail column names ──
  detailColFact?: string;
  detailColComp1?: string;
  detailColDelta1?: string;
  detailColComp2?: string;
  detailColDelta2?: string;

  // ── Comparisons ──
  enableComp1: boolean;
  enableComp2: boolean;
  comp1Label?: string;
  comp2Label?: string;

  // ── Delta visibility (per comparison) ──
  // controlPanel: show_delta_1 → lodash camelCase → showDelta1
  showDelta1: boolean;
  showDelta2: boolean;

  // ── Detail / Drill-Down ──
  groupbyPrimary?: string;
  groupbySecondary?: string;
  hierarchyLabelPrimary?: string;
  hierarchyLabelSecondary?: string;
  detailTopN: number;
  detailPageSize: number;
}

// ═══════════════════════════════════════
// Display Data (transformProps → KpiCard)
// ═══════════════════════════════════════

/** Single comparison item (generic — comp1 or comp2) */
export interface ComparisonItem {
  label: string;
  value: string;
  delta: string;
  status: DeltaStatus;
  /** Identifies comparison kind — used for enable/disable filtering */
  type?: 'comp1' | 'comp2';
  /** Raw numeric diff (current - reference) — for re-formatting at render time */
  rawDiff?: number;
  /** Raw reference value — for re-formatting at render time */
  rawRef?: number;
}

/** Data for one KPI view mode (Mode A or Mode B) */
export interface KpiViewData {
  value: string;
  subtitle: string;
  comparisons: ComparisonItem[];
}

// ═══════════════════════════════════════
// Detail Modal — Raw & Formatted
// ═══════════════════════════════════════

/**
 * @deprecated Replaced by server-side GROUP BY aggregation.
 * Raw numeric row from query — before aggregation/formatting.
 */
export interface RawDetailRow {
  primaryGroup: string;
  secondaryGroup: string;
  metricValue: number;
  comp1Value: number | null;
  comp2Value: number | null;
  /** User-provided delta value from SQL (metric_delta_1a) */
  delta1Value: number | null;
  /** User-provided delta value from SQL (metric_delta_2a) */
  delta2Value: number | null;
}

/**
 * @deprecated Replaced by server-side GROUP BY aggregation.
 * Raw detail data passed from transformProps to component.
 */
export interface DetailDataRaw {
  rows: RawDetailRow[];
}

/** Parameters for lazy-loading detail data via SupersetClient */
export interface DetailQueryParams {
  datasourceId: number;
  datasourceType: string;
  groupbyPrimary?: string;
  groupbySecondary?: string;
  /** All metric labels for Mode A (main + comp1 + comp2 + delta1 + delta2) */
  metricLabelsA: string[];
  /** All metric labels for Mode B */
  metricLabelsB: string[];
  /** Raw metrics for Mode A (QueryFormMetric objects for API payload) */
  metricsA: QueryFormMetric[];
  /** Raw metrics for Mode B */
  metricsB: QueryFormMetric[];
  timeRange?: string;
  granularity?: string;
  /** Simple filters converted from adhoc_filters ({col, op, val} format) */
  filters: Array<{ col: string; op: string; val?: unknown }>;
  extras: Record<string, unknown>;
  /** Comp/delta metric labels for formatServerRow */
  comp1LabelA: string | null;
  comp2LabelA: string | null;
  delta1LabelA: string | null;
  delta2LabelA: string | null;
  comp1LabelB: string | null;
  comp2LabelB: string | null;
  delta1LabelB: string | null;
  delta2LabelB: string | null;
  metricALabel: string;
  metricBLabel: string;
}

/** Single formatted row in the detail drill-down table */
export interface DetailRow {
  name: string;
  value: string;
  comp1Value?: string;
  comp1Delta?: string;
  comp1Status?: DeltaStatus;
  comp2Value?: string;
  comp2Delta?: string;
  comp2Status?: DeltaStatus;
  /** Raw numeric values for CSV export (no formatting) */
  rawValue?: number;
  rawComp1?: number;
  rawComp1Delta?: number;
  rawComp2?: number;
  rawComp2Delta?: number;
}

/** Expandable group with aggregated summary and child rows */
export interface DetailGroup {
  name: string;
  summary: DetailRow;
  children: DetailRow[];
}

// ═══════════════════════════════════════
// Legacy (kept for backward compatibility with stories)
// ═══════════════════════════════════════

/** Pre-computed hierarchical data — used in Storybook mock data */
export interface DetailData {
  bySegment: DetailGroup[];
  byStore: DetailGroup[];
}

// ═══════════════════════════════════════
// Component Props
// ═══════════════════════════════════════

/** Transformed props passed to the KpiCard component */
export interface KpiCardProps {
  width: number;
  height: number;
  headerText: string;

  // ── Mode ──
  modeCount: 'single' | 'dual';
  toggleLabelA: string;
  toggleLabelB: string;

  // ── Views ──
  modeAView: KpiViewData;
  modeBView: KpiViewData;

  // ── Color schemes (per comparison type × per mode) ──
  colorScheme1A: ComparisonColorScheme;
  colorScheme1B: ComparisonColorScheme;
  colorScheme2A: ComparisonColorScheme;
  colorScheme2B: ComparisonColorScheme;

  // ── Delta format (per comparison type × per mode) ──
  deltaFormat1A: DeltaFormat;
  deltaFormat2A: DeltaFormat;
  deltaFormat1B: DeltaFormat;
  deltaFormat2B: DeltaFormat;

  // ── Per-value formatters (suffix + decimals baked in) ──
  formatComp1A: (n: number) => string;
  formatComp2A: (n: number) => string;
  formatDelta1A: (n: number) => string;
  formatDelta2A: (n: number) => string;
  formatComp1B: (n: number) => string;
  formatComp2B: (n: number) => string;
  formatDelta1B: (n: number) => string;
  formatDelta2B: (n: number) => string;

  // ── Detail column names ──
  detailColFact: string;
  detailColComp1: string;
  detailColDelta1: string;
  detailColComp2: string;
  detailColDelta2: string;

  // ── Comparison visibility & labels ──
  enableComp1: boolean;
  enableComp2: boolean;
  comp1Label: string;
  comp2Label: string;

  // ── Delta visibility (per comparison) ──
  showDelta1: boolean;
  showDelta2: boolean;

  // ── Hierarchy labels ──
  hierarchyLabelPrimary: string;
  hierarchyLabelSecondary: string;

  // ── Data state (Design System v2.0: 6 mandatory states) ──
  dataState: DataState;

  // ── Theme ──
  isDarkMode: boolean;
  theme: typeof supersetTheme;

  // ── Detail data (raw rows for on-the-fly aggregation) ──
  /** Parameters for lazy-loading detail data via SupersetClient */
  detailQueryParams?: DetailQueryParams;

  // ── Formatting functions ──
  formatValueA: (n: number) => string;
  formatValueB: (n: number) => string;
  formatDelta: (n: number) => string;

  // ── TOP N & Pagination ──
  detailTopN: number;
  detailPageSize: number;
}
