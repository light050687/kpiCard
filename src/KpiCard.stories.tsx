import React from 'react';
import KpiCard from './KpiCard';
import {
  KpiCardProps,
  KpiViewData,
  DataState,
  DetailDataRaw,
  RawDetailRow,
  ComparisonColorScheme,
} from './types';
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
    showDelta1: { control: 'boolean' },
    showDelta2: { control: 'boolean' },
    enableComp1: { control: 'boolean' },
    enableComp2: { control: 'boolean' },
    comp1Label: { control: 'text' },
    comp2Label: { control: 'text' },
    hierarchyLabelPrimary: { control: 'text' },
    hierarchyLabelSecondary: { control: 'text' },
    // Hidden from Storybook controls
    dataState: { control: false },
    deltaFormat1A: { control: false },
    deltaFormat2A: { control: false },
    deltaFormat1B: { control: false },
    deltaFormat2B: { control: false },
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
    (Story: React.ComponentType) => (
      <>
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <Story />
      </>
    ),
  ],
};

// ── Shared defaults ──
const CARD_WIDTH = 370;
const CARD_HEIGHT = 170;
const STUB_THEME = {} as KpiCardProps['theme'];

// ── Formatters (used in stories, in production these come from transformProps) ──
const fmtValue = formatRussianSmart;
const fmtDelta = (n: number) => formatRussianPercent(n, true);

// ── Shared props that every card story needs ──
// ── Identity formatter for storybook ──
const fmtIdentity = (n: number) => String(n);

const SHARED_PROPS: Pick<
  KpiCardProps,
  | 'colorScheme1A' | 'colorScheme1B' | 'colorScheme2A' | 'colorScheme2B'
  | 'deltaFormat1A' | 'deltaFormat2A' | 'deltaFormat1B' | 'deltaFormat2B'
  | 'formatComp1A' | 'formatComp2A' | 'formatDelta1A' | 'formatDelta2A'
  | 'formatComp1B' | 'formatComp2B' | 'formatDelta1B' | 'formatDelta2B'
  | 'detailColFact' | 'detailColComp1' | 'detailColDelta1' | 'detailColComp2' | 'detailColDelta2'
  | 'enableComp1' | 'enableComp2'
  | 'comp1Label' | 'comp2Label'
  | 'showDelta1' | 'showDelta2'
  | 'hierarchyLabelPrimary' | 'hierarchyLabelSecondary'
  | 'formatValueA' | 'formatValueB' | 'formatDelta'
  | 'detailTopN' | 'detailPageSize'
> = {
  colorScheme1A: 'green_up',
  colorScheme1B: 'green_up',
  colorScheme2A: 'green_up',
  colorScheme2B: 'green_up',
  deltaFormat1A: 'auto',
  deltaFormat2A: 'auto',
  deltaFormat1B: 'auto',
  deltaFormat2B: 'auto',
  formatComp1A: fmtValue,
  formatComp2A: fmtValue,
  formatDelta1A: fmtIdentity,
  formatDelta2A: fmtIdentity,
  formatComp1B: fmtValue,
  formatComp2B: fmtValue,
  formatDelta1B: fmtIdentity,
  formatDelta2B: fmtIdentity,
  detailColFact: 'Факт',
  detailColComp1: '',
  detailColDelta1: 'Дельта',
  detailColComp2: '',
  detailColDelta2: 'Дельта',
  enableComp1: true,
  enableComp2: true,
  comp1Label: 'ПГ:',
  comp2Label: 'ПЛАН:',
  showDelta1: true,
  showDelta2: true,
  hierarchyLabelPrimary: 'Магазин',
  hierarchyLabelSecondary: 'Сегмент',
  formatValueA: fmtValue,
  formatValueB: (n: number) => formatRussianPercent(n, false),
  formatDelta: fmtDelta,
  detailTopN: 0,
  detailPageSize: 20,
};

// ═══════════════════════════════════════════════
// Mock data — exact values from kpi-cards-v1.html
// ═══════════════════════════════════════════════

const REVENUE_A: KpiViewData = {
  value: '12,4 млрд',
  subtitle: '₽ за период',
  comparisons: [
    { label: 'План:', value: '11,2 млрд', delta: '+1,2 млрд', status: 'up', type: 'comp1', rawDiff: 1_200_000_000, rawRef: 11_200_000_000 },
    { label: 'ПГ:', value: '10,8 млрд', delta: '+14,8%', status: 'up', type: 'comp2', rawDiff: 1_600_000_000, rawRef: 10_800_000_000 },
  ],
};

