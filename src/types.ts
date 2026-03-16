import { QueryFormData, supersetTheme } from '@superset-ui/core';

/** Status direction for delta pills */
export type DeltaStatus = 'up' | 'dn' | 'wn' | 'neutral';

/** Whether "up" is good (revenue) or bad (expenses) */
export type ComparisonColorScheme = 'green_up' | 'green_down';

/** Form data specific to KPI Card plugin */
export interface KpiCardFormData extends QueryFormData {
  metric: string;
  metric_plan?: string;
  header_text?: string;
  subheader_text?: string;
  subheader_text_pct?: string;
  number_format?: string;
  number_format_secondary?: string;
  comparison_color_scheme: ComparisonColorScheme;
  time_comparison?: string;
  toggle_mode: 'none' | 'abs_pct';
  toggle_label_abs?: string;
  toggle_label_pct?: string;
  plan_label?: string;
  comparison_label?: string;
}

/** Single comparison item data */
export interface ComparisonItem {
  label: string;
  value: string;
  delta: string;
  status: DeltaStatus;
}

/** Data for one KPI view mode (abs or pct) */
export interface KpiViewData {
  value: string;
  subtitle: string;
  comparisons: ComparisonItem[];
}

/** Single row in the detail drill-down table */
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

/** Hierarchy grouping direction */
export type HierarchyMode = 'segment' | 'store';

/** Pre-computed hierarchical data for both grouping modes */
export interface DetailData {
  bySegment: DetailGroup[];
  byStore: DetailGroup[];
}

/** Transformed props passed to the KpiCard component */
export interface KpiCardProps {
  width: number;
  height: number;
  headerText: string;
  toggleMode: 'none' | 'abs_pct';
  toggleLabelAbs: string;
  toggleLabelPct: string;
  absView: KpiViewData;
  pctView: KpiViewData;
  isDarkMode: boolean;
  theme: typeof supersetTheme;
  /** Optional hierarchical detail data — enables click-to-drilldown modal */
  detailData?: DetailData;
}
