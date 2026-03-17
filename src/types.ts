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

/** How deltas are formatted — known keywords or arbitrary suffix text */
export type DeltaFormat = 'auto' | 'percent' | 'pp' | 'absolute' | (string & {});

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
  toggle_label_a?: string;
  toggle_label_b?: string;
  subtitle_a?: string;
  subtitle_b?: string;
  number_format_a?: string;
  number_format_b?: string;
  aggregation_type_a: AggregationType;
  aggregation_type_b: AggregationType;

  // ── Color schemes (per comparison type × per mode) ──
  color_scheme_1a: ComparisonColorScheme;
  color_scheme_1b: ComparisonColorScheme;
  color_scheme_2a: ComparisonColorScheme;
  color_scheme_2b: ComparisonColorScheme;

  // ── Delta format (per comparison type × per mode) ──
  delta_format_1a: DeltaFormat;
  delta_format_2a: DeltaFormat;
  delta_format_1b: DeltaFormat;
  delta_format_2b: DeltaFormat;

  // ── Comparisons ──
  enable_comp1: boolean;
  enable_comp2: boolean;
  comp1_label?: string;
  comp2_label?: string;
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

/** Raw numeric row from query — before aggregation/formatting */
export interface RawDetailRow {
  primaryGroup: string;
  secondaryGroup: string;
  metricValue: number;
  comp1Value: number | null;
  comp2Value: number | null;
}

/** Raw detail data passed from transformProps to component */
export interface DetailDataRaw {
  rows: RawDetailRow[];
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

  // ── Comparison visibility & labels ──
  enableComp1: boolean;
  enableComp2: boolean;
  comp1Label: string;
  comp2Label: string;

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