const REVENUE_B: KpiViewData = {
  value: '+14,8%',
  subtitle: 'рост к ПГ',
  comparisons: [
    { label: 'План:', value: '+10,7%', delta: '+4,1 п.п.', status: 'up', type: 'comp1', rawDiff: 0.041, rawRef: 0.107 },
    { label: 'Доля:', value: '42,1%', delta: '+1,3 п.п.', status: 'up', type: 'comp2', rawDiff: 0.013, rawRef: 0.408 },
  ],
};

const EXPENSES_A: KpiViewData = {
  value: '3,2 млрд',
  subtitle: '₽ за период',
  comparisons: [
    { label: 'План:', value: '3,4 млрд', delta: '−0,2 млрд', status: 'up', type: 'comp1', rawDiff: -200_000_000, rawRef: 3_400_000_000 },
    { label: 'ПГ:', value: '3,0 млрд', delta: '+6,7%', status: 'dn', type: 'comp2', rawDiff: 200_000_000, rawRef: 3_000_000_000 },
  ],
};

const EXPENSES_B: KpiViewData = {
  value: '25,8%',
  subtitle: 'доля от выручки',
  comparisons: [
    { label: 'План:', value: '30,4%', delta: '−4,6 п.п.', status: 'up', type: 'comp1', rawDiff: -0.046, rawRef: 0.304 },
    { label: 'ПГ:', value: '27,8%', delta: '−2,0 п.п.', status: 'up', type: 'comp2', rawDiff: -0.020, rawRef: 0.278 },
  ],
};

const MARGIN_A: KpiViewData = {
  value: '9,2 млрд',
  subtitle: '₽ валовая прибыль',
  comparisons: [
    { label: 'План:', value: '8,1 млрд', delta: '+1,1 млрд', status: 'up', type: 'comp1', rawDiff: 1_100_000_000, rawRef: 8_100_000_000 },
    { label: 'ПГ:', value: '8,2 млрд', delta: '+12,2%', status: 'up', type: 'comp2', rawDiff: 1_000_000_000, rawRef: 8_200_000_000 },
  ],
};

const MARGIN_B: KpiViewData = {
  value: '74,2%',
  subtitle: 'валовая маржа',
  comparisons: [
    { label: 'План:', value: '72,0%', delta: '+2,2 п.п.', status: 'up', type: 'comp1', rawDiff: 0.022, rawRef: 0.720 },
    { label: 'ПГ:', value: '76,3%', delta: '−2,1 п.п.', status: 'wn', type: 'comp2', rawDiff: -0.021, rawRef: 0.763 },
  ],
};

const CONVERSION_A: KpiViewData = {
  value: '5,63%',
  subtitle: 'посетитель → покупатель',
  comparisons: [
    { label: 'План:', value: '5,50%', delta: '+0,13 п.п.', status: 'up', type: 'comp1', rawDiff: 0.0013, rawRef: 0.0550 },
    { label: 'ПГ:', value: '4,41%', delta: '+1,22 п.п.', status: 'up', type: 'comp2', rawDiff: 0.0122, rawRef: 0.0441 },
  ],
};

