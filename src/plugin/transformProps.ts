import {
  ChartProps,
  getMetricLabel,
  getNumberFormatter,
  NumberFormats,
  QueryFormMetric,
} from '@superset-ui/core';
import { getPreset } from '../mocks/presets';
import {
  KpiCardFormData,
  KpiCardProps,
  KpiViewData,
  ComparisonItem,
  DataState,
  DeltaStatus,
  DeltaFormat,
  ComparisonColorScheme,
  DetailQueryParams,
} from '../types';
import {
  formatRussianSmart,
  formatRussianSmartEx,
  formatRussianPercent,
  formatRussianDeltaAbsEx,
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
  return colorScheme === 'green_up'
    ? (isPositive ? 'up' : 'dn')
    : (isPositive ? 'dn' : 'up');
}

function extractMetricValue(
  data: Record<string, unknown>[],
  metricKey: string,
): number | null {
  if (!data?.length) return null;
  const val = data[0][metricKey];
  return val != null ? Number(val) : null;
}

// ═══════════════════════════════════════
// Formatter factory
// ═══════════════════════════════════════

type ValueFormatter = (n: number) => string;

// @ts-ignore TS6133 — kept for potential future use with generic format
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

function createDeltaFormatter(autoRussian: boolean): ValueFormatter {
  if (autoRussian) {
    return (n: number) => formatRussianPercent(n, true);
  }
  const d3Fmt = getNumberFormatter('+.1%');
  return (n: number) => d3Fmt(n);
}

// ═══════════════════════════════════════
// Mode view builder (identical logic for A and B)
// ═══════════════════════════════════════

interface ModeViewParams {
  mainValue: number;
  comp1Value: number | null;
  comp2Value: number | null;
  colorScheme1: ComparisonColorScheme;
  colorScheme2: ComparisonColorScheme;
  subtitle: string;
  enableComp1: boolean;
  enableComp2: boolean;
  comp1Label: string;
  comp2Label: string;
  deltaValue1: number | null;
  deltaValue2: number | null;
  fmtMain: ValueFormatter;
  fmtComp1: ValueFormatter;
  fmtComp2: ValueFormatter;
  fmtDelta1: ValueFormatter;
  fmtDelta2: ValueFormatter;
}

function buildModeView(params: ModeViewParams): KpiViewData {
  const {
    mainValue, comp1Value, comp2Value,
    colorScheme1, colorScheme2, subtitle,
    enableComp1, enableComp2, comp1Label, comp2Label,
    deltaValue1, deltaValue2,
    fmtMain, fmtComp1, fmtComp2, fmtDelta1, fmtDelta2,
  } = params;

  const heroValue = fmtMain(mainValue);
  const comparisons: ComparisonItem[] = [];

  // ── Comparison 1 ──
  if (enableComp1 && comp1Value != null) {
    const hasDelta = deltaValue1 != null;
    const delta = hasDelta ? deltaValue1 : 0;
    const status = hasDelta ? getDeltaStatus(delta, colorScheme1) : 'neutral';
    comparisons.push({
      label: comp1Label,
      value: fmtComp1(comp1Value),
      delta: hasDelta ? fmtDelta1(delta) : '',
      status,
      type: 'comp1',
      rawDiff: hasDelta ? delta : undefined,
      rawRef: hasDelta ? comp1Value : undefined,
    });
  }

  // ── Comparison 2 ──
  if (enableComp2 && comp2Value != null) {
    const hasDelta = deltaValue2 != null;
    const delta = hasDelta ? deltaValue2 : 0;
    const status = hasDelta ? getDeltaStatus(delta, colorScheme2) : 'neutral';
    comparisons.push({
      label: comp2Label,
      value: fmtComp2(comp2Value),
      delta: hasDelta ? fmtDelta2(delta) : '',
      status,
      type: 'comp2',
      rawDiff: hasDelta ? delta : undefined,
      rawRef: hasDelta ? comp2Value : undefined,
    });
  }

  return { value: heroValue, subtitle, comparisons };
}

