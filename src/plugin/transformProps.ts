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
  ComparisonColorScheme,
  AggregationType,
  DetailDataRaw,
  RawDetailRow,
} from '../types';
import {
  formatRussianSmart,
  formatRussianPercent,
  formatRussianPP,
  formatRussianDeltaAbs,
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
  planValue: number | null;
  prevValue: number | null;
  aggregationType: AggregationType;
  colorScheme: ComparisonColorScheme;
  valueFmt: ValueFormatter;
  subtitle: string;
  enablePlan: boolean;
  enableYoy: boolean;
  planLabel: string;
  yoyLabel: string;
  autoRussian: boolean;
}

function buildModeView(params: ModeViewParams): KpiViewData {
  const {
    mainValue, planValue, prevValue,
    aggregationType, colorScheme, valueFmt, subtitle,
    enablePlan, enableYoy, planLabel, yoyLabel, autoRussian,
  } = params;

  const comparisons: ComparisonItem[] = [];

  // Determine hero value
  let heroValue: string;
  if (aggregationType === 'PERCENT' && prevValue != null && prevValue !== 0) {
    // PERCENT mode: hero shows the percentage change
    const pctChange = (mainValue - prevValue) / prevValue;
    heroValue = formatRussianPercent(pctChange, true);
  } else {
    heroValue = valueFmt(mainValue);
  }

  // ── Plan comparison ──
  if (enablePlan && planValue != null) {
    const planDelta = mainValue - planValue;
    const status = getDeltaStatus(planDelta, colorScheme);

    if (aggregationType === 'PERCENT') {
      // Delta in percentage points
      comparisons.push({
        label: planLabel,
        value: valueFmt(planValue),
        delta: formatRussianPP(planDelta),
        status,
        type: 'plan',
      });
    } else {
      const pctDelta = planValue !== 0 ? planDelta / planValue : 0;
      comparisons.push({
        label: planLabel,
        value: valueFmt(planValue),
        delta: autoRussian
          ? formatRussianDeltaAbs(planDelta)
          : formatRussianPercent(pctDelta, true),
        status,
        type: 'plan',
      });
    }
  }

  // ── YoY comparison ──
  if (enableYoy && prevValue != null) {
    const yoyDelta = mainValue - prevValue;
    const status = getDeltaStatus(yoyDelta, colorScheme);

    if (aggregationType === 'PERCENT') {
      comparisons.push({
        label: yoyLabel,
        value: valueFmt(prevValue),
        delta: formatRussianPP(yoyDelta),
        status,
        type: 'yoy',
      });
    } else {
      const pctDelta = prevValue !== 0 ? yoyDelta / prevValue : 0;
      comparisons.push({
        label: yoyLabel,
        value: valueFmt(prevValue),
        delta: formatRussianPercent(pctDelta, true),
        status,
        type: 'yoy',
      });
    }
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
  planLabel: string | null,
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
    planValue: planLabel ? Number(row[planLabel] ?? 0) : null,
    prevValue: offsetKey ? Number(row[offsetKey] ?? 0) : null,
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
  const enablePlan = formData.enable_plan ?? true;
  const enableYoy = formData.enable_yoy ?? true;
  const modeCount = formData.mode_count || 'dual';
  const aggregationTypeA = formData.aggregation_type_a || 'SUM';
  const aggregationTypeB = formData.aggregation_type_b || 'PERCENT';
  const colorSchemeA = formData.color_scheme_a || 'green_up';
  const colorSchemeB = formData.color_scheme_b || 'green_up';
  const planLabel = formData.plan_label || 'План:';
  const yoyLabel = formData.yoy_label || 'ПГ:';

  // ── Formatters ──
  const formatValueA = createValueFormatter(formData.number_format_a, autoRussian);
  const formatValueB = createValueFormatter(formData.number_format_b, autoRussian);
  const formatDelta = createDeltaFormatter(aggregationTypeA, autoRussian);

  // ── Summary data (Query 0) ──
  const summaryData = (queriesData?.[0]?.data as Record<string, unknown>[]) ?? [];
  const metricLabel = getMetricLabel(formData.metric);
  const mainValue = extractMetricValue(summaryData, metricLabel) ?? 0;

  // Plan metric
  const planMetricLabel =
    enablePlan && formData.metric_plan
      ? getMetricLabel(formData.metric_plan)
      : null;
  const planValue = planMetricLabel
    ? extractMetricValue(summaryData, planMetricLabel)
    : null;

  // Previous period value
  const timeComp = formData.time_comparison;
  let prevValue: number | null = null;
  if (enableYoy && timeComp && timeComp !== 'none' && summaryData.length > 0) {
    const offsetKey = `${metricLabel}__${timeComp}`;
    prevValue = extractMetricValue(summaryData, offsetKey);
  }

  // ── Build Mode A view ──
  const modeAView = buildModeView({
    mainValue, planValue, prevValue,
    aggregationType: aggregationTypeA,
    colorScheme: colorSchemeA,
    valueFmt: formatValueA,
    subtitle: formData.subtitle_a || '',
    enablePlan, enableYoy, planLabel, yoyLabel, autoRussian,
  });

  // ── Build Mode B view ──
  const modeBView = buildModeView({
    mainValue, planValue, prevValue,
    aggregationType: aggregationTypeB,
    colorScheme: colorSchemeB,
    valueFmt: formatValueB,
    subtitle: formData.subtitle_b || '',
    enablePlan, enableYoy, planLabel, yoyLabel, autoRussian,
  });

  // ── Detail data (Query 1, if present) ──
  let detailDataRaw: DetailDataRaw | undefined;
  if (queriesData && queriesData.length > 1 && queriesData[1]?.data) {
    const detailRows = queriesData[1].data as Record<string, unknown>[];
    if (detailRows.length > 0) {
      detailDataRaw = extractDetailRows(
        detailRows, formData, metricLabel, planMetricLabel,
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
    modeAName: formData.mode_a_name || 'Рубли',
    modeBName: formData.mode_b_name || 'Проценты',
    toggleLabelA: formData.toggle_label_a || '₽',
    toggleLabelB: formData.toggle_label_b || '%',

    // Views
    modeAView,
    modeBView,

    // Colors
    colorSchemeA,
    colorSchemeB,

    // Comparisons
    enablePlan,
    enableYoy,

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