const CONVERSION_B: KpiViewData = {
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

const RAW_DETAIL_ROWS: RawDetailRow[] = [
  // Segment: Продукты питания
  { primaryGroup: 'Продукты питания', secondaryGroup: '№12 Центральный', metricValue: 892_000_000, comp1Value: 840_000_000, comp2Value: 780_000_000 },
  { primaryGroup: 'Продукты питания', secondaryGroup: '№5 Северный', metricValue: 756_000_000, comp1Value: 710_000_000, comp2Value: 690_000_000 },
  { primaryGroup: 'Продукты питания', secondaryGroup: '№31 Южный', metricValue: 644_000_000, comp1Value: 680_000_000, comp2Value: 610_000_000 },
  // Segment: Бытовая химия
  { primaryGroup: 'Бытовая химия', secondaryGroup: '№12 Центральный', metricValue: 412_000_000, comp1Value: 390_000_000, comp2Value: 370_000_000 },
  { primaryGroup: 'Бытовая химия', secondaryGroup: '№8 Восточный', metricValue: 358_000_000, comp1Value: 370_000_000, comp2Value: 340_000_000 },
  // Segment: Алкоголь
  { primaryGroup: 'Алкоголь', secondaryGroup: '№5 Северный', metricValue: 298_000_000, comp1Value: 310_000_000, comp2Value: 280_000_000 },
  { primaryGroup: 'Алкоголь', secondaryGroup: '№22 Западный', metricValue: 245_000_000, comp1Value: 280_000_000, comp2Value: 260_000_000 },
  // Segment: Кондитерские изделия
  { primaryGroup: 'Кондитерские изделия', secondaryGroup: '№12 Центральный', metricValue: 342_000_000, comp1Value: 300_000_000, comp2Value: 290_000_000 },
  // Segment: Товары для дома
  { primaryGroup: 'Товары для дома', secondaryGroup: '№31 Южный', metricValue: 210_000_000, comp1Value: 200_000_000, comp2Value: 195_000_000 },
];

const MOCK_DETAIL_RAW: DetailDataRaw = { rows: RAW_DETAIL_ROWS };

// ═══════════════════════════════════════
// Stories
// ═══════════════════════════════════════

/** Revenue card — dual mode, all deltas positive */
export const Revenue = {
  args: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    headerText: 'Выручка',
    dataState: 'populated' as DataState,
    modeCount: 'dual' as const,
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
    modeCount: 'single' as const,
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

/** Props forwarded from Storybook args to KpiGrid */
interface KpiGridOverrides {
  isDarkMode: boolean;
  withDetail?: boolean;
  colorScheme1A: ComparisonColorScheme;
  colorScheme1B: ComparisonColorScheme;
  colorScheme2A: ComparisonColorScheme;
  colorScheme2B: ComparisonColorScheme;
  enableComp1: boolean;
  enableComp2: boolean;
  comp1Label: string;
  comp2Label: string;
  showDelta1: boolean;
  showDelta2: boolean;
  hierarchyLabelPrimary: string;
  hierarchyLabelSecondary: string;
}

function KpiGrid({
  isDarkMode,
  withDetail,
  colorScheme1A,
  colorScheme1B,
  colorScheme2A,
  colorScheme2B,
  enableComp1,
  enableComp2,
  comp1Label,
  comp2Label,
  showDelta1,
  showDelta2,
  hierarchyLabelPrimary,
  hierarchyLabelSecondary,
}: KpiGridOverrides) {
  const bg = isDarkMode ? '#0F1114' : '#F3F3F3';
  const detail = withDetail ? { detailDataRaw: MOCK_DETAIL_RAW } : {};

  // "Расходы" inverts color scheme: growth in expenses is bad
  const inv = (s: ComparisonColorScheme): ComparisonColorScheme =>
    s === 'green_up' ? 'green_down' : 'green_up';

  // Merge SHARED_PROPS with Storybook-controlled overrides
  const shared = {
    ...SHARED_PROPS,
    colorScheme1A,
    colorScheme1B,
    colorScheme2A,
    colorScheme2B,
    enableComp1,
    enableComp2,
    comp1Label,
    comp2Label,
    showDelta1,
    showDelta2,
    hierarchyLabelPrimary,
    hierarchyLabelSecondary,
  };

  const cards: Array<Omit<KpiCardProps, 'width' | 'height' | 'theme'>> = [
    {
      headerText: 'Выручка', dataState: 'populated', modeCount: 'dual',
      toggleLabelA: '₽', toggleLabelB: '%', modeAView: REVENUE_A, modeBView: REVENUE_B,
      isDarkMode, ...shared, ...detail,
    },
    {
      headerText: 'Расходы', dataState: 'populated', modeCount: 'dual',
      toggleLabelA: '₽', toggleLabelB: '%', modeAView: EXPENSES_A, modeBView: EXPENSES_B,
      isDarkMode, ...shared,
      colorScheme1A: inv(colorScheme1A), colorScheme1B: inv(colorScheme1B),
      colorScheme2A: inv(colorScheme2A), colorScheme2B: inv(colorScheme2B),
      ...detail,
    },
    {
      headerText: 'Маржа', dataState: 'populated', modeCount: 'dual',
      toggleLabelA: '₽', toggleLabelB: '%', modeAView: MARGIN_A, modeBView: MARGIN_B,
      isDarkMode, ...shared, ...detail,
    },
    {
      headerText: 'Конверсия', dataState: 'populated', modeCount: 'dual',
      toggleLabelA: 'абс', toggleLabelB: '%', modeAView: CONVERSION_A, modeBView: CONVERSION_B,
      isDarkMode, ...shared, ...detail,
    },
  ];

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: GRID_CSS }} />
      <div className="kpi-grid" style={{ background: bg }}>
        {cards.map(card => (
          <KpiCard key={card.headerText} width={280} height={170} theme={STUB_THEME} {...card} />
        ))}
      </div>
    </>
  );
}

