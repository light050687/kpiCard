import { buildQueryContext, QueryFormMetric } from '@superset-ui/core';
import { KpiCardFormData } from '../types';

/**
 * Build query context for KPI Card.
 *
 * Collects all non-null metrics from both modes (A and B),
 * deduplicates them, and sends 1 or 2 queries:
 *   - Query 0 (summary): single aggregated row, no groupby
 *   - Query 1 (detail):  grouped breakdown for drill-down modal
 */
export default function buildQuery(formData: KpiCardFormData) {
  const {
    metric_a,
    metric_plan_a,
    metric_comp2_a,
    metric_b,
    metric_plan_b,
    metric_comp2_b,
    metric_delta_1a,
    metric_delta_2a,
    metric_delta_1b,
    metric_delta_2b,
    groupby_primary,
    groupby_secondary,
  } = formData;

  return buildQueryContext(formData, baseQueryObject => {
    // ── Collect all metrics from both modes, deduplicate ──
    const allMetrics: QueryFormMetric[] = [];
    const seenLabels = new Set<string>();

    const addMetric = (m: QueryFormMetric | undefined): void => {
      if (!m) return;
      const label = typeof m === 'string' ? m : (m as { label?: string }).label ?? JSON.stringify(m);
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

    // Pick only safe fields from baseQueryObject to avoid column pollution
    const {
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
    } = baseQueryObject;

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

    // ── Query 1: Detail breakdown (only if groupby columns are set) ──
    const detailGroupby = [groupby_primary, groupby_secondary].filter(
      (col): col is string => typeof col === 'string' && col.length > 0,
    );

    if (detailGroupby.length === 0) {
      return [summaryQuery];
    }

    const detailQuery = {
      ...baseFields,
      metrics: allMetrics,
      columns: detailGroupby,
      orderby: [],
      row_limit: 10000,
      post_processing: [],
    };

    return [summaryQuery, detailQuery];
  });
}
