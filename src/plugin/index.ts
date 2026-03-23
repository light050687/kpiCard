import { ChartPlugin, ChartMetadata } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';
import { KpiCardFormData } from '../types';

/**
 * KPI Card plugin for Superset.
 *
 * Register in MainPreset.js with:
 *   new SupersetPluginChartKpiCard().configure({ key: 'ext-kpi-card' })
 */
export default class SupersetPluginChartKpiCard extends ChartPlugin<KpiCardFormData> {
  constructor() {
    super({
      buildQuery,
      controlPanel,
      loadChart: () => import('../KpiCard'),
      metadata: new ChartMetadata({
        name: 'KPI Card',
        description:
          'KPI-карточка с план/ПГ сравнениями, dual-mode toggle ' +
          'и drill-down модалью. Design System v2.0.',
        thumbnail,
        tags: ['KPI', 'Big Number', 'Comparison', 'Featured'],
        category: 'KPI Indicators',
      }),
      transformProps,
    });
  }
}