/** Default args shared by all Grid stories */
const GRID_ARGS: KpiGridOverrides = {
  isDarkMode: false,
  colorScheme1A: 'green_up',
  colorScheme1B: 'green_up',
  colorScheme2A: 'green_up',
  colorScheme2B: 'green_up',
  enableComp1: true,
  enableComp2: true,
  comp1Label: 'ПГ:',
  comp2Label: 'ПЛАН:',
  showDelta1: true,
  showDelta2: true,
  hierarchyLabelPrimary: 'Магазин',
  hierarchyLabelSecondary: 'Сегмент',
};

export const GridLight = {
  args: { ...GRID_ARGS },
  render: (args: KpiGridOverrides) => <KpiGrid {...args} />,
  parameters: { backgrounds: { default: 'light' }, layout: 'fullscreen' },
};

export const GridDark = {
  args: { ...GRID_ARGS, isDarkMode: true },
  render: (args: KpiGridOverrides) => <KpiGrid {...args} />,
  parameters: { backgrounds: { default: 'dark' }, layout: 'fullscreen' },
};

/** Grid with detail — click any card to open drill-down modal */
export const GridWithDetailLight = {
  args: { ...GRID_ARGS, withDetail: true },
  render: (args: KpiGridOverrides) => <KpiGrid {...args} />,
  parameters: { backgrounds: { default: 'light' }, layout: 'fullscreen' },
};

/** Grid with detail — dark theme */
export const GridWithDetailDark = {
  args: { ...GRID_ARGS, isDarkMode: true, withDetail: true },
  render: (args: KpiGridOverrides) => <KpiGrid {...args} />,
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

// ═══════════════════════════════════════
// Edge case stories (Design System v2.0)
// ═══════════════════════════════════════

const EMPTY_VIEW: KpiViewData = {
  value: '0',
  subtitle: '',
  comparisons: [],
};

/** Empty state — no data returned from query */
export const EmptyState = {
  args: {
    ...Revenue.args,
    dataState: 'empty' as DataState,
    modeAView: EMPTY_VIEW,
    modeBView: EMPTY_VIEW,
  },
};

/** Empty state — dark theme */
export const EmptyStateDark = {
  args: { ...EmptyState.args, isDarkMode: true },
  parameters: { backgrounds: { default: 'dark' } },
};

/** Partial state — Mode A has data, Mode B is zero */
export const PartialState = {
  args: {
    ...Revenue.args,
    dataState: 'partial' as DataState,
    modeBView: EMPTY_VIEW,
  },
};

/** Negative values — expenses exceeding budget */
export const NegativeValues = {
  args: {
    ...Revenue.args,
    headerText: 'Убыток',
    modeAView: {
      value: '−1,2 млрд',
      subtitle: '₽ за период',
      comparisons: [
        { label: 'План:', value: '0,5 млрд', delta: '−1,7 млрд', status: 'dn' as const, type: 'comp1' as const, rawDiff: -1_700_000_000, rawRef: 500_000_000 },
        { label: 'ПГ:', value: '−0,3 млрд', delta: '−0,9 млрд', status: 'dn' as const, type: 'comp2' as const, rawDiff: -900_000_000, rawRef: -300_000_000 },
      ],
    } satisfies KpiViewData,
  },
};

/** Long header text — overflow handling */
export const LongTitle = {
  args: {
    ...Revenue.args,
    headerText: 'Выручка по всем каналам продаж включая онлайн и офлайн магазины за текущий квартал',
  },
};

/** Single mode — toggle hidden */
export const SingleMode = {
  args:{
    ...Revenue.args,
    modeCount:'single' as const
  },
};

