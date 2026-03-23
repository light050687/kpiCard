import { ChartPlugin, ChartMetadata } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';
export default class SupersetPluginChartKpiCard extends ChartPlugin {
    constructor() {
        super({
            buildQuery,
            controlPanel,
            loadChart: () => import('../KpiCard'),
            metadata: new ChartMetadata({
                name: 'KPI Card',
                description: 'Single KPI metric card with plan/YoY comparisons, abs/pct toggle, ' +
                    'and delta pills. Follows Design System v2.0.',
                thumbnail,
                tags: ['KPI', 'Big Number', 'Comparison', 'Featured'],
                category: 'KPI Indicators',
            }),
            transformProps,
        });
    }
}
//# sourceMappingURL=index.js.map