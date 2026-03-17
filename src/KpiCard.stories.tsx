import React from 'react';
import KpiCard from './KpiCard';
import {
  KpiCardProps,
  KpiViewData,
  DetailDataRaw,
  RawDetailRow,
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
    colorSchemeA: { control: 'select', options: ['green_up', 'green_down'] },
    colorSchemeB: { control: 'select', options: ['green_up', 'green_down'] },
    aggregationTypeA: { control: 'select', options: ['SUM', 'PERCENT', 'AVERAGE', 'MAX', 'MIN'] },
    aggregationTypeB: { control: 'select', options: ['SUM', 'PERCENT', 'AVERAGE', 'MAX', 'MIN'] },
    enablePlan: { control: 'boolean' },
    enableYoy: { control: 'boolean' },
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
const SHARED_PROPS: Pick<
  KpiCardProps,
  | 'colorSchemeA' | 'colorSchemeB'
  | 'enablePlan' | 'enableYoy'
  | 'hierarchyLabelPrimary' | 'hierarchyLabelSecondary'
  | 'aggregationTypeA' | 'aggregationTypeB'
  | 'formatValueA' | 'formatValueB' | 'formatDelta'
  | 'detailTopN'
> = {
  colorSchemeA: 'green_up',
  colorSchemeB: 'green_up',
  enablePlan: true,
  enableYoy: true,
  hierarchyLabelPrimary: 'Сегмент',
  hierarchyLabelSecondary: 'Магазин',
  aggregationTypeA: 'SUM',
  aggregationTypeB: 'PERCENT',
  formatValueA: fmtValue,
  formatValueB: (n: number) => formatRussianPercent(n, false),
  formatDelta: fmtDelta,
  detailTopN: 0,
};

// ═══════════════════════════════════════════════
// Mock data — exact values from kpi-cards-v1.html
// ═══════════════════════════════════════════════

const REVENUE_A: KpiViewData = {
  value: '12,4 млрд',
  subtitle: '₽ за период',
  comparisons: [
    { label: 'План:', value: '11,2 млрд', delta: '+1,2 млрд', status: 'up', type: 'plan' },
    { label: 'ПГ:', value: '10,8 млрд', delta: '+14,8%', status: 'up', type: 'yoy' },
  ],
};

const REVENUE_B: KpiViewData = {
  value: '+14,8%',
  subtitle: 'рост к ПГ',
  comparisons: [
    { label: 'План:', value: '+10,7%', delta: 'выше плана', status: 'up', type: 'plan' },
    { label: 'Доля:', value: '42,1%', delta: '+1,3 п.п.', status: 'up', type: 'yoy' },
  ],
};

const EXPENSES_A: KpiViewData = {
  value: '3,2 млрд',
  subtitle: '₽ за период',
  comparisons: [
    { label: 'План:', value: '3,4 млрд', delta: '−0,2 млрд', status: 'up', type: 'plan' },
    { label: 'ПГ:', value: '3,0 млрд', delta: '+6,7%', status: 'dn', type: 'yoy' },
  ],
};

const EXPENSES_B: KpiViewData = {
  value: '25,8%',
  subtitle: 'доля от выручки',
  comparisons: [
    { label: 'План:', value: '30,4%', delta: '−4,6 п.п.', status: 'up', type: 'plan' },
    { label: 'ПГ:', value: '27,8%', delta: '−2,0 п.п.', status: 'up', type: 'yoy' },
  ],
};

const MARGIN_A: KpiViewData = {
  value: '9,2 млрд',
  subtitle: '₽ валовая прибыль',
  comparisons: [
    { label: 'План:', value: '8,1 млрд', delta: '+1,1 млрд', status: 'up', type: 'plan' },
    { label: 'ПГ:', value: '8,2 млрд', delta: '+12,2%', status: 'up', type: 'yoy' },
  ],
};

const MARGIN_B: KpiViewData = {
  value: '74,2%',
  subtitle: 'валовая маржа',
  comparisons: [
    { label: 'План:', value: '72,0%', delta: '+2,2 п.п.', status: 'up', type: 'plan' },
    { label: 'ПГ:', value: '76,3%', delta: '−2,1 п.п.', status: 'wn', type: 'yoy' },
  ],
};

const CONVERSION_A: KpiViewData = {
  value: '5,63%',
  subtitle: 'посетитель → покупатель',
  comparisons: [
    { label: 'План:', value: '5,50%', delta: '+0,13 п.п.', status: 'up', type: 'plan' },
    { label: 'ПГ:', value: '4,41%', delta: '+1,22 п.п.', status: 'up', type: 'yoy' },
  ],
};

const CONVERSION_B: KpiViewData = {
  value: '+27,7%',
  subtitle: 'рост к ПГ',
  comparisons: [
    { label: 'План:', value: '+2,4%', delta: 'выше плана', status: 'up', type: 'plan' },
    { label: 'ПГ:', value: '4,41%', delta: '+27,7%', status: 'up', type: 'yoy' },
  ],
};

// ═══════════════════════════════════════
// Detail modal — raw numeric rows
// ═══════════════════════════════════════

const RAW_DETAIL_ROWS: RawDetailRow[] = [
  // Segment: Продукты питания
  { primaryGroup: 'Продукты питания', secondaryGroup: '№12 Центральный', metricValue: 892_000_000, planValue: 840_000_000, prevValue: 780_000_000 },
  { primaryGroup: 'Продукты питания', secondaryGroup: '№5 Северный', metricValue: 756_000_000, planValue: 710_000_000, prevValue: 690_000_000 },
  { primaryGroup: 'Продукты питания', secondaryGroup: '№31 Южный', metricValue: 644_000_000, planValue: 680_000_000, prevValue: 610_000_000 },
  // Segment: Бытовая химия
  { primaryGroup: 'Бытовая химия', secondaryGroup: '№12 Центральный', metricValue: 412_000_000, planValue: 390_000_000, prevValue: 370_000_000 },
  { primaryGroup: 'Бытовая химия', secondaryGroup: '№8 Восточный', metricValue: 358_000_000, planValue: 370_000_000, prevValue: 340_000_000 },
  // Segment: Алкоголь
  { primaryGroup: 'Алкоголь', secondaryGroup: '№5 Северный', metricValue: 298_000_000, planValue: 310_000_000, prevValue: 280_000_000 },
  { primaryGroup: 'Алкоголь', secondaryGroup: '№22 Западный', metricValue: 245_000_000, planValue: 280_000_000, prevValue: 260_000_000 },
  // Segment: Кондитерские изделия
  { primaryGroup: 'Кондитерские изделия', secondaryGroup: '№12 Центральный', metricValue: 342_000_000, planValue: 300_000_000, prevValue: 290_000_000 },
  // Segment: Товары для дома
  { primaryGroup: 'Товары для дома', secondaryGroup: '№31 Южный', metricValue: 210_000_000, planValue: 200_000_000, prevValue: 195_000_000 },
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
    modeCount: 'dual' as const,
    modeAName: 'Рубли',
    modeBName: 'Проценты',
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

function KpiGrid({ isDarkMode, withDetail }: { isDarkMode: boolean; withDetail?: boolean }) {
  const bg = isDarkMode ? '#0F1114' : '#F3F3F3';
  const detail = withDetail ? { detailDataRaw: MOCK_DETAIL_RAW } : {};

  const cards: Array<Omit<KpiCardProps, 'width' | 'height' | 'theme'>> = [
    {
      headerText: 'Выручка', modeCount: 'dual', modeAName: 'Рубли', modeBName: 'Проценты',
      toggleLabelA: '₽', toggleLabelB: '%', modeAView: REVENUE_A, modeBView: REVENUE_B,
      isDarkMode, ...SHARED_PROPS, ...detail,
    },
    {
      headerText: 'Расходы', modeCount: 'dual', modeAName: 'Рубли', modeBName: 'Проценты',
      toggleLabelA: '₽', toggleLabelB: '%', modeAView: EXPENSES_A, modeBView: EXPENSES_B,
      isDarkMode, ...SHARED_PROPS, colorSchemeA: 'green_down', colorSchemeB: 'green_down', ...detail,
    },
    {
      headerText: 'Маржа', modeCount: 'dual', modeAName: 'Рубли', modeBName: 'Проценты',
      toggleLabelA: '₽', toggleLabelB: '%', modeAView: MARGIN_A, modeBView: MARGIN_B,
      isDarkMode, ...SHARED_PROPS, ...detail,
    },
    {
      headerText: 'Конверсия', modeCount: 'dual', modeAName: 'абс', modeBName: 'Проценты',
      toggleLabelA: 'абс', toggleLabelB: '%', modeAView: CONVERSION_A, modeBView: CONVERSION_B,
      isDarkMode, ...SHARED_PROPS, ...detail,
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

export const GridLight = {
  render: () => <KpiGrid isDarkMode={false} />,
  parameters: { backgrounds: { default: 'light' }, layout: 'fullscreen' },
};

export const GridDark = {
  render: () => <KpiGrid isDarkMode />,
  parameters: { backgrounds: { default: 'dark' }, layout: 'fullscreen' },
};

/** Grid with detail — click any card to open drill-down modal */
export const GridWithDetailLight = {
  render: () => <KpiGrid isDarkMode={false} withDetail />,
  parameters: { backgrounds: { default: 'light' }, layout: 'fullscreen' },
};

/** Grid with detail — dark theme */
export const GridWithDetailDark = {
  render: () => <KpiGrid isDarkMode withDetail />,
  parameters: { backgrounds: { default: 'dark' }, layout: 'fullscreen' },
};

/** Revenue card with detail drill-down — click to open modal */
export const RevenueWithDetail = {
  args: {
    ...Revenue.args,
    detailDataRaw: MOCK_DETAIL_RAW,
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
