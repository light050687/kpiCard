import {
  ChartProps,
  getNumberFormatter,
  NumberFormats,
} from '@superset-ui/core';
import {
  KpiCardFormData,
  KpiCardProps,
  KpiViewData,
  ComparisonItem,
  DeltaStatus,
  DeltaFormat,
  ComparisonColorScheme,
  AggregationType,
  DetailDataRaw,
  RawDetailRow,
} from '../types';
import {
  formatRussianSmart,
  formatRussianPercent,
  formatRussianPP,
  formatDeltaByFormat,
} from '../utils/formatRussian';

// ═══════════════════════════════════════
// Helpers
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
  return isPositive ? 'dn' : 'up';
}

function extractMetricValue(
  data: Record<string, unknown>[],
  metricKey: string,
): number | null {
  if (!data?.length) return null;
  const val = data[0][metricKey];
  return val != null ? Number(val) : null;
}

function getMetricLabel(metric: unknown): string {
  if (typeof metric === 'string') return metric;
  if (metric && typeof metric === 'object' && 'label' in metric) {
    return String((metric as { label: unknown }).label);
  }
  return String(metric);
}

// ═══════════════════════════════════════
// Formatter factory
// ═══════════════════════════════════════

type ValueFormatter = (n: number) => string;

/** Create a value formatter based on format string and Russian flag */
function createValueFormatter(
  formatStr: string | undefined,
  autoRussian: boolean,
): ValueFormatter {
  if (autoRussian && (!formatStr || formatStr === 'RU_SMART')) {
    return formatRussianSmart;
  }
  const d3Fmt = getNumberFormatter(formatStr || NumberFormats.SMART_NUMBER);
  return (n: number) => d3Fmt(n);
}

/** Create a delta formatter for a given aggregation type */
function createDeltaFormatter(
  aggregationType: AggregationType,
  autoRussian: boolean,
): ValueFormatter {
  if (aggregationType === 'PERCENT') {
    return (n: number) => formatRussianPP(n);
  }
  if (autoRussian) {
    return (n: number) => formatRussianPercent(n, true);
  }
  const d3Fmt = getNumberFormatter('+.1%');
  return (n: number) => d3Fmt(n);
}

// ═══════════════════════════════════════
// Mode view builder
// ═══════════════════════════════════════

interface ModeViewParams {
  mainValue: number;
  comp1Value: number | null;
  comp2Value: number | null;
  aggregationType: AggregationType;
  colorScheme1: ComparisonColorScheme;
  colorScheme2: ComparisonColorScheme;
  valueFmt: ValueFormatter;
  subtitle: string;
  enableComp1: boolean;
  enableComp2: boolean;
  comp1Label: string;
  comp2Label: string;
  deltaFormat1: DeltaFormat;
  deltaFormat2: DeltaFormat;
  autoRussian: boolean;
}

/** Format a delta: 'auto' resolves by aggregationType, anything else is literal suffix */
function formatDeltaByType(
  diff: number,
  ref: number,
  fmt: DeltaFormat,
  aggType: AggregationType,
): string {
  const effective =
    fmt === 'auto'
      ? aggType === 'PERCENT'
        ? 'pp'
        : aggType === 'SUM'
          ? 'absolute'
          : 'percent'
      : fmt;
  return formatDeltaByFormat(diff, ref, effective);
}

