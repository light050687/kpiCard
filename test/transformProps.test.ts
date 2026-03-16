import transformProps from '../src/plugin/transformProps';
import { ChartProps } from '@superset-ui/core';

const BASE_FORM_DATA = {
  datasource: '1__table',
  viz_type: 'kpi_card',
  metric: 'revenue',
  metric_plan: 'revenue_plan',
  header_text: 'Revenue',
  subheader_text: '₽ for period',
  subheader_text_pct: 'YoY growth',
  number_format: 'SMART_NUMBER',
  number_format_secondary: '+.1%',
  comparison_color_scheme: 'green_up' as const,
  time_comparison: '1 year ago',
  toggle_mode: 'abs_pct' as const,
  toggle_label_abs: '₽',
  toggle_label_pct: '%',
  plan_label: 'Plan:',
  comparison_label: 'YoY:',
};

const MOCK_DATA = [
  {
    revenue: 12400000000,
    revenue_plan: 11200000000,
    'revenue__1 year ago': 10800000000,
  },
];

function createChartProps(overrides: Record<string, any> = {}): ChartProps {
  return new ChartProps({
    width: 300,
    height: 200,
    formData: { ...BASE_FORM_DATA, ...overrides },
    queriesData: [{ data: MOCK_DATA }],
  });
}

describe('KpiCard transformProps', () => {
  it('returns correct header text', () => {
    const result = transformProps(createChartProps());
    expect(result.headerText).toBe('Revenue');
  });

  it('returns abs view with formatted main value', () => {
    const result = transformProps(createChartProps());
    expect(result.absView.value).toBeDefined();
    expect(result.absView.subtitle).toBe('₽ for period');
  });

  it('returns pct view with YoY percentage', () => {
    const result = transformProps(createChartProps());
    expect(result.pctView.value).toBeDefined();
    expect(result.pctView.subtitle).toBe('YoY growth');
  });

  it('builds plan comparison with correct status', () => {
    const result = transformProps(createChartProps());
    const planCmp = result.absView.comparisons.find(
      (c) => c.label === 'Plan:',
    );
    expect(planCmp).toBeDefined();
    // revenue > plan → should be 'up' (green_up scheme)
    expect(planCmp?.status).toBe('up');
  });

  it('builds YoY comparison', () => {
    const result = transformProps(createChartProps());
    const yoyCmp = result.absView.comparisons.find(
      (c) => c.label === 'YoY:',
    );
    expect(yoyCmp).toBeDefined();
    expect(yoyCmp?.status).toBe('up');
  });

  it('flips status when comparison_color_scheme is green_down', () => {
    const result = transformProps(
      createChartProps({ comparison_color_scheme: 'green_down' }),
    );
    const planCmp = result.absView.comparisons.find(
      (c) => c.label === 'Plan:',
    );
    // revenue > plan → positive delta → green_down means 'dn'
    expect(planCmp?.status).toBe('dn');
  });

  it('handles missing plan metric gracefully', () => {
    const result = transformProps(
      createChartProps({ metric_plan: undefined }),
    );
    const planCmp = result.absView.comparisons.find(
      (c) => c.label === 'Plan:',
    );
    expect(planCmp).toBeUndefined();
  });

  it('handles no time comparison', () => {
    const result = transformProps(
      createChartProps({ time_comparison: 'none' }),
    );
    const yoyCmp = result.absView.comparisons.find(
      (c) => c.label === 'YoY:',
    );
    expect(yoyCmp).toBeUndefined();
  });

  it('passes toggle config through', () => {
    const result = transformProps(createChartProps());
    expect(result.toggleMode).toBe('abs_pct');
    expect(result.toggleLabelAbs).toBe('₽');
    expect(result.toggleLabelPct).toBe('%');
  });
});
