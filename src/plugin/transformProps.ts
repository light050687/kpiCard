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
} from '../types';

/**
 * Determine delta status: up (green), dn (red), or wn (yellow).
 * `colorScheme` flips the logic for metrics where decrease is good (e.g., expenses).
 */
function getDeltaStatus(
  delta: number,
  colorScheme: ComparisonColorScheme,
): DeltaStatus {
  if (delta === 0) return 'neutral';
  const isPositive = delta > 0;
  if (colorScheme === 'green_up') {
    return isPositive ? 'up' : 'dn';
  }
  // green_down: decrease is good (expenses, churn)
  return isPositive ? 'dn' : 'up';
}

function extractMetricValue(
  data: Record<string, any>[],
  metricKey: string,
): number | null {
  if (!data?.length) return null;
  const row = data[0];
  const val = row[metricKey];
  return val != null ? Number(val) : null;
}

function getMetricLabel(metric: any): string {
  if (typeof metric === 'string') return metric;
  if (metric?.label) return metric.label;
  return String(metric);
}

/**
 * Build comparison items from plan and time_offset data.
 */
function buildComparisons(
  mainValue: number,
  planValue: number | null,
  prevValue: number | null,
  formData: KpiCardFormData,
  mainFmt: ReturnType<typeof getNumberFormatter>,
  pctFmt: ReturnType<typeof getNumberFormatter>,
): { absComparisons: ComparisonItem[]; pctComparisons: ComparisonItem[] } {
  const absComparisons: ComparisonItem[] = [];
  const pctComparisons: ComparisonItem[] = [];
  const colorScheme = formData.comparison_color_scheme || 'green_up';

  if (planValue != null) {
    const planDelta = mainValue - planValue;
    const planDeltaPct = planValue !== 0 ? planDelta / planValue : 0;
    const status = getDeltaStatus(planDelta, colorScheme);

    absComparisons.push({
      label: formData.plan_label || 'Plan:',
      value: mainFmt(planValue),
      delta: mainFmt(planDelta),
      status,
    });

    pctComparisons.push({
      label: formData.plan_label || 'Plan:',
      value: pctFmt(planDeltaPct),
      delta: status === 'up' ? 'above plan' : 'below plan',
      status,
    });
  }

  if (prevValue != null) {
    const yoyDelta = mainValue - prevValue;
    const yoyPct = prevValue !== 0 ? yoyDelta / prevValue : 0;
    const status = getDeltaStatus(yoyDelta, colorScheme);

    absComparisons.push({
      label: formData.comparison_label || 'YoY:',
      value: mainFmt(prevValue),
      delta: pctFmt(yoyPct),
      status,
    });

    pctComparisons.push({
      label: formData.comparison_label || 'YoY:',
      value: mainFmt(prevValue),
      delta: pctFmt(yoyPct),
      status,
    });
  }

  return { absComparisons, pctComparisons };
}

export default function transformProps(chartProps: ChartProps): KpiCardProps {
  const { width, height, formData: rawFormData, queriesData, theme } = chartProps;
  const formData = rawFormData as KpiCardFormData;
  const data = queriesData?.[0]?.data as Record<string, any>[] | undefined;

  const mainFmt = getNumberFormatter(
    formData.number_format || NumberFormats.SMART_NUMBER,
  );
  const pctFmt = getNumberFormatter(
    formData.number_format_secondary || '+.1%',
  );

  const metricLabel = getMetricLabel(formData.metric);
  const mainValue = extractMetricValue(data ?? [], metricLabel) ?? 0;

  // Plan metric
  const planLabel = formData.metric_plan
    ? getMetricLabel(formData.metric_plan)
    : null;
  const planValue = planLabel
    ? extractMetricValue(data ?? [], planLabel)
    : null;

  // Time comparison: Superset returns offset columns as "<metric>__<offset>"
  const timeComp = formData.time_comparison;
  let prevValue: number | null = null;
  if (timeComp && timeComp !== 'none' && data?.length) {
    const offsetKey = `${metricLabel}__${timeComp}`;
    prevValue = extractMetricValue(data, offsetKey);
  }

  const { absComparisons, pctComparisons } = buildComparisons(
    mainValue,
    planValue,
    prevValue,
    formData,
    mainFmt,
    pctFmt,
  );

  // Compute percentage change for pct view hero number
  const pctChange =
    prevValue != null && prevValue !== 0
      ? (mainValue - prevValue) / prevValue
      : null;

  const absView: KpiViewData = {
    value: mainFmt(mainValue),
    subtitle: formData.subheader_text || '',
    comparisons: absComparisons,
  };

  const pctView: KpiViewData = {
    value: pctChange != null ? pctFmt(pctChange) : mainFmt(mainValue),
    subtitle: formData.subheader_text_pct || formData.subheader_text || '',
    comparisons: pctComparisons,
  };

  // Detect dark mode from Superset theme
  const isDarkMode = theme
    ? theme.colors.grayscale.light5 !== '#F5F5F5'
    : false;

  return {
    width,
    height,
    headerText:
      formData.header_text || metricLabel || 'KPI',
    toggleMode: formData.toggle_mode || 'abs_pct',
    toggleLabelAbs: formData.toggle_label_abs || '₽',
    toggleLabelPct: formData.toggle_label_pct || '%',
    absView,
    pctView,
    isDarkMode,
    theme,
  };
}