function buildModeView(params: ModeViewParams): KpiViewData {
  const {
    mainValue, comp1Value, comp2Value,
    aggregationType, colorScheme1, colorScheme2, valueFmt, subtitle,
    enableComp1, enableComp2, comp1Label, comp2Label, deltaFormat1, deltaFormat2, autoRussian,
  } = params;

  const comparisons: ComparisonItem[] = [];

  // Determine hero value
  let heroValue: string;
  if (aggregationType === 'PERCENT' && comp2Value != null && comp2Value !== 0) {
    // PERCENT mode: hero shows the percentage change
    const pctChange = (mainValue - comp2Value) / comp2Value;
    heroValue = formatRussianPercent(pctChange, true);
  } else {
    heroValue = valueFmt(mainValue);
  }

  // ── Comparison 1 ──
  if (enableComp1 && comp1Value != null) {
    const delta = mainValue - comp1Value;
    const status = getDeltaStatus(delta, colorScheme1);
    comparisons.push({
      label: comp1Label,
      value: valueFmt(comp1Value),
      delta: formatDeltaByType(delta, comp1Value, deltaFormat1, aggregationType),
      status,
      type: 'comp1',
      rawDiff: delta,
      rawRef: comp1Value,
    });
  }

  // ── Comparison 2 ──
  if (enableComp2 && comp2Value != null) {
    const delta = mainValue - comp2Value;
    const status = getDeltaStatus(delta, colorScheme2);
    comparisons.push({
      label: comp2Label,
      value: valueFmt(comp2Value),
      delta: formatDeltaByType(delta, comp2Value, deltaFormat2, aggregationType),
      status,
      type: 'comp2',
      rawDiff: delta,
      rawRef: comp2Value,
    });
  }

  return { value: heroValue, subtitle, comparisons };
}

// ═══════════════════════════════════════
// Detail data extraction
// ═══════════════════════════════════════

function extractDetailRows(
  rows: Record<string, unknown>[],
  formData: KpiCardFormData,
  metricLabel: string,
  comp1MetricLabel: string | null,
): DetailDataRaw {
  const primaryCol = formData.groupby_primary;
  const secondaryCol = formData.groupby_secondary;
  const timeComp = formData.time_comparison;
  const offsetKey =
    timeComp && timeComp !== 'none' ? `${metricLabel}__${timeComp}` : null;

  const result: RawDetailRow[] = rows.map(row => ({
    primaryGroup: primaryCol ? String(row[primaryCol] ?? 'N/A') : 'Total',
    secondaryGroup: secondaryCol
      ? String(row[secondaryCol] ?? 'N/A')
      : 'Total',
    metricValue: Number(row[metricLabel] ?? 0),
    comp1Value: comp1MetricLabel ? Number(row[comp1MetricLabel] ?? 0) : null,
    comp2Value: offsetKey ? Number(row[offsetKey] ?? 0) : null,
  }));

  return { rows: result };
}

// ═══════════════════════════════════════
// Main transform
// ═══════════════════════════════════════

