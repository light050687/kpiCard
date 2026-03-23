import transformProps from '../src/plugin/transformProps';
import { ChartProps } from '@superset-ui/core';

// ═══════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════

const BASE_FORM_DATA = {
  datasource: '1__table',
  viz_type: 'ext-kpi-card',
  metric_a: 'revenue',
  metric_plan_a: 'revenue_plan',
  metric_comp2_a: 'revenue_ly',
  metric_b: 'revenue_pct',
  metric_plan_b: 'revenue_pct_plan',
  metric_comp2_b: 'revenue_pct_ly',
  header_text: 'Выручка',
  mode_count: 'dual',
  auto_format_russian: true,
  toggle_label_a: '₽',
  toggle_label_b: '%',
  subtitle_a: '₽ за период',
  subtitle_b: 'доля от общей',
  number_format_a: 'RU_SMART',
  number_format_b: 'RU_SMART',
  enable_comp1: true,
  enable_comp2: true,
  comp1_label: 'План:',
  comp2_label: 'ПГ:',
  color_scheme_1a: 'green_up' as const,
  color_scheme_2a: 'green_up' as const,
  color_scheme_1b: 'green_up' as const,
  color_scheme_2b: 'green_up' as const,
  delta_format_1a: 'auto' as const,
  delta_format_2a: 'auto' as const,
  delta_format_1b: 'auto' as const,
  delta_format_2b: 'auto' as const,
  detail_top_n: 0,
};

const MOCK_SUMMARY = [
  {
    revenue: 12400000000,
    revenue_plan: 11200000000,
    revenue_ly: 10800000000,
    revenue_pct: 0.148,
    revenue_pct_plan: 0.14,
    revenue_pct_ly: 0.125,
  },
];

const MOCK_THEME = {
  colorBgContainer: '#ffffff',
};

function createChartProps(
  overrides: Record<string, unknown> = {},
  data: Record<string, unknown>[] = MOCK_SUMMARY,
): ChartProps {
  return new ChartProps({
    width: 300,
    height: 200,
    formData: { ...BASE_FORM_DATA, ...overrides },
    queriesData: [{ data }],
    theme: MOCK_THEME,
  });
}

// ═══════════════════════════════════════
// Tests
// ═══════════════════════════════════════

