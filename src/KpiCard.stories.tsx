import React from 'react';
import KpiCard from './KpiCard';
import { KpiCardProps, KpiViewData, DetailData } from './types';

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
    toggleMode: {
      control: 'select',
      options: ['abs_pct', 'none'],
    },
    headerText: { control: 'text' },
    detailData: { control: false },
    theme: { control: false },
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
const CARD_HEIGHT = 220;
const STUB_THEME = {} as KpiCardProps['theme'];

// ═══════════════════════════════════════════════
// Mock data — exact values from kpi-cards-v1.html
// ═══════════════════════════════════════════════

const REVENUE_ABS: KpiViewData = {
  value: '12,4 млрд',
  subtitle: '₽ за период',
  comparisons: [
    { label: 'План:', value: '11,2 млрд', delta: '+1,2 млрд', status: 'up' },
    { label: 'ПГ:', value: '10,8 млрд', delta: '+14,8%', status: 'up' },
  ],
};

const REVENUE_PCT: KpiViewData = {
  value: '+14,8%',
  subtitle: 'рост к ПГ',
  comparisons: [
    { label: 'План:', value: '+10,7%', delta: 'выше плана', status: 'up' },
    { label: 'Доля:', value: '42,1%', delta: '+1,3 п.п.', status: 'up' },
  ],
};

const EXPENSES_ABS: KpiViewData = {
  value: '3,2 млрд',
  subtitle: '₽ за период',
  comparisons: [
    { label: 'План:', value: '3,4 млрд', delta: '−0,2 млрд', status: 'up' },
    { label: 'ПГ:', value: '3,0 млрд', delta: '+6,7%', status: 'dn' },
  ],
};

const EXPENSES_PCT: KpiViewData = {
  value: '25,8%',
  subtitle: 'доля от выручки',
  comparisons: [
    { label: 'План:', value: '30,4%', delta: '−4,6 п.п.', status: 'up' },
    { label: 'ПГ:', value: '27,8%', delta: '−2,0 п.п.', status: 'up' },
  ],
};

const MARGIN_ABS: KpiViewData = {
  value: '9,2 млрд',
  subtitle: '₽ валовая прибыль',
  comparisons: [
    { label: 'План:', value: '8,1 млрд', delta: '+1,1 млрд', status: 'up' },
    { label: 'ПГ:', value: '8,2 млрд', delta: '+12,2%', status: 'up' },
  ],
};

const MARGIN_PCT: KpiViewData = {
  value: '74,2%',
  subtitle: 'валовая маржа',
  comparisons: [
    { label: 'План:', value: '72,0%', delta: '+2,2 п.п.', status: 'up' },
    { label: 'ПГ:', value: '76,3%', delta: '−2,1 п.п.', status: 'wn' },
  ],
};

const CONVERSION_ABS: KpiViewData = {
  value: '5,63%',
  subtitle: 'посетитель → покупатель',
  comparisons: [
    { label: 'План:', value: '5,50%', delta: '+0,13 п.п.', status: 'up' },
    { label: 'ПГ:', value: '4,41%', delta: '+1,22 п.п.', status: 'up' },
  ],
};

const CONVERSION_PCT: KpiViewData = {
  value: '+27,7%',
  subtitle: 'рост к ПГ',
  comparisons: [
    { label: 'План:', value: '+2,4%', delta: 'выше плана', status: 'up' },
    { label: 'ПГ:', value: '4,41%', delta: '+27,7%', status: 'up' },
  ],
};

// ═══════════════════════════════════════
// Detail modal — mock hierarchical data
// ═══════════════════════════════════════

