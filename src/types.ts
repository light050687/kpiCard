import { QueryFormData, supersetTheme } from '@superset-ui/core';

// ═══════════════════════════════════════
// Enums & Utility Types
// ═══════════════════════════════════════

/** Status direction for delta pills */
export type DeltaStatus = 'up' | 'dn' | 'wn' | 'neutral';

/** Whether "up" is good (revenue) or bad (expenses) */
export type ComparisonColorScheme = 'green_up' | 'green_down';

/** Aggregation strategy for numeric values */
export type AggregationType = 'SUM' | 'PERCENT' | 'AVERAGE' | 'MAX' | 'MIN';

/** Hierarchy grouping direction */
export type HierarchyMode = 'primary' | 'secondary';

// ═══════════════════════════════════════
// Form Data (controlPanel → buildQuery → transformProps)
// ═══════════════════════════════════════

/** Form data from Superset control panel */
export interface KpiCardFormData extends QueryFormData {
  // ── Query ──
  metric: string;
  metric_plan?: string;

  // ── Card display ──
  header_text?: string;
  auto_format_russian: boolean;

  // ── Modes ──
  mode_count: 'single' | 'dual';
  mode_a_name?: string;
  mode_b_name?: string;
  toggle_label_a?: string;
  toggle_label_b?: string;
  subtitle_a?: string;
  subtitle_b?: string;
  number_format_a?: string;
  number_format_b?: string;
  aggregation_type_a: AggregationType;
  aggregation_type_b: AggregationType;
  color_scheme_a: ComparisonColorScheme;
  color_scheme_b: ComparisonColorScheme;

  // ── Comparisons ──
  enable_plan: boolean;
  enable_yoy: boolean;
  plan_label?: string;
  yoy_label?: string;
  time_comparison?: string;

  // ── Detail / Drill-Down ──
  groupby_primary?: string;
  groupby_secondary?: string;
  hierarchy_label_primary?: string;
  hierarchy_label_secondary?: string;
  detail_top_n: number;
}

// ═══════════════════════════════════════
// Display Data (transformProps → KpiCard)
// ═══════════════════════════════════════

/** Single comparison item (Plan or YoY row) */
export interface ComparisonItem {
  label: string;
  value: string;
  delta: string;
  status: DeltaStatus;
  /** Identifies comparison kind — used for enablePlan/enableYoy filtering */
  type?: 'plan' | 'yoy';
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

/** Raw numeric row from query — before aggregation/formatting */
export interface RawDetailRow {
  primaryGroup: string;
  secondaryGroup: string;
  metricValue: number;
  planValue: number | null;
  prevValue: number | null;
}

/** Raw detail data passed from transformProps to component */
export interface DetailDataRaw {
  rows: RawDetailRow[];
}

/** Single formatted row in the detail drill-down table */
export interface DetailRow {
  name: string;
  value: string;
  planValue?: string;
  planDelta?: string;
  planStatus?: DeltaStatus;
  prevValue?: string;
  prevDelta?: string;
  prevStatus?: DeltaStatus;
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
  modeAName: string;
  modeBName: string;
  toggleLabelA: string;
  toggleLabelB: string;

  // ── Views ──
  modeAView: KpiViewData;
  modeBView: KpiViewData;

  // ── Color schemes per mode ──
  colorSchemeA: ComparisonColorScheme;
  colorSchemeB: ComparisonColorScheme;

  // ── Comparison visibility ──
  enablePlan: boolean;
  enableYoy: boolean;

  // ── Hierarchy labels ──
  hierarchyLabelPrimary: string;
  hierarchyLabelSecondary: string;

  // ── Theme ──
  isDarkMode: boolean;
  theme: typeof supersetTheme;

  // ── Detail data (raw rows for on-the-fly aggregation) ──
  detailDataRaw?: DetailDataRaw;
  aggregationTypeA: AggregationType;
  aggregationTypeB: AggregationType;

  // ── Formatting functions ──
  formatValueA: (n: number) => string;
  formatValueB: (n: number) => string;
  formatDelta: (n: number) => string;

  // ── TOP N ──
  detailTopN: number;
}
