import { buildQueryContext } from '@superset-ui/core';
/**
 * Build query context for KPI Card.
 *
 * Collects all non-null metrics from both modes (A and B),
 * deduplicates them, and sends 1 or 2 queries:
 *   - Query 0 (summary): single aggregated row, no groupby
 *   - Query 1 (detail):  grouped breakdown for drill-down modal
 */
export default function buildQuery(formData) {
    const { metric_a, metric_plan_a, metric_comp2_a, metric_b, metric_plan_b, metric_comp2_b, metric_delta_1a, metric_delta_2a, metric_delta_1b, metric_delta_2b, } = formData;
    // Normalize groupby fields — sharedControls.groupby stores arrays even with multi:false
    // buildQueryContext may call .toLowerCase() on these → crash if array
    const fd = formData;
    if (Array.isArray(fd.groupby_primary)) {
        fd.groupby_primary = fd.groupby_primary[0] ?? undefined;
    }
    if (Array.isArray(fd.groupby_secondary)) {
        fd.groupby_secondary = fd.groupby_secondary[0] ?? undefined;
    }
    // Also normalize the camelCase variants (lodash auto-converts snake_case → camelCase)
    if (Array.isArray(fd.groupbyPrimary)) {
        fd.groupbyPrimary = fd.groupbyPrimary[0] ?? undefined;
    }
    if (Array.isArray(fd.groupbySecondary)) {
        fd.groupbySecondary = fd.groupbySecondary[0] ?? undefined;
    }
    return buildQueryContext(formData, baseQueryObject => {
        // ── Collect all metrics from both modes, deduplicate ──
        const allMetrics = [];
        const seenLabels = new Set();
        const addMetric = (m) => {
            if (!m)
                return;
            const label = typeof m === 'string' ? m : m.label ?? JSON.stringify(m);
            if (!seenLabels.has(label)) {
                seenLabels.add(label);
                allMetrics.push(m);
            }
        };
        // Mode A metrics
        addMetric(metric_a);
        addMetric(metric_plan_a);
        addMetric(metric_comp2_a);
        // Mode B metrics
        addMetric(metric_b);
        addMetric(metric_plan_b);
        addMetric(metric_comp2_b);
        // Delta metrics (optional — user-provided delta values)
        addMetric(metric_delta_1a);
        addMetric(metric_delta_2a);
        addMetric(metric_delta_1b);
        addMetric(metric_delta_2b);
        // Mock mode: if no real metrics configured, use COUNT(*) to avoid "Empty query?"
        // COUNT(*) is always valid SQL for any datasource. transformProps ignores the result.
        const fdExt = formData;
        const isMockOn = fdExt.mock_mode_enabled ?? fdExt.mockModeEnabled ?? false;
        if (allMetrics.length === 0 && isMockOn) {
            allMetrics.push({
                expressionType: 'SQL',
                sqlExpression: 'COUNT(*)',
                label: '__mock',
            });
        }
        // Pick only safe fields from baseQueryObject to avoid column pollution
        const { time_range, since, until, granularity, filters, extras, applied_time_extras, where, having, annotation_layers, url_params, custom_params, } = baseQueryObject;
        const baseFields = {
            time_range,
            since,
            until,
            granularity,
            filters,
            extras,
            applied_time_extras,
            where,
            having,
            annotation_layers,
            url_params,
            custom_params,
        };
        // ── Query 0: Summary (single row, no groupby) ──
        const summaryQuery = {
            ...baseFields,
            metrics: allMetrics,
            columns: [],
            orderby: [],
            row_limit: 1,
            post_processing: [],
        };
        // Detail data loaded on-demand via SupersetClient when modal opens
        return [summaryQuery];
    });
}
//# sourceMappingURL=buildQuery.js.map