const MOCK_DETAIL: DetailData = {
  bySegment: [
    {
      name: 'Продукты питания',
      summary: { name: 'Продукты питания', value: '4,82 млрд', planValue: '4,50 млрд', planDelta: '+7,1%', planStatus: 'up', prevValue: '4,12 млрд', prevDelta: '+17,0%', prevStatus: 'up' },
      children: [
        { name: '№12 Центральный', value: '892 млн', planValue: '840 млн', planDelta: '+6,2%', planStatus: 'up', prevValue: '780 млн', prevDelta: '+14,4%', prevStatus: 'up' },
        { name: '№5 Северный', value: '756 млн', planValue: '710 млн', planDelta: '+6,5%', planStatus: 'up', prevValue: '690 млн', prevDelta: '+9,6%', prevStatus: 'up' },
        { name: '№31 Южный', value: '644 млн', planValue: '680 млн', planDelta: '−5,3%', planStatus: 'dn', prevValue: '610 млн', prevDelta: '+5,6%', prevStatus: 'up' },
      ],
    },
    {
      name: 'Бытовая химия',
      summary: { name: 'Бытовая химия', value: '2,31 млрд', planValue: '2,20 млрд', planDelta: '+5,0%', planStatus: 'up', prevValue: '2,05 млрд', prevDelta: '+12,7%', prevStatus: 'up' },
      children: [
        { name: '№12 Центральный', value: '412 млн', planValue: '390 млн', planDelta: '+5,6%', planStatus: 'up', prevValue: '370 млн', prevDelta: '+11,4%', prevStatus: 'up' },
        { name: '№8 Восточный', value: '358 млн', planValue: '370 млн', planDelta: '−3,2%', planStatus: 'dn', prevValue: '340 млн', prevDelta: '+5,3%', prevStatus: 'up' },
      ],
    },
    {
      name: 'Алкоголь',
      summary: { name: 'Алкоголь', value: '1,98 млрд', planValue: '2,10 млрд', planDelta: '−5,7%', planStatus: 'wn', prevValue: '1,85 млрд', prevDelta: '+7,0%', prevStatus: 'up' },
      children: [
        { name: '№5 Северный', value: '298 млн', planValue: '310 млн', planDelta: '−3,9%', planStatus: 'wn', prevValue: '280 млн', prevDelta: '+6,4%', prevStatus: 'up' },
        { name: '№22 Западный', value: '245 млн', planValue: '280 млн', planDelta: '−12,5%', planStatus: 'dn', prevValue: '260 млн', prevDelta: '−5,8%', prevStatus: 'dn' },
      ],
    },
    {
      name: 'Кондитерские изделия',
      summary: { name: 'Кондитерские изделия', value: '1,64 млрд', planValue: '1,50 млрд', planDelta: '+9,3%', planStatus: 'up', prevValue: '1,40 млрд', prevDelta: '+17,1%', prevStatus: 'up' },
      children: [
        { name: '№12 Центральный', value: '342 млн', planValue: '300 млн', planDelta: '+14,0%', planStatus: 'up', prevValue: '290 млн', prevDelta: '+17,9%', prevStatus: 'up' },
      ],
    },
    {
      name: 'Товары для дома',
      summary: { name: 'Товары для дома', value: '1,15 млрд', planValue: '1,10 млрд', planDelta: '+4,5%', planStatus: 'up', prevValue: '1,08 млрд', prevDelta: '+6,5%', prevStatus: 'up' },
      children: [
        { name: '№31 Южный', value: '210 млн', planValue: '200 млн', planDelta: '+5,0%', planStatus: 'up', prevValue: '195 млн', prevDelta: '+7,7%', prevStatus: 'up' },
      ],
    },
  ],
  byStore: [
    {
      name: '№12 Центральный',
      summary: { name: '№12 Центральный', value: '1,65 млрд', planValue: '1,53 млрд', planDelta: '+7,8%', planStatus: 'up', prevValue: '1,44 млрд', prevDelta: '+14,6%', prevStatus: 'up' },
      children: [
        { name: 'Продукты питания', value: '892 млн', planValue: '840 млн', planDelta: '+6,2%', planStatus: 'up', prevValue: '780 млн', prevDelta: '+14,4%', prevStatus: 'up' },
        { name: 'Бытовая химия', value: '412 млн', planValue: '390 млн', planDelta: '+5,6%', planStatus: 'up', prevValue: '370 млн', prevDelta: '+11,4%', prevStatus: 'up' },
        { name: 'Кондитерские изделия', value: '342 млн', planValue: '300 млн', planDelta: '+14,0%', planStatus: 'up', prevValue: '290 млн', prevDelta: '+17,9%', prevStatus: 'up' },
      ],
    },
    {
      name: '№5 Северный',
      summary: { name: '№5 Северный', value: '1,05 млрд', planValue: '1,02 млрд', planDelta: '+2,9%', planStatus: 'up', prevValue: '0,97 млрд', prevDelta: '+8,2%', prevStatus: 'up' },
      children: [
        { name: 'Продукты питания', value: '756 млн', planValue: '710 млн', planDelta: '+6,5%', planStatus: 'up', prevValue: '690 млн', prevDelta: '+9,6%', prevStatus: 'up' },
        { name: 'Алкоголь', value: '298 млн', planValue: '310 млн', planDelta: '−3,9%', planStatus: 'wn', prevValue: '280 млн', prevDelta: '+6,4%', prevStatus: 'up' },
      ],
    },
    {
      name: '№31 Южный',
      summary: { name: '№31 Южный', value: '854 млн', planValue: '880 млн', planDelta: '−3,0%', planStatus: 'wn', prevValue: '805 млн', prevDelta: '+6,1%', prevStatus: 'up' },
      children: [
        { name: 'Продукты питания', value: '644 млн', planValue: '680 млн', planDelta: '−5,3%', planStatus: 'dn', prevValue: '610 млн', prevDelta: '+5,6%', prevStatus: 'up' },
        { name: 'Товары для дома', value: '210 млн', planValue: '200 млн', planDelta: '+5,0%', planStatus: 'up', prevValue: '195 млн', prevDelta: '+7,7%', prevStatus: 'up' },
      ],
    },
    {
      name: '№8 Восточный',
      summary: { name: '№8 Восточный', value: '358 млн', planValue: '370 млн', planDelta: '−3,2%', planStatus: 'dn', prevValue: '340 млн', prevDelta: '+5,3%', prevStatus: 'up' },
      children: [
        { name: 'Бытовая химия', value: '358 млн', planValue: '370 млн', planDelta: '−3,2%', planStatus: 'dn', prevValue: '340 млн', prevDelta: '+5,3%', prevStatus: 'up' },
      ],
    },
    {
      name: '№22 Западный',
      summary: { name: '№22 Западный', value: '245 млн', planValue: '280 млн', planDelta: '−12,5%', planStatus: 'dn', prevValue: '260 млн', prevDelta: '−5,8%', prevStatus: 'dn' },
      children: [
        { name: 'Алкоголь', value: '245 млн', planValue: '280 млн', planDelta: '−12,5%', planStatus: 'dn', prevValue: '260 млн', prevDelta: '−5,8%', prevStatus: 'dn' },
      ],
    },
  ],
};

