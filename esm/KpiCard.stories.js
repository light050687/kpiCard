import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import KpiCard from './KpiCard';
import { formatRussianSmart, formatRussianPercent } from './utils/formatRussian';
/*
 * Storybook stories for KPI Card.
 *
 * Mock data mirrors the HTML mockup: kpi-cards-v1.html.
 *
 * Run: cd superset-frontend && npm run storybook
 * Or standalone: npx storybook dev -p 6006
 */
export default {
    title: 'Plugins/KpiCard',
    component: KpiCard,
    argTypes: {
        width: { control: { type: 'range', min: 200, max: 600, step: 10 } },
        height: { control: { type: 'range', min: 140, max: 400, step: 10 } },
        isDarkMode: { control: 'boolean' },
        modeCount: { control: 'select', options: ['single', 'dual'] },
        headerText: { control: 'text' },
        colorScheme1A: { control: 'select', options: ['green_up', 'green_down'] },
        colorScheme1B: { control: 'select', options: ['green_up', 'green_down'] },
        colorScheme2A: { control: 'select', options: ['green_up', 'green_down'] },
        colorScheme2B: { control: 'select', options: ['green_up', 'green_down'] },
        deltaFormat1A: { control: 'select', options: ['auto', 'percent', 'pp', 'absolute'] },
        deltaFormat2A: { control: 'select', options: ['auto', 'percent', 'pp', 'absolute'] },
        deltaFormat1B: { control: 'select', options: ['auto', 'percent', 'pp', 'absolute'] },
        deltaFormat2B: { control: 'select', options: ['auto', 'percent', 'pp', 'absolute'] },
        aggregationTypeA: { control: 'select', options: ['SUM', 'PERCENT', 'AVERAGE', 'MAX', 'MIN'] },
        aggregationTypeB: { control: 'select', options: ['SUM', 'PERCENT', 'AVERAGE', 'MAX', 'MIN'] },
        enableComp1: { control: 'boolean' },
        enableComp2: { control: 'boolean' },
        comp1Label: { control: 'text' },
        comp2Label: { control: 'text' },
        hierarchyLabelPrimary: { control: 'text' },
        hierarchyLabelSecondary: { control: 'text' },
        detailDataRaw: { control: false },
        theme: { control: false },
        formatValueA: { control: false },
        formatValueB: { control: false },
        formatDelta: { control: false },
    },
    parameters: {
        backgrounds: {
            default: 'light',
            values: [
                { name: 'light', value: '#F3F3F3' },
                { name: 'dark', value: '#0F1114' },
            ],
        },
    },
    decorators: [
        (Story) => (_jsxs(_Fragment, { children: [_jsx("link", { href: "https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap", rel: "stylesheet" }), _jsx(Story, {})] })),
    ],
};
// ── Shared defaults ──
const CARD_WIDTH = 370;
const CARD_HEIGHT = 170;
const STUB_THEME = {};
// ── Formatters (used in stories, in production these come from transformProps) ──
const fmtValue = formatRussianSmart;
const fmtDelta = (n) => formatRussianPercent(n, true);
// ── Shared props that every card story needs ──
const SHARED_PROPS = {
    colorScheme1A: 'green_up',
    colorScheme1B: 'green_up',
    colorScheme2A: 'green_up',
    colorScheme2B: 'green_up',
    deltaFormat1A: 'auto',
    deltaFormat2A: 'auto',
    deltaFormat1B: 'auto',
    deltaFormat2B: 'auto',
    enableComp1: true,
    enableComp2: true,
    comp1Label: 'План:',
    comp2Label: 'ПГ:',
    hierarchyLabelPrimary: 'Сегмент',
    hierarchyLabelSecondary: 'Магазин',
    formatValueA: fmtValue,
    formatValueB: (n) => formatRussianPercent(n, false),
    formatDelta: fmtDelta,
    detailTopN: 0,
};
// ═══════════════════════════════════════════════
// Mock data — exact values from kpi-cards-v1.html
// ═══════════════════════════════════════════════
const REVENUE_A = {
    value: '12,4 млрд',
    subtitle: '₽ за период',
    comparisons: [
        { label: 'План:', value: '11,2 млрд', delta: '+1,2 млрд', status: 'up', type: 'comp1', rawDiff: 1200000000, rawRef: 11200000000 },
        { label: 'ПГ:', value: '10,8 млрд', delta: '+14,8%', status: 'up', type: 'comp2', rawDiff: 1600000000, rawRef: 10800000000 },
    ],
};
const REVENUE_B = {
    value: '+14,8%',
    subtitle: 'рост к ПГ',
    comparisons: [
        { label: 'План:', value: '+10,7%', delta: '+4,1 п.п.', status: 'up', type: 'comp1', rawDiff: 0.041, rawRef: 0.107 },
        { label: 'Доля:', value: '42,1%', delta: '+1,3 п.п.', status: 'up', type: 'comp2', rawDiff: 0.013, rawRef: 0.408 },
    ],
};
const EXPENSES_A = {
    value: '3,2 млрд',
    subtitle: '₽ за период',
    comparisons: [
        { label: 'План:', value: '3,4 млрд', delta: '−0,2 млрд', status: 'up', type: 'comp1', rawDiff: -200000000, rawRef: 3400000000 },
        { label: 'ПГ:', value: '3,0 млрд', delta: '+6,7%', status: 'dn', type: 'comp2', rawDiff: 200000000, rawRef: 3000000000 },
    ],
};
const EXPENSES_B = {
    value: '25,8%',
    subtitle: 'доля от выручки',
    comparisons: [
        { label: 'План:', value: '30,4%', delta: '−4,6 п.п.', status: 'up', type: 'comp1', rawDiff: -0.046, rawRef: 0.304 },
        { label: 'ПГ:', value: '27,8%', delta: '−2,0 п.п.', status: 'up', type: 'comp2', rawDiff: -0.020, rawRef: 0.278 },
    ],
};
const MARGIN_A = {
    value: '9,2 млрд',
    subtitle: '₽ валовая прибыль',
    comparisons: [
        { label: 'План:', value: '8,1 млрд', delta: '+1,1 млрд', status: 'up', type: 'comp1', rawDiff: 1100000000, rawRef: 8100000000 },
        { label: 'ПГ:', value: '8,2 млрд', delta: '+12,2%', status: 'up', type: 'comp2', rawDiff: 1000000000, rawRef: 8200000000 },
    ],
};
const MARGIN_B = {
    value: '74,2%',
    subtitle: 'валовая маржа',
    comparisons: [
        { label: 'План:', value: '72,0%', delta: '+2,2 п.п.', status: 'up', type: 'comp1', rawDiff: 0.022, rawRef: 0.720 },
        { label: 'ПГ:', value: '76,3%', delta: '−2,1 п.п.', status: 'wn', type: 'comp2', rawDiff: -0.021, rawRef: 0.763 },
    ],
};
const CONVERSION_A = {
    value: '5,63%',
    subtitle: 'посетитель → покупатель',
    comparisons: [
        { label: 'План:', value: '5,50%', delta: '+0,13 п.п.', status: 'up', type: 'comp1', rawDiff: 0.0013, rawRef: 0.0550 },
        { label: 'ПГ:', value: '4,41%', delta: '+1,22 п.п.', status: 'up', type: 'comp2', rawDiff: 0.0122, rawRef: 0.0441 },
    ],
};
const CONVERSION_B = {
    value: '+27,7%',
    subtitle: 'рост к ПГ',
    comparisons: [
        { label: 'План:', value: '+2,4%', delta: '+25,3 п.п.', status: 'up', type: 'comp1', rawDiff: 0.253, rawRef: 0.024 },
        { label: 'ПГ:', value: '4,41%', delta: '+27,7%', status: 'up', type: 'comp2', rawDiff: 0.277, rawRef: 0.0441 },
    ],
};
// ═══════════════════════════════════════
// Detail modal — raw numeric rows
// ═══════════════════════════════════════
const RAW_DETAIL_ROWS = [
    // Segment: Продукты питания
    { primaryGroup: 'Продукты питания', secondaryGroup: '№12 Центральный', metricValue: 892000000, comp1Value: 840000000, comp2Value: 780000000 },
    { primaryGroup: 'Продукты питания', secondaryGroup: '№5 Северный', metricValue: 756000000, comp1Value: 710000000, comp2Value: 690000000 },
    { primaryGroup: 'Продукты питания', secondaryGroup: '№31 Южный', metricValue: 644000000, comp1Value: 680000000, comp2Value: 610000000 },
    // Segment: Бытовая химия
    { primaryGroup: 'Бытовая химия', secondaryGroup: '№12 Центральный', metricValue: 412000000, comp1Value: 390000000, comp2Value: 370000000 },
    { primaryGroup: 'Бытовая химия', secondaryGroup: '№8 Восточный', metricValue: 358000000, comp1Value: 370000000, comp2Value: 340000000 },
    // Segment: Алкоголь
    { primaryGroup: 'Алкоголь', secondaryGroup: '№5 Северный', metricValue: 298000000, comp1Value: 310000000, comp2Value: 280000000 },
    { primaryGroup: 'Алкоголь', secondaryGroup: '№22 Западный', metricValue: 245000000, comp1Value: 280000000, comp2Value: 260000000 },
    // Segment: Кондитерские изделия
    { primaryGroup: 'Кондитерские изделия', secondaryGroup: '№12 Центральный', metricValue: 342000000, comp1Value: 300000000, comp2Value: 290000000 },
    // Segment: Товары для дома
    { primaryGroup: 'Товары для дома', secondaryGroup: '№31 Южный', metricValue: 210000000, comp1Value: 200000000, comp2Value: 195000000 },
];
const MOCK_DETAIL_RAW = { rows: RAW_DETAIL_ROWS };
// ═══════════════════════════════════════
// Stories
// ═══════════════════════════════════════
/** Revenue card — dual mode, all deltas positive */
export const Revenue = {
    args: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        headerText: 'Выручка',
        modeCount: 'dual',
        toggleLabelA: '₽',
        toggleLabelB: '%',
        modeAView: REVENUE_A,
        modeBView: REVENUE_B,
        isDarkMode: false,
        theme: STUB_THEME,
        ...SHARED_PROPS,
    },
};
/** Revenue card — dark theme */
export const RevenueDark = {
    args: { ...Revenue.args, isDarkMode: true },
    parameters: { backgrounds: { default: 'dark' } },
};
/** Revenue card — single mode (no toggle) */
export const RevenueSingleMode = {
    args: {
        ...Revenue.args,
        modeCount: 'single',
    },
};
/**
 * Responsive grid matching kpi-cards-v1.html mockup breakpoints.
 * Cards auto-size to content; CSS Grid equalises row heights.
 */