describe('KpiCard transformProps', () => {
  // ── Basic output shape ──

  it('returns all required KpiCardProps fields', () => {
    const result = transformProps(createChartProps());
    expect(result).toHaveProperty('width', 300);
    expect(result).toHaveProperty('height', 200);
    expect(result).toHaveProperty('headerText', 'Выручка');
    expect(result).toHaveProperty('dataState');
    expect(result).toHaveProperty('modeCount', 'dual');
    expect(result).toHaveProperty('modeAView');
    expect(result).toHaveProperty('modeBView');
    expect(result).toHaveProperty('isDarkMode');
    expect(result).toHaveProperty('formatValueA');
    expect(result).toHaveProperty('formatValueB');
    expect(result).toHaveProperty('formatDelta');
  });

  it('returns correct header text', () => {
    const result = transformProps(createChartProps());
    expect(result.headerText).toBe('Выручка');
  });

  it('uses metric label as fallback header when header_text is empty', () => {
    const result = transformProps(createChartProps({ header_text: '' }));
    expect(result.headerText).toBe('revenue');
  });

  // ── Mode A view ──

  it('returns Mode A view with formatted hero value', () => {
    const result = transformProps(createChartProps());
    expect(result.modeAView.value).toBeDefined();
    expect(result.modeAView.value.length).toBeGreaterThan(0);
    expect(result.modeAView.subtitle).toBe('₽ за период');
  });

  it('builds plan comparison (comp1) with correct status', () => {
    const result = transformProps(createChartProps());
    const comp1 = result.modeAView.comparisons.find(c => c.type === 'comp1');
    expect(comp1).toBeDefined();
    expect(comp1?.label).toBe('План:');
    // revenue 12.4B > plan 11.2B → positive delta → green_up = 'up'
    expect(comp1?.status).toBe('up');
  });

  it('builds YoY comparison (comp2) with correct status', () => {
    const result = transformProps(createChartProps());
    const comp2 = result.modeAView.comparisons.find(c => c.type === 'comp2');
    expect(comp2).toBeDefined();
    expect(comp2?.label).toBe('ПГ:');
    expect(comp2?.status).toBe('up');
  });

  // ── Color scheme inversion ──

  it('flips status when color_scheme is green_down', () => {
    const result = transformProps(
      createChartProps({ color_scheme_1a: 'green_down' }),
    );
    const comp1 = result.modeAView.comparisons.find(c => c.type === 'comp1');
    // revenue > plan → positive delta → green_down inverts to 'dn'
    expect(comp1?.status).toBe('dn');
  });

  // ── Empty data ──

  it('handles empty queriesData gracefully', () => {
    const result = transformProps(createChartProps({}, []));
    expect(result.dataState).toBe('empty');
    expect(result.modeAView.value).toBeDefined();
    expect(result.modeAView.comparisons).toEqual([]);
  });

  it('sets dataState to empty when all values are zero', () => {
    const zeroData = [
      {
        revenue: 0,
        revenue_plan: 0,
        revenue_ly: 0,
        revenue_pct: 0,
        revenue_pct_plan: 0,
        revenue_pct_ly: 0,
      },
    ];
    const result = transformProps(createChartProps({}, zeroData));
    expect(result.dataState).toBe('empty');
  });

  // ── Partial state ──

  it('sets dataState to partial when Mode B is zero in dual mode', () => {
    const partialData = [
      {
        revenue: 12400000000,
        revenue_plan: 11200000000,
        revenue_ly: 10800000000,
        revenue_pct: 0,
        revenue_pct_plan: 0,
        revenue_pct_ly: 0,
      },
    ];
    const result = transformProps(createChartProps({}, partialData));
    expect(result.dataState).toBe('partial');
  });

  it('sets dataState to populated with valid data', () => {
    const result = transformProps(createChartProps());
    expect(result.dataState).toBe('populated');
  });

  // ── Null metrics ──

  it('handles missing plan metric (comp1 disabled)', () => {
    const result = transformProps(
      createChartProps({ metric_plan_a: undefined, enable_comp1: false }),
    );
    const comp1 = result.modeAView.comparisons.find(c => c.type === 'comp1');
    expect(comp1).toBeUndefined();
  });

  it('handles missing YoY metric (comp2 disabled)', () => {
    const result = transformProps(
      createChartProps({ metric_comp2_a: undefined, enable_comp2: false }),
    );
    const comp2 = result.modeAView.comparisons.find(c => c.type === 'comp2');
    expect(comp2).toBeUndefined();
  });

  // ── Negative values ──

  it('handles negative metric values', () => {
    const negData = [
      {
        revenue: -500000000,
        revenue_plan: 1000000000,
        revenue_ly: 800000000,
        revenue_pct: 0,
        revenue_pct_plan: 0,
        revenue_pct_ly: 0,
      },
    ];
    const result = transformProps(createChartProps({}, negData));
    expect(result.modeAView.value).toBeDefined();
    const comp1 = result.modeAView.comparisons.find(c => c.type === 'comp1');
    // -500M < 1B → negative delta → green_up = 'dn'
    expect(comp1?.status).toBe('dn');
  });

  // ── Zero division guard ──

  it('handles zero comparison value without crashing', () => {
    const zeroCompData = [
      {
        revenue: 12400000000,
        revenue_plan: 0,
        revenue_ly: 0,
        revenue_pct: 0,
        revenue_pct_plan: 0,
        revenue_pct_ly: 0,
      },
    ];
    expect(() => transformProps(createChartProps({}, zeroCompData))).not.toThrow();
    const result = transformProps(createChartProps({}, zeroCompData));
    const comp1 = result.modeAView.comparisons.find(c => c.type === 'comp1');
    expect(comp1).toBeDefined();
  });

  // ── Long strings ──

  it('passes long header text through safely', () => {
    const longText = 'А'.repeat(200);
    const result = transformProps(createChartProps({ header_text: longText }));
    expect(result.headerText).toBe(longText);
  });

  // ── Single mode ──

  it('returns single mode count correctly', () => {
    const result = transformProps(createChartProps({ mode_count: 'single' }));
    expect(result.modeCount).toBe('single');
    // Mode B should still exist but with default/zero values
    expect(result.modeBView).toBeDefined();
  });

  // ── Dual mode ──

  it('returns both views populated in dual mode', () => {
    const result = transformProps(createChartProps());
    expect(result.modeCount).toBe('dual');
    expect(result.modeAView.value).toBeDefined();
    expect(result.modeBView.value).toBeDefined();
    expect(result.toggleLabelA).toBe('₽');
    expect(result.toggleLabelB).toBe('%');
  });

  // ── Dark mode detection ──

  it('detects light mode from light theme', () => {
    const result = transformProps(createChartProps());
    expect(result.isDarkMode).toBe(false);
  });

  it('detects dark mode from dark theme', () => {
    const darkProps = new ChartProps({
      width: 300,
      height: 200,
      formData: BASE_FORM_DATA,
      queriesData: [{ data: MOCK_SUMMARY }],
      theme: { colorBgContainer: '#1a1a2e' },
    });
    const result = transformProps(darkProps);
    expect(result.isDarkMode).toBe(true);
  });

  // ── Delta formats ──

  it('applies percent delta format', () => {
    const result = transformProps(
      createChartProps({ delta_format_1a: 'percent' }),
    );
    const comp1 = result.modeAView.comparisons.find(c => c.type === 'comp1');
    expect(comp1?.delta).toBeDefined();
    // Should contain % sign
    expect(comp1?.delta).toMatch(/%/);
  });

  it('applies absolute delta format', () => {
    const result = transformProps(
      createChartProps({ delta_format_1a: 'absolute' }),
    );
    const comp1 = result.modeAView.comparisons.find(c => c.type === 'comp1');
    expect(comp1?.delta).toBeDefined();
  });

  // ── Hierarchy / Detail ──

  it('passes hierarchy labels from formData', () => {
    const result = transformProps(
      createChartProps({
        hierarchy_label_primary: 'Департамент',
        hierarchy_label_secondary: 'Филиал',
      }),
    );
    expect(result.hierarchyLabelPrimary).toBe('Департамент');
    expect(result.hierarchyLabelSecondary).toBe('Филиал');
  });

  it('uses default hierarchy labels when not specified', () => {
    const result = transformProps(createChartProps());
    expect(result.hierarchyLabelPrimary).toBe('Сегмент');
    expect(result.hierarchyLabelSecondary).toBe('Магазин');
  });

  // ── Formatters ──

  it('provides working formatter functions', () => {
    const result = transformProps(createChartProps());
    expect(typeof result.formatValueA).toBe('function');
    expect(typeof result.formatValueB).toBe('function');
    expect(typeof result.formatDelta).toBe('function');
    // Should not throw on valid input
    expect(() => result.formatValueA(1000000)).not.toThrow();
    expect(() => result.formatDelta(0.15)).not.toThrow();
  });
});