// ═══════════════════════════════════════
// Stories
// ═══════════════════════════════════════

/** Revenue card — all deltas positive */
export const Revenue = {
  args: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    headerText: 'Выручка',
    toggleMode: 'abs_pct' as const,
    toggleLabelAbs: '₽',
    toggleLabelPct: '%',
    absView: REVENUE_ABS,
    pctView: REVENUE_PCT,
    isDarkMode: false,
    theme: STUB_THEME,
  },
};

/** Revenue card — dark theme */
export const RevenueDark = {
  args: { ...Revenue.args, isDarkMode: true },
  parameters: { backgrounds: { default: 'dark' } },
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
  const detail = withDetail ? { detailData: MOCK_DETAIL } : {};
  const cards: Array<Omit<KpiCardProps, 'width' | 'height' | 'theme'>> = [
    { headerText: 'Выручка', toggleMode: 'abs_pct', toggleLabelAbs: '₽', toggleLabelPct: '%', absView: REVENUE_ABS, pctView: REVENUE_PCT, isDarkMode, ...detail },
    { headerText: 'Расходы', toggleMode: 'abs_pct', toggleLabelAbs: '₽', toggleLabelPct: '%', absView: EXPENSES_ABS, pctView: EXPENSES_PCT, isDarkMode, ...detail },
    { headerText: 'Маржа', toggleMode: 'abs_pct', toggleLabelAbs: '₽', toggleLabelPct: '%', absView: MARGIN_ABS, pctView: MARGIN_PCT, isDarkMode, ...detail },
    { headerText: 'Конверсия', toggleMode: 'abs_pct', toggleLabelAbs: 'абс', toggleLabelPct: '%', absView: CONVERSION_ABS, pctView: CONVERSION_PCT, isDarkMode, ...detail },
  ];

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: GRID_CSS }} />
      <div className="kpi-grid" style={{ background: bg }}>
        {cards.map(card => (
          <KpiCard key={card.headerText} width={280} height={220} theme={STUB_THEME} {...card} />
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
    detailData: MOCK_DETAIL,
  },
};

/** Revenue card with detail — dark theme */
export const RevenueWithDetailDark = {
  args: {
    ...Revenue.args,
    isDarkMode: true,
    detailData: MOCK_DETAIL,
  },
  parameters: { backgrounds: { default: 'dark' } },
};