const GRID_CSS = `
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 48px 24px;
  min-height: 100vh;
  align-content: start;
}
.kpi-grid > * {
  width: 100% !important;
  height: auto !important;
}
@media (max-width: 1024px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 428px) {
  .kpi-grid { grid-template-columns: 1fr; padding: 24px 16px; }
}
`;
function KpiGrid({ isDarkMode, withDetail, colorScheme1A, colorScheme1B, colorScheme2A, colorScheme2B, deltaFormat1A, deltaFormat2A, deltaFormat1B, deltaFormat2B, enableComp1, enableComp2, comp1Label, comp2Label, aggregationTypeA, aggregationTypeB, hierarchyLabelPrimary, hierarchyLabelSecondary, }) {
    const bg = isDarkMode ? '#0F1114' : '#F3F3F3';
    const detail = withDetail ? { detailDataRaw: MOCK_DETAIL_RAW } : {};
    // "Расходы" inverts color scheme: growth in expenses is bad
    const inv = (s) => s === 'green_up' ? 'green_down' : 'green_up';
    // Merge SHARED_PROPS with Storybook-controlled overrides
    const shared = {
        ...SHARED_PROPS,
        colorScheme1A,
        colorScheme1B,
        colorScheme2A,
        colorScheme2B,
        deltaFormat1A,
        deltaFormat2A,
        deltaFormat1B,
        deltaFormat2B,
        enableComp1,
        enableComp2,
        comp1Label,
        comp2Label,
        aggregationTypeA,
        aggregationTypeB,
        hierarchyLabelPrimary,
        hierarchyLabelSecondary,
    };
    const cards = [
        {
            headerText: 'Выручка', modeCount: 'dual',
            toggleLabelA: '₽', toggleLabelB: '%', modeAView: REVENUE_A, modeBView: REVENUE_B,
            isDarkMode, ...shared, ...detail,
        },
        {
            headerText: 'Расходы', modeCount: 'dual',
            toggleLabelA: '₽', toggleLabelB: '%', modeAView: EXPENSES_A, modeBView: EXPENSES_B,
            isDarkMode, ...shared,
            colorScheme1A: inv(colorScheme1A), colorScheme1B: inv(colorScheme1B),
            colorScheme2A: inv(colorScheme2A), colorScheme2B: inv(colorScheme2B),
            ...detail,
        },
        {
            headerText: 'Маржа', modeCount: 'dual',
            toggleLabelA: '₽', toggleLabelB: '%', modeAView: MARGIN_A, modeBView: MARGIN_B,
            isDarkMode, ...shared, ...detail,
        },
        {
            headerText: 'Конверсия', modeCount: 'dual',
            toggleLabelA: 'абс', toggleLabelB: '%', modeAView: CONVERSION_A, modeBView: CONVERSION_B,
            isDarkMode, ...shared, ...detail,
        },
    ];
    return (_jsxs(_Fragment, { children: [_jsx("style", { dangerouslySetInnerHTML: { __html: GRID_CSS } }), _jsx("div", { className: "kpi-grid", style: { background: bg }, children: cards.map(card => (_jsx(KpiCard, { width: 280, height: 170, theme: STUB_THEME, ...card }, card.headerText))) })] }));
}
/** Default args shared by all Grid stories */
const GRID_ARGS = {
    isDarkMode: false,
    colorScheme1A: 'green_up',
    colorScheme1B: 'green_up',
    colorScheme2A: 'green_up',
    colorScheme2B: 'green_up',
    deltaFormat1A: 'auto',
    deltaFormat2A: 'auto',
    deltaFormat1B: 'auto',
    deltaFormat2B: 'auto',
    enableComp1: true,
    enableComp2: true,
    comp1Label: 'План:',
    comp2Label: 'ПГ:',
    aggregationTypeA: 'SUM',
    aggregationTypeB: 'PERCENT',
    hierarchyLabelPrimary: 'Сегмент',
    hierarchyLabelSecondary: 'Магазин',
};
export const GridLight = {
    args: { ...GRID_ARGS },
    render: (args) => _jsx(KpiGrid, { ...args }),
    parameters: { backgrounds: { default: 'light' }, layout: 'fullscreen' },
};
export const GridDark = {
    args: { ...GRID_ARGS, isDarkMode: true },
    render: (args) => _jsx(KpiGrid, { ...args }),
    parameters: { backgrounds: { default: 'dark' }, layout: 'fullscreen' },
};
/** Grid with detail — click any card to open drill-down modal */
export const GridWithDetailLight = {
    args: { ...GRID_ARGS, withDetail: true },
    render: (args) => _jsx(KpiGrid, { ...args }),
    parameters: { backgrounds: { default: 'light' }, layout: 'fullscreen' },
};
/** Grid with detail — dark theme */
export const GridWithDetailDark = {
    args: { ...GRID_ARGS, isDarkMode: true, withDetail: true },
    render: (args) => _jsx(KpiGrid, { ...args }),
    parameters: { backgrounds: { default: 'dark' }, layout: 'fullscreen' },
};
/** Revenue card with detail drill-down — click to open modal */
export const RevenueWithDetail = {
    args: {
        ...Revenue.args,
        detailDataRaw: MOCK_DETAIL_RAW,
        width: 380,
    },
};
/** Revenue card with detail — dark theme */
export const RevenueWithDetailDark = {
    args: {
        ...Revenue.args,
        isDarkMode: true,
        detailDataRaw: MOCK_DETAIL_RAW,
    },
    parameters: { backgrounds: { default: 'dark' } },
};
//# sourceMappingURL=KpiCard.stories.js.map