// ═══════════════════════════════════════
// Metric extraction helper
// ═══════════════════════════════════════

/**
 * Extract a metric value from summary data.
 * Strategy 1: use the label from formData.
 * Strategy 2: find by position in query result keys.
 */
function resolveMetricValue(
  formDataMetric: QueryFormMetric | undefined,
  summaryData: Record<string, unknown>[],
  excludeKeys: Set<string>,
): { label: string | null; value: number | null } {
  // If metric is not configured in controlPanel — return null, NO fallback
  if (!formDataMetric) return { label: null, value: null };
  if (!summaryData.length) return { label: null, value: null };

  // Strategy 1: direct label lookup
  const label = getMetricLabel(formDataMetric);
  const value = extractMetricValue(summaryData, label);
  if (value != null) return { label, value };

  // Strategy 2: fallback to next unused key (backward compat for renamed metrics)
  const row = summaryData[0];
  const nextKey = Object.keys(row).find(k => !excludeKeys.has(k));
  if (nextKey) {
    const val = row[nextKey];
    return { label: nextKey, value: val != null ? Number(val) : null };
  }

  return { label: null, value: null };
}

// ═══════════════════════════════════════
// NOTE: extractDetailRows removed — detail data
// is now fetched and formatted server-side.
// See utils/detailApi.ts for formatServerRow().
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// Main transform
// ═══════════════════════════════════════