export default function transformProps(chartProps: ChartProps): KpiCardProps {
  const { width, height, formData: rawFormData, queriesData, theme } =
    chartProps;
  const formData = rawFormData as KpiCardFormData;

  // ── Defaults ──
  const autoRussian = formData.auto_format_russian ?? true;
  const enableComp1 = formData.enable_comp1 ?? true;
  const enableComp2 = formData.enable_comp2 ?? true;
  const modeCount = formData.mode_count || 'dual';
  const aggregationTypeA = formData.aggregation_type_a || 'SUM';
  const aggregationTypeB = formData.aggregation_type_b || 'PERCENT';
  const colorScheme1A = formData.color_scheme_1a || 'green_up';
  const colorScheme1B = formData.color_scheme_1b || 'green_up';
  const colorScheme2A = formData.color_scheme_2a || 'green_up';
  const colorScheme2B = formData.color_scheme_2b || 'green_up';
  const deltaFormat1A: DeltaFormat = formData.delta_format_1a || 'auto';
  const deltaFormat2A: DeltaFormat = formData.delta_format_2a || 'auto';
  const deltaFormat1B: DeltaFormat = formData.delta_format_1b || 'auto';
  const deltaFormat2B: DeltaFormat = formData.delta_format_2b || 'auto';
  const comp1Label = formData.comp1_label || 'План:';
  const comp2Label = formData.comp2_label || 'ПГ:';

  // ── Formatters ──
  const formatValueA = createValueFormatter(formData.number_format_a, autoRussian);
  const formatValueB = createValueFormatter(formData.number_format_b, autoRussian);
  const formatDelta = createDeltaFormatter(aggregationTypeA, autoRussian);

  // ── Summary data (Query 0) ──
  const summaryData = (queriesData?.[0]?.data as Record<string, unknown>[]) ?? [];
  const metricLabel = getMetricLabel(formData.metric);
  const mainValue = extractMetricValue(summaryData, metricLabel) ?? 0;

  // Comp1 metric (e.g., plan/target)
  const comp1MetricLabel =
    enableComp1 && formData.metric_plan
      ? getMetricLabel(formData.metric_plan)
      : null;
  const comp1Value = comp1MetricLabel
    ? extractMetricValue(summaryData, comp1MetricLabel)
    : null;

  // Comp2 value (e.g., previous period)
  const timeComp = formData.time_comparison;
  let comp2Value: number | null = null;
  if (enableComp2 && timeComp && timeComp !== 'none' && summaryData.length > 0) {
    const offsetKey = `${metricLabel}__${timeComp}`;
    comp2Value = extractMetricValue(summaryData, offsetKey);
  }

  // ── Build Mode A view ──
  const modeAView = buildModeView({
    mainValue, comp1Value, comp2Value,
    aggregationType: aggregationTypeA,
    colorScheme1: colorScheme1A, colorScheme2: colorScheme2A,
    valueFmt: formatValueA,
    subtitle: formData.subtitle_a || '',
    enableComp1, enableComp2, comp1Label, comp2Label,
    deltaFormat1: deltaFormat1A, deltaFormat2: deltaFormat2A, autoRussian,
  });

  // ── Build Mode B view ──
  const modeBView = buildModeView({
    mainValue, comp1Value, comp2Value,
    aggregationType: aggregationTypeB,
    colorScheme1: colorScheme1B, colorScheme2: colorScheme2B,
    valueFmt: formatValueB,
    subtitle: formData.subtitle_b || '',
    enableComp1, enableComp2, comp1Label, comp2Label,
    deltaFormat1: deltaFormat1B, deltaFormat2: deltaFormat2B, autoRussian,
  });

  // ── Detail data (Query 1, if present) ──
  let detailDataRaw: DetailDataRaw | undefined;
  if (queriesData && queriesData.length > 1 && queriesData[1]?.data) {
    const detailRows = queriesData[1].data as Record<string, unknown>[];
    if (detailRows.length > 0) {
      detailDataRaw = extractDetailRows(
        detailRows, formData, metricLabel, comp1MetricLabel,
      );
    }
  }

  // ── Detect dark mode from Superset theme ──
  const isDarkMode = theme
    ? theme.colors.grayscale.light5 !== '#F5F5F5'
    : false;

  return {
    width,
    height,
    headerText: formData.header_text || metricLabel || 'KPI',

    // Mode
    modeCount,
    toggleLabelA: formData.toggle_label_a || '₽',
    toggleLabelB: formData.toggle_label_b || '%',

    // Views
    modeAView,
    modeBView,

    // Color schemes (per comparison type × per mode)
    colorScheme1A,
    colorScheme1B,
    colorScheme2A,
    colorScheme2B,

    // Delta format (per comparison type × per mode)
    deltaFormat1A,
    deltaFormat2A,
    deltaFormat1B,
    deltaFormat2B,

    // Comparisons
    enableComp1,
    enableComp2,
    comp1Label,
    comp2Label,

    // Hierarchy
    hierarchyLabelPrimary: formData.hierarchy_label_primary || 'Сегмент',
    hierarchyLabelSecondary: formData.hierarchy_label_secondary || 'Магазин',

    // Theme
    isDarkMode,
    theme,

    // Detail
    detailDataRaw,
    aggregationTypeA,
    aggregationTypeB,

    // Formatters
    formatValueA,
    formatValueB,
    formatDelta,

    // Top N
    detailTopN: formData.detail_top_n ?? 0,
  };
}
