import { getMetricLabel, getNumberFormatter, NumberFormats, } from '@superset-ui/core';
import { formatRussianSmart, formatRussianPercent, formatDeltaByFormat, } from '../utils/formatRussian';
// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════
function getDeltaStatus(delta, colorScheme) {
    if (delta === 0)
        return 'neutral';
    const isPositive = delta > 0;
    return colorScheme === 'green_up'
        ? (isPositive ? 'up' : 'dn')
        : (isPositive ? 'dn' : 'up');
}
function extractMetricValue(data, metricKey) {
    if (!data?.length)
        return null;
    const val = data[0][metricKey];
    return val != null ? Number(val) : null;
}
function createValueFormatter(formatStr, autoRussian) {
    if (autoRussian && (!formatStr || formatStr === 'RU_SMART')) {
        return formatRussianSmart;
    }
    const d3Fmt = getNumberFormatter(formatStr || NumberFormats.SMART_NUMBER);
    return (n) => d3Fmt(n);
}
function createDeltaFormatter(autoRussian) {
    if (autoRussian) {
        return (n) => formatRussianPercent(n, true);
    }
    const d3Fmt = getNumberFormatter('+.1%');
    return (n) => d3Fmt(n);
}
function formatDeltaByType(diff, ref, fmt) {
    const effective = fmt === 'auto' ? 'percent' : fmt;
    return formatDeltaByFormat(diff, ref, effective);
}
function buildModeView(params) {
    const { mainValue, comp1Value, comp2Value, colorScheme1, colorScheme2, valueFmt, subtitle, enableComp1, enableComp2, comp1Label, comp2Label, deltaFormat1, deltaFormat2, } = params;
    const heroValue = valueFmt(mainValue);
    const comparisons = [];
    // ── Comparison 1 ──
    if (enableComp1 && comp1Value != null) {
        const delta = mainValue - comp1Value;
        const status = getDeltaStatus(delta, colorScheme1);
        comparisons.push({
            label: comp1Label,
            value: valueFmt(comp1Value),
            delta: formatDeltaByType(delta, comp1Value, deltaFormat1),
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
            delta: formatDeltaByType(delta, comp2Value, deltaFormat2),
            status,
            type: 'comp2',
            rawDiff: delta,
            rawRef: comp2Value,
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
function resolveMetricValue(formDataMetric, summaryData, excludeKeys) {
    if (!summaryData.length)
        return { label: null, value: null };
    // Strategy 1: direct label
    if (formDataMetric) {
        const label = getMetricLabel(formDataMetric);
        const value = extractMetricValue(summaryData, label);
        if (value != null)
            return { label, value };
    }
    // Strategy 2: next unused key in results
    const row = summaryData[0];
    const nextKey = Object.keys(row).find(k => !excludeKeys.has(k));
    if (nextKey) {
        const val = row[nextKey];
        return { label: nextKey, value: val != null ? Number(val) : null };
    }
    return { label: null, value: null };
}
// ═══════════════════════════════════════
// Detail data extraction
// ═══════════════════════════════════════
function extractDetailRows(rows, primaryCol, secondaryCol, metricLabel, comp1MetricLabel, comp2MetricLabel) {
    const result = rows.map(row => ({
        primaryGroup: primaryCol ? String(row[primaryCol] ?? 'N/A') : 'Total',
        secondaryGroup: secondaryCol ? String(row[secondaryCol] ?? 'N/A') : 'Total',
        metricValue: Number(row[metricLabel] ?? 0),
        comp1Value: comp1MetricLabel ? Number(row[comp1MetricLabel] ?? 0) : null,
        comp2Value: comp2MetricLabel ? Number(row[comp2MetricLabel] ?? 0) : null,
    }));
    return { rows: result };
}
// ═══════════════════════════════════════
// Main transform
// ═══════════════════════════════════════
export default function transformProps(chartProps) {
    const { width, height, formData: fd, queriesData, theme } = chartProps;
    const formData = fd;
    // ── Defaults (camelCase — auto-converted from controlPanel snake_case) ──
    const autoRussian = formData.autoFormatRussian ?? true;
    const enableComp1 = formData.enableComp1 ?? true;
    const enableComp2 = formData.enableComp2 ?? true;
    const modeCount = formData.modeCount || 'dual';
    const colorScheme1A = formData.colorScheme_1a || 'green_up';
    const colorScheme1B = formData.colorScheme_1b || 'green_up';
    const colorScheme2A = formData.colorScheme_2a || 'green_up';
    const colorScheme2B = formData.colorScheme_2b || 'green_up';
    const deltaFormat1A = formData.deltaFormat_1a || 'auto';
    const deltaFormat2A = formData.deltaFormat_2a || 'auto';
    const deltaFormat1B = formData.deltaFormat_1b || 'auto';
    const deltaFormat2B = formData.deltaFormat_2b || 'auto';
    const comp1Label = formData.comp1Label || 'План:';
    const comp2Label = formData.comp2Label || 'ПГ:';
    // ── Formatters ──
    const formatValueA = createValueFormatter(formData.numberFormatA, autoRussian);
    const formatValueB = createValueFormatter(formData.numberFormatB, autoRussian);
    const formatDelta = createDeltaFormatter(autoRussian);
    // ── Summary data (Query 0) ──
    const summaryData = queriesData?.[0]?.data ?? [];
    // ── Mode A metrics ──
    // controlPanel: metric_a → camelCase: metricA
    const metricALabel = formData.metricA ? getMetricLabel(formData.metricA) : '';
    const mainValueA = metricALabel ? (extractMetricValue(summaryData, metricALabel) ?? 0) : 0;
    const usedKeysA = new Set([metricALabel].filter(Boolean));
    const comp1A = resolveMetricValue(formData.metricPlanA, summaryData, usedKeysA);
    if (comp1A.label)
        usedKeysA.add(comp1A.label);
    const comp2A = resolveMetricValue(formData.metricComp2A, summaryData, usedKeysA);
    // ── Mode B metrics ──
    const metricBLabel = formData.metricB ? getMetricLabel(formData.metricB) : metricALabel;
    const mainValueB = metricBLabel ? (extractMetricValue(summaryData, metricBLabel) ?? 0) : 0;
    const usedKeysB = new Set([metricBLabel].filter(Boolean));
    const comp1B = resolveMetricValue(formData.metricPlanB, summaryData, usedKeysB);
    if (comp1B.label)
        usedKeysB.add(comp1B.label);
    const comp2B = resolveMetricValue(formData.metricComp2B, summaryData, usedKeysB);
    // ── Build Mode A view ──
    const modeAView = buildModeView({
        mainValue: mainValueA,
        comp1Value: comp1A.value,
        comp2Value: comp2A.value,
        colorScheme1: colorScheme1A,
        colorScheme2: colorScheme2A,
        valueFmt: formatValueA,
        subtitle: formData.subtitleA || '',
        enableComp1,
        enableComp2,
        comp1Label,
        comp2Label,
        deltaFormat1: deltaFormat1A,
        deltaFormat2: deltaFormat2A,
    });
    // ── Build Mode B view ──
    const modeBView = buildModeView({
        mainValue: mainValueB,
        comp1Value: comp1B.value,
        comp2Value: comp2B.value,
        colorScheme1: colorScheme1B,
        colorScheme2: colorScheme2B,
        valueFmt: formatValueB,
        subtitle: formData.subtitleB || '',
        enableComp1,
        enableComp2,
        comp1Label,
        comp2Label,
        deltaFormat1: deltaFormat1B,
        deltaFormat2: deltaFormat2B,
    });
    // ── Detail data (Query 1, if present) — uses Mode A metrics ──
    let detailDataRaw;
    if (queriesData && queriesData.length > 1 && queriesData[1]?.data) {
        const detailRows = queriesData[1].data;
        if (detailRows.length > 0) {
            detailDataRaw = extractDetailRows(detailRows, formData.groupbyPrimary, formData.groupbySecondary, metricALabel, comp1A.label, comp2A.label);
        }
    }
    // ── Detect dark mode from Superset theme (Ant Design v5 tokens) ──
    const isDarkMode = (() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bg = theme?.colorBgBase;
        if (!bg || typeof bg !== 'string' || !bg.startsWith('#'))
            return false;
        const hex = bg.replace('#', '');
        if (hex.length < 6)
            return false;
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
    })();
    return {
        width,
        height,
        headerText: formData.headerText || metricALabel || 'KPI',
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
        // Comparisons
        enableComp1,
        enableComp2,
        comp1Label,
        comp2Label,
        // Hierarchy
        hierarchyLabelPrimary: formData.hierarchyLabelPrimary || 'Сегмент',
        hierarchyLabelSecondary: formData.hierarchyLabelSecondary || 'Магазин',
        // Theme
        isDarkMode,
        theme,
        // Detail
        detailDataRaw,
        // Formatters
        formatValueA,
        formatValueB,
        formatDelta,
        // Top N
        detailTopN: formData.detailTopN ?? 0,
    };
}
//# sourceMappingURL=transformProps.js.map