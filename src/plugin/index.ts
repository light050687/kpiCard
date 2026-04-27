import { ChartPlugin, ChartMetadata } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';
import { KpiCardFormData } from '../types';

/**
 * Scorecard plugin for Superset (internal: KpiCard).
 *
 * Register in MainPreset.js with:
 *   new SupersetPluginChartScorecard().configure({ key: 'ext-kpi-card' })
 * (viz_type ключ оставлен 'ext-kpi-card' ради совместимости с существующими чартами в БД.)
 */
export default class SupersetPluginChartScorecard extends ChartPlugin<KpiCardFormData> {
  constructor() {
    super({
      buildQuery,
      controlPanel,
      loadChart: () => import('../KpiCard'),
      metadata: new ChartMetadata({
        name: '[MRTS] Scorecard',
        description:
          'KPI-карточка с план/ПГ сравнениями, dual-mode toggle ' +
          'и drill-down модалью. Design System v2.0.',
        thumbnail,
        tags: ['MRTS', 'KPI', 'Big Number', 'Comparison', 'Featured'],
        category: 'MRTS',
      }),
      transformProps,
    });
  }
}
