import { buildQueryContext, QueryFormData } from '@superset-ui/core';
import { KpiCardFormData } from '../types';
export default function buildQuery(formData: KpiCardFormData) {
  const { metric, metric_plan, time_comparison } = formData;
  return buildQueryContext(formData, (baseQueryObject) => {
    const metrics: string[] = [metric];
    if (metric_plan && metric_plan !== metric) {
      metrics.push(metric_plan);
    }
    const timeOffsets: string[] = [];
    if (time_comparison && time_comparison !== 'none') {
      timeOffsets.push(time_comparison);
    }
    return [
      {
        ...baseQueryObject,
        metrics,
        columns: [],
        groupby: [],
        time_offsets: timeOffsets.length > 0 ? timeOffsets : undefined,
        post_processing: [],
        row_limit: 1,
      },
    ];
  });
}