export default function transformProps(chartProps: ChartProps): KpiCardProps {
  const { width, height, formData: fd, queriesData, theme } = chartProps;
  const formData = fd as KpiCardFormData;

  // ── Normalize groupby fields (sharedControls.groupby stores arrays even with multi:false) ──
  const groupbyPrimary: string | undefined = Array.isArray(formData.groupbyPrimary)
    ? (formData.groupbyPrimary[0] as string | undefined)
    : formData.groupbyPrimary;
  const groupbySecondary: string | undefined = Array.isArray(formData.groupbySecondary)
    ? (formData.groupbySecondary[0] as string | undefined)
    : formData.groupbySecondary;

  // ── Defaults (camelCase — auto-converted from controlPanel snake_case) ──
  const autoRussian = formData.autoFormatRussian ?? true;
  const enableComp1 = formData.enableComp1 ?? true;
  const enableComp2 = formData.enableComp2 ?? true;
  const modeCount = formData.modeCount || 'dual';
  const colorScheme1A = formData.colorScheme1A || 'green_up';
  const colorScheme1B = formData.colorScheme1B || 'green_up';
  const colorScheme2A = formData.colorScheme2A || 'green_up';
  const colorScheme2B = formData.colorScheme2B || 'green_up';
  const deltaFormat1A: DeltaFormat = formData.deltaFormat1A || 'absolute';
  const deltaFormat2A: DeltaFormat = formData.deltaFormat2A || 'absolute';
  const deltaFormat1B: DeltaFormat = formData.deltaFormat1B || 'absolute';
  const deltaFormat2B: DeltaFormat = formData.deltaFormat2B || 'absolute';
  // ── Per-value suffixes & decimals — Mode A ──
  const suffixMainA = formData.suffixMainA || '';
  const suffixComp1A = formData.suffixComp1A || '';
  const suffixComp2A = formData.suffixComp2A || '';
  const suffixDelta1A = formData.suffixDelta1A || '';
  const suffixDelta2A = formData.suffixDelta2A || '';
  const decimalsMainA = Number(formData.decimalsMainA) >= 0 ? Number(formData.decimalsMainA) : -1;
  const decimalsComp1A = Number(formData.decimalsComp1A) >= 0 ? Number(formData.decimalsComp1A) : -1;
  const decimalsComp2A = Number(formData.decimalsComp2A) >= 0 ? Number(formData.decimalsComp2A) : -1;
  const decimalsDelta1A = Number(formData.decimalsDelta1A) >= 0 ? Number(formData.decimalsDelta1A) : -1;
  const decimalsDelta2A = Number(formData.decimalsDelta2A) >= 0 ? Number(formData.decimalsDelta2A) : -1;
  // ── Per-value suffixes & decimals — Mode B ──
  const suffixMainB = formData.suffixMainB || '';
  const suffixComp1B = formData.suffixComp1B || '';
  const suffixComp2B = formData.suffixComp2B || '';
  const suffixDelta1B = formData.suffixDelta1B || '';
  const suffixDelta2B = formData.suffixDelta2B || '';
  const decimalsMainB = Number(formData.decimalsMainB) >= 0 ? Number(formData.decimalsMainB) : -1;
  const decimalsComp1B = Number(formData.decimalsComp1B) >= 0 ? Number(formData.decimalsComp1B) : -1;
  const decimalsComp2B = Number(formData.decimalsComp2B) >= 0 ? Number(formData.decimalsComp2B) : -1;
  const decimalsDelta1B = Number(formData.decimalsDelta1B) >= 0 ? Number(formData.decimalsDelta1B) : -1;
  const decimalsDelta2B = Number(formData.decimalsDelta2B) >= 0 ? Number(formData.decimalsDelta2B) : -1;

  // ── Detail column names ──
  const detailColFact = formData.detailColFact || 'Факт';
  const detailColComp1 = formData.detailColComp1 || '';
  const detailColDelta1 = formData.detailColDelta1 || 'Дельта';
  const detailColComp2 = formData.detailColComp2 || '';
  const detailColDelta2 = formData.detailColDelta2 || 'Дельта';

  const comp1Label = formData.comp1Label || 'ПЛАН:';
  const comp2Label = formData.comp2Label || 'ПГ:';
  const showDelta1 = formData.showDelta1 ?? true;
  const showDelta2 = formData.showDelta2 ?? true;

  // ── Base formatters ──
  const formatDelta = createDeltaFormatter(autoRussian);

  // ── Per-value formatters (suffix + decimals baked in) ──
  const fmtMainA = (n: number) => formatRussianSmartEx(n, decimalsMainA, suffixMainA);
  const fmtComp1A = (n: number) => formatRussianSmartEx(n, decimalsComp1A, suffixComp1A);
  const fmtComp2A = (n: number) => formatRussianSmartEx(n, decimalsComp2A, suffixComp2A);
  const fmtDelta1A = (n: number) => formatRussianDeltaAbsEx(n, decimalsDelta1A, suffixDelta1A);
  const fmtDelta2A = (n: number) => formatRussianDeltaAbsEx(n, decimalsDelta2A, suffixDelta2A);
  const fmtMainB = (n: number) => formatRussianSmartEx(n, decimalsMainB, suffixMainB);
  const fmtComp1B = (n: number) => formatRussianSmartEx(n, decimalsComp1B, suffixComp1B);
  const fmtComp2B = (n: number) => formatRussianSmartEx(n, decimalsComp2B, suffixComp2B);
  const fmtDelta1B = (n: number) => formatRussianDeltaAbsEx(n, decimalsDelta1B, suffixDelta1B);
  const fmtDelta2B = (n: number) => formatRussianDeltaAbsEx(n, decimalsDelta2B, suffixDelta2B);

  // ── Mock mode: early return with preset data (no dependency on real metrics) ──
  const mockModeEnabled = formData.mockModeEnabled ?? false;
  if (mockModeEnabled) {
    const preset = getPreset(formData.mockPreset, formData.mockCustomJson);

    const isDarkMode = (() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bg = (theme as any)?.colorBgContainer as string | undefined;
      if (!bg || typeof bg !== 'string' || !bg.startsWith('#')) return false;
      const hex = bg.replace('#', '');
      if (hex.length < 6) return false;
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return (r * 299 + g * 587 + b * 114) / 1000 < 128;
    })();

    const mockModeAView = buildModeView({
      mainValue: preset.mainA,
      comp1Value: preset.comp1A,
      comp2Value: preset.comp2A,
      colorScheme1: colorScheme1A,
      colorScheme2: colorScheme2A,
      subtitle: formData.subtitleA || '',
      enableComp1,
      enableComp2,
      comp1Label,
      comp2Label,
      deltaValue1: preset.comp1A != null ? preset.mainA - preset.comp1A : null,
      deltaValue2: preset.comp2A != null ? preset.mainA - preset.comp2A : null,
      fmtMain: fmtMainA,
      fmtComp1: fmtComp1A,
      fmtComp2: fmtComp2A,
      fmtDelta1: fmtDelta1A,
      fmtDelta2: fmtDelta2A,
    });

    const mockModeBView = buildModeView({
      mainValue: preset.mainB,
      comp1Value: preset.comp1B,
      comp2Value: preset.comp2B,
      colorScheme1: colorScheme1B,
      colorScheme2: colorScheme2B,
      subtitle: formData.subtitleB || '',
      enableComp1,
      enableComp2,
      comp1Label,
      comp2Label,
      deltaValue1: preset.comp1B != null ? preset.mainB - preset.comp1B : null,
      deltaValue2: preset.comp2B != null ? preset.mainB - preset.comp2B : null,
      fmtMain: fmtMainB,
      fmtComp1: fmtComp1B,
      fmtComp2: fmtComp2B,
      fmtDelta1: fmtDelta1B,
      fmtDelta2: fmtDelta2B,
    });

    return {
      width,
      height,
      headerText: formData.headerText || preset.label || 'KPI',
      dataState: 'populated' as DataState,
      modeCount,
      toggleLabelA: formData.toggleLabelA || '₽',
      toggleLabelB: formData.toggleLabelB || '%',
      modeAView: mockModeAView,
      modeBView: mockModeBView,
      colorScheme1A, colorScheme1B, colorScheme2A, colorScheme2B,
      deltaFormat1A, deltaFormat2A, deltaFormat1B, deltaFormat2B,
      formatComp1A: fmtComp1A, formatComp2A: fmtComp2A,
      formatDelta1A: fmtDelta1A, formatDelta2A: fmtDelta2A,
      formatComp1B: fmtComp1B, formatComp2B: fmtComp2B,
      formatDelta1B: fmtDelta1B, formatDelta2B: fmtDelta2B,
      detailColFact, detailColComp1, detailColDelta1, detailColComp2, detailColDelta2,
      enableComp1, enableComp2, comp1Label, comp2Label,
      showDelta1, showDelta2,
      hierarchyLabelPrimary: formData.hierarchyLabelPrimary || 'Магазин',
      hierarchyLabelSecondary: formData.hierarchyLabelSecondary || 'Сегмент',
      isDarkMode, theme,
      detailQueryParams: {
        datasourceId: 0,
        datasourceType: 'table',
        groupbyPrimary: groupbyPrimary || 'centrum_code',
        groupbySecondary: groupbySecondary || 'category_code',
        metricsA: [], metricsB: [],
        metricLabelsA: [], metricLabelsB: [],
        filters: [], extras: {},
        metricALabel: '__mock', metricBLabel: '__mock',
        comp1LabelA: null, comp2LabelA: null,
        delta1LabelA: null, delta2LabelA: null,
        comp1LabelB: null, comp2LabelB: null,
        delta1LabelB: null, delta2LabelB: null,
      },
      formatValueA: fmtMainA, formatValueB: fmtMainB, formatDelta,
      detailTopN: Number(formData.detailTopN) || 0,
      detailPageSize: Number(formData.detailPageSize) || 5,
      mockModeEnabled: true,
      mockPreset: formData.mockPreset ?? 'revenue',
      mockCustomJson: formData.mockCustomJson,
    };
  }

  // ── Guard: no metric configured and mock is off → safe empty state ──
  if (!formData.metricA) {
    const isDarkMode = (() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bg = (theme as any)?.colorBgContainer as string | undefined;
      if (!bg || typeof bg !== 'string' || !bg.startsWith('#')) return false;
      const hex = bg.replace('#', '');
      if (hex.length < 6) return false;
      const r = parseInt(hex.slice(0, 2), 16);
      const g2 = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return (r * 299 + g2 * 587 + b * 114) / 1000 < 128;
    })();

    return {
      width, height,
      headerText: formData.headerText || 'KPI',
      dataState: 'empty' as DataState,
      modeCount,
      toggleLabelA: formData.toggleLabelA || '₽',
      toggleLabelB: formData.toggleLabelB || '%',
      modeAView: { value: '—', subtitle: '', comparisons: [] },
      modeBView: { value: '—', subtitle: '', comparisons: [] },
      colorScheme1A, colorScheme1B, colorScheme2A, colorScheme2B,
      deltaFormat1A, deltaFormat2A, deltaFormat1B, deltaFormat2B,
      formatComp1A: fmtComp1A, formatComp2A: fmtComp2A,
      formatDelta1A: fmtDelta1A, formatDelta2A: fmtDelta2A,
      formatComp1B: fmtComp1B, formatComp2B: fmtComp2B,
      formatDelta1B: fmtDelta1B, formatDelta2B: fmtDelta2B,
      detailColFact, detailColComp1, detailColDelta1, detailColComp2, detailColDelta2,
      enableComp1, enableComp2, comp1Label, comp2Label,
      showDelta1, showDelta2,
      hierarchyLabelPrimary: formData.hierarchyLabelPrimary || 'Магазин',
      hierarchyLabelSecondary: formData.hierarchyLabelSecondary || 'Сегмент',
      isDarkMode, theme,
      detailQueryParams: undefined,
      formatValueA: fmtMainA, formatValueB: fmtMainB, formatDelta,
      detailTopN: Number(formData.detailTopN) || 0,
      detailPageSize: Number(formData.detailPageSize) || 20,
      mockModeEnabled: false,
      mockPreset: formData.mockPreset ?? 'revenue',
      mockCustomJson: formData.mockCustomJson,
    };
  }

  // ── Summary data (Query 0) ──
  const summaryData = (queriesData?.[0]?.data as Record<string, unknown>[]) ?? [];

  // ── Mode A metrics ──
  // controlPanel: metric_a → camelCase: metricA
  const metricALabel = formData.metricA ? getMetricLabel(formData.metricA) : '';
  const mainValueA = metricALabel ? (extractMetricValue(summaryData, metricALabel) ?? 0) : 0;

  const usedKeysA = new Set<string>([metricALabel].filter(Boolean));
  const comp1A = resolveMetricValue(formData.metricPlanA, summaryData, usedKeysA);
  if (comp1A.label) usedKeysA.add(comp1A.label);
  const comp2A = resolveMetricValue(formData.metricComp2A, summaryData, usedKeysA);

  // ── Delta metrics Mode A (optional — user-provided delta values) ──
  const delta1ALabel = formData.metricDelta1A ? getMetricLabel(formData.metricDelta1A) : null;
  const deltaValue1A = delta1ALabel ? extractMetricValue(summaryData, delta1ALabel) : null;
  const delta2ALabel = formData.metricDelta2A ? getMetricLabel(formData.metricDelta2A) : null;
  const deltaValue2A = delta2ALabel ? extractMetricValue(summaryData, delta2ALabel) : null;

  // ── Mode B metrics ──
  // If metricB is not set, Mode B is completely empty — no comparisons, no deltas
  const hasModeB = Boolean(formData.metricB);
  const metricBLabel = hasModeB ? getMetricLabel(formData.metricB!) : '';
  const mainValueB = metricBLabel ? (extractMetricValue(summaryData, metricBLabel) ?? 0) : 0;

  const usedKeysB = new Set<string>([metricBLabel].filter(Boolean));
  const comp1B = hasModeB
    ? resolveMetricValue(formData.metricPlanB, summaryData, usedKeysB)
    : { label: null, value: null };
  if (comp1B.label) usedKeysB.add(comp1B.label);
  const comp2B = hasModeB
    ? resolveMetricValue(formData.metricComp2B, summaryData, usedKeysB)
    : { label: null, value: null };

  // ── Delta metrics Mode B ──
  const delta1BLabel = hasModeB && formData.metricDelta1B ? getMetricLabel(formData.metricDelta1B) : null;
  const deltaValue1B = delta1BLabel ? extractMetricValue(summaryData, delta1BLabel) : null;
  const delta2BLabel = hasModeB && formData.metricDelta2B ? getMetricLabel(formData.metricDelta2B) : null;
  const deltaValue2B = delta2BLabel ? extractMetricValue(summaryData, delta2BLabel) : null;

  // ── Build Mode A view ──
  const modeAView = buildModeView({
    mainValue: mainValueA,
    comp1Value: comp1A.value,
    comp2Value: comp2A.value,
    colorScheme1: colorScheme1A,
    colorScheme2: colorScheme2A,
    subtitle: formData.subtitleA || '',
    enableComp1,
    enableComp2,
    comp1Label,
    comp2Label,
    deltaValue1: deltaValue1A,
    deltaValue2: deltaValue2A,
    fmtMain: fmtMainA,
    fmtComp1: fmtComp1A,
    fmtComp2: fmtComp2A,
    fmtDelta1: fmtDelta1A,
    fmtDelta2: fmtDelta2A,
  });

  // ── Build Mode B view ──
  // If Mode B metrics are not configured, show empty view
  const modeBView: KpiViewData = hasModeB
    ? buildModeView({
        mainValue: mainValueB,
        comp1Value: comp1B.value,
        comp2Value: comp2B.value,
        colorScheme1: colorScheme1B,
        colorScheme2: colorScheme2B,
        subtitle: formData.subtitleB || '',
        enableComp1,
        enableComp2,
        comp1Label,
        comp2Label,
        deltaValue1: deltaValue1B,
        deltaValue2: deltaValue2B,
        fmtMain: fmtMainB,
        fmtComp1: fmtComp1B,
        fmtComp2: fmtComp2B,
        fmtDelta1: fmtDelta1B,
        fmtDelta2: fmtDelta2B,
      })
    : { value: '', subtitle: '', comparisons: [] };

  // ── Detail query params (for lazy loading via SupersetClient) ──
  const hasGroupby = Boolean(groupbyPrimary);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ds = (chartProps as any).datasource;
  const dsId = ds?.id ?? (chartProps as any).datasourceId ?? 0;
  const dsType = ds?.type ?? 'table';

  // Collect all non-null metrics for each mode
  const collectMetrics = (metrics: (QueryFormMetric | undefined)[]): QueryFormMetric[] =>
    metrics.filter((m): m is QueryFormMetric => m != null);

  const metricsA = collectMetrics([
    formData.metricA, formData.metricPlanA, formData.metricComp2A,
    formData.metricDelta1A, formData.metricDelta2A,
  ]);
  const metricsB = hasModeB
    ? collectMetrics([formData.metricB, formData.metricPlanB, formData.metricComp2B,
        formData.metricDelta1B, formData.metricDelta2B])
    : [];

  // Convert adhoc_filters → simple {col, op, val} + freeform SQL in extras
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adhocFilters = ((formData.adhoc_filters ?? []) as any[]) as Array<Record<string, unknown>>;
  const simpleFilters: Array<{ col: string; op: string; val?: unknown }> = [];
  const freeformWhere: string[] = [];
  const freeformHaving: string[] = [];

  for (const f of adhocFilters) {
    if (f.expressionType === 'SIMPLE') {
      simpleFilters.push({
        col: f.subject as string,
        op: f.operator as string,
        val: f.comparator,
      });
    } else if (f.expressionType === 'SQL') {
      const sql = `(${f.sqlExpression as string})`;
      if (f.clause === 'HAVING') freeformHaving.push(sql);
      else freeformWhere.push(sql);
    }
  }

  const detailExtras: Record<string, unknown> = {
    ...((formData.extras as Record<string, unknown>) ?? {}),
  };
  if (freeformWhere.length > 0) {
    detailExtras.where = freeformWhere.join(' AND ');
  }
  if (freeformHaving.length > 0) {
    detailExtras.having = freeformHaving.join(' AND ');
  }

  const detailQueryParams: DetailQueryParams | undefined = hasGroupby
    ? {
        datasourceId: dsId,
        datasourceType: dsType,
        groupbyPrimary,
        groupbySecondary,
        metricsA,
        metricsB,
        metricLabelsA: metricsA.map(m => getMetricLabel(m)),
        metricLabelsB: metricsB.map(m => getMetricLabel(m)),
        timeRange: formData.time_range as string | undefined,
        granularity: formData.granularity_sqla as string | undefined,
        filters: simpleFilters,
        extras: detailExtras,
        metricALabel,
        metricBLabel,
        comp1LabelA: comp1A.label,
        comp2LabelA: comp2A.label,
        delta1LabelA: delta1ALabel,
        delta2LabelA: delta2ALabel,
        comp1LabelB: comp1B.label,
        comp2LabelB: comp2B.label,
        delta1LabelB: delta1BLabel,
        delta2LabelB: delta2BLabel,
      }
    : undefined;

  // ── Detect dark mode (mirrors @superset-ui/core isThemeDark via colorBgContainer) ──
  const isDarkMode = (() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bg = (theme as any)?.colorBgContainer as string | undefined;
    if (!bg || typeof bg !== 'string' || !bg.startsWith('#')) return false;
    const hex = bg.replace('#', '');
    if (hex.length < 6) return false;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    // W3C luminance formula (same as tinycolor.isDark threshold 128)
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  })();

  // ── Compute data state (Design System v2.0: 6 mandatory states) ──
  const dataState: DataState = (() => {
    if (!summaryData.length) return 'empty';
    if (mainValueA === 0 && mainValueB === 0) return 'empty';
    if (modeCount === 'dual' && mainValueA !== 0 && mainValueB === 0) return 'partial';
    return 'populated';
  })();

  return {
    width,
    height,
    headerText: formData.headerText || metricALabel || 'KPI',

    // Data state
    dataState,

    // Mode
    modeCount,
    toggleLabelA: formData.toggleLabelA || '₽',
    toggleLabelB: formData.toggleLabelB || '%',

    // Views
    modeAView,
    modeBView,

    // Color schemes
    colorScheme1A,
    colorScheme1B,
    colorScheme2A,
    colorScheme2B,

    // Delta formats
    deltaFormat1A,
    deltaFormat2A,
    deltaFormat1B,
    deltaFormat2B,

    // Per-value formatters
    formatComp1A: fmtComp1A,
    formatComp2A: fmtComp2A,
    formatDelta1A: fmtDelta1A,
    formatDelta2A: fmtDelta2A,
    formatComp1B: fmtComp1B,
    formatComp2B: fmtComp2B,
    formatDelta1B: fmtDelta1B,
    formatDelta2B: fmtDelta2B,

    // Detail column names
    detailColFact,
    detailColComp1,
    detailColDelta1,
    detailColComp2,
    detailColDelta2,

    // Comparisons
    enableComp1,
    enableComp2,
    comp1Label,
    comp2Label,

    // Delta visibility
    showDelta1,
    showDelta2,

    // Hierarchy
    hierarchyLabelPrimary: formData.hierarchyLabelPrimary || 'Магазин',
    hierarchyLabelSecondary: formData.hierarchyLabelSecondary || 'Сегмент',

    // Theme
    isDarkMode,
    theme,

    // Detail
    detailQueryParams,

    // Formatters
    formatValueA: fmtMainA,
    formatValueB: fmtMainB,
    formatDelta,

    // Top N
    detailTopN: Number(formData.detailTopN) || 0,
    detailPageSize: Number(formData.detailPageSize) || 20,

    // Mock mode
    mockModeEnabled,
    mockPreset: formData.mockPreset ?? 'revenue',
    mockCustomJson: formData.mockCustomJson,
  };
}
