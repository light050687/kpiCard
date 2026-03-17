import { buildQueryContext } from '@superset-ui/core';
import { KpiCardFormData } from '../types';

/**
 * Build query context for KPI Card.
 *
 * Returns 1 or 2 queries:
 *   - Query 0 (summary): single aggregated row, no groupby
 *   - Query 1 (detail):  grouped breakdown for drill-down modal
 *     (only if groupby_primary or groupby_secondary is set)
 */
export default function buildQuery(formData: KpiCardFormData) {
  const {
    metric,
    metric_plan,
    time_comparison,
    enable_plan,
    enable_yoy,
    groupby_primary,
    groupby_secondary,
  } = formData;

  return buildQueryContext(formData, baseQueryObject => {
    // ── Metrics ──
    const metrics: string[] = [metric];
    if (enable_plan && metric_plan && metric_plan !== metric) {
      metrics.push(metric_plan);
    }

    // ── Time offsets for YoY / MoM / etc. ──
    const timeOffsets: string[] = [];
    if (enable_yoy && time_comparison && time_comparison !== 'none') {
      timeOffsets.push(time_comparison);
    }

    const sharedQueryParts = {
      metrics,
      time_offsets: timeOffsets.length > 0 ? timeOffsets : undefined,
      post_processing: [],
    };

    // ── Query 0: Summary (single row, no groupby) ──
    const summaryQuery = {
      ...baseQueryObject,
      ...sharedQueryParts,
      columns: [],
      groupby: [],
      row_limit: 1,
    };

    // ── Query 1: Detail breakdown (only if groupby columns are set) ──
    const detailGroupby = [groupby_primary, groupby_secondary].filter(
      (col): col is string => Boolean(col),
    );

    if (detailGroupby.length === 0) {
      return [summaryQuery];
    }

    const detailQuery = {
      ...baseQueryObject,
      ...sharedQueryParts,
      columns: detailGroupby,
      groupby: detailGroupby,
      row_limit: 10000,
    };

    return [summaryQuery, detailQuery];
  });
}
