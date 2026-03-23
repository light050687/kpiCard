import { useState, useEffect, useRef } from 'react';
import {
  KpiCardProps,
  KpiViewData,
  ComparisonItem as CmpItem,
  ComparisonColorScheme,
  DeltaStatus,
  DeltaFormat,
  AggregationType,
} from './types';
import {
  formatRussianPercent,
  formatDeltaByFormat,
} from './utils/formatRussian';
import {
  CARD_CLASS,
  KEYFRAMES_CSS,
  KpiCardRoot,
  Card,
  CardHead,
  CardTitle,
  ToggleGroup,
  ToggleButton,
  DataContainer,
  DataLayer,
  HeroValue,
  Subtitle,
  ComparisonSection,
  ComparisonItem,
  ComparisonLabel,
  ComparisonValue,
  DeltaPill,
  EmptyStateWrap,
  EmptyStateIcon,
  EmptyStateText,
  PartialBadge,
} from './styles';
import DetailModal from './DetailModal';

/* ── Counter animation ──────────────────────────────────────────────
 * The integer part of the hero value counts up from 0 → target.
 * Easing: cubic-bezier(.4,0,.2,1) ≈ easeOutQuart.
 * ────────────────────────────────────────────────────────────────── */

const COUNTER_DELAY_MS = 250;

function easeOutQuart(t: number): number {
  return 1 - (1 - t) ** 4;
}

function counterDuration(target: number): number {
  return Math.min(1200, 700 + target * 30);
}

function parseHeroInt(
  value: string,
): { prefix: string; num: number; suffix: string } | null {
  const m = value.match(/^(.*?)(\d+)([\s\S]*)$/);
  if (!m) return null;
  return { prefix: m[1], num: parseInt(m[2], 10), suffix: m[3] };
}

function useCountUp(target: number, duration: number, delay: number): number {
  const [current, setCurrent] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (target <= 0) {
      setCurrent(target);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const start = performance.now();
      const tick = (now: number): void => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        setCurrent(Math.round(target * easeOutQuart(progress)));
        if (progress < 1) {
          raf.current = requestAnimationFrame(tick);
        }
      };
      raf.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf.current);
    };
  }, [target, duration, delay]);

  return current;
}

function AnimatedHero({ value, skipAnimation }: { value: string; skipAnimation?: boolean }): JSX.Element {
  const parsed = parseHeroInt(value);
  const target = parsed?.num ?? 0;
  const dur = skipAnimation ? 0 : counterDuration(target);
  const count = useCountUp(target, dur, skipAnimation ? 0 : COUNTER_DELAY_MS);

  if (!parsed || target === 0) {
    return <HeroValue>{value}</HeroValue>;
  }

  // When animation is skipped, show target directly
  if (skipAnimation) {
    return <HeroValue>{value}</HeroValue>;
  }

  return (
    <HeroValue>
      {parsed.prefix}
      {count}
      {parsed.suffix}
    </HeroValue>
  );
}

/* ── Toggle slide transition ─────────────────────────────────────── */

function layerStyle(
  visible: boolean,
  direction: 'left' | 'right',
) {
  if (visible) {
    return { opacity: 1, transform: 'translateX(0)', pointerEvents: 'auto' as const };
  }
  const tx = direction === 'left' ? '-16px' : '16px';
  return { opacity: 0, transform: `translateX(${tx})`, pointerEvents: 'none' as const };
}

/* ── Sub-components ────────────────────────────────────────────── */

function ComparisonRow({
  item,
  skipAnimation,
}: {
  item: CmpItem;
  skipAnimation?: boolean;
}): JSX.Element {
  return (
    <ComparisonItem>
      <ComparisonLabel>{item.label}</ComparisonLabel>
      <ComparisonValue>{item.value}</ComparisonValue>
      <DeltaPill status={item.status} skipAnimation={skipAnimation}>
        {item.delta}
      </DeltaPill>
    </ComparisonItem>
  );
}

function ViewContent({
  view,
  skipAnimation,
}: {
  view: KpiViewData;
  skipAnimation?: boolean;
}): JSX.Element {
  return (
    <>
      <AnimatedHero value={view.value} skipAnimation={skipAnimation} />
      {view.subtitle && <Subtitle>{view.subtitle}</Subtitle>}
      {view.comparisons.length > 0 && (
        <ComparisonSection skipAnimation={skipAnimation}>
          {view.comparisons.map((cmp, i) => (
            <ComparisonRow
              key={`${cmp.label}-${i}`}
              item={cmp}
              skipAnimation={skipAnimation}
            />
          ))}
        </ComparisonSection>
      )}
    </>
  );
}

/* ── Main component ────────────────────────────────────────────── */

export default function KpiCard({
  width,
  height,
  headerText,
  dataState,
  modeCount,
  toggleLabelA,
  toggleLabelB,
  modeAView,
  modeBView,
  colorScheme1A,
  colorScheme1B,
  colorScheme2A,
  colorScheme2B,
  deltaFormat1A,
  deltaFormat2A,
  deltaFormat1B,
  deltaFormat2B,
  formatComp1A,
  formatComp2A,
  formatDelta1A,
  formatDelta2A,
  formatComp1B,
  formatComp2B,
  formatDelta1B,
  formatDelta2B,
  detailColFact,
  detailColComp1,
  detailColDelta1,
  detailColComp2,
  detailColDelta2,
  enableComp1,
  enableComp2,
  comp1Label,
  comp2Label,
  showDelta1,
  showDelta2,
  hierarchyLabelPrimary,
  hierarchyLabelSecondary,
  isDarkMode,
  detailDataRaw,
  // aggregationType removed — always SUM-based logic
  formatValueA,
  formatValueB,
  formatDelta,
  detailTopN,
  detailPageSize,
}: KpiCardProps): JSX.Element {
  const [activeMode, setActiveMode] = useState<'a' | 'b'>('a');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // ── Hide Superset dashboard chart wrapper (title, background, shadow) ──
  // Keep the three-dot menu (⋮) accessible but hide title text and wrapper chrome
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    // Inject global CSS once for all KPI Card instances
    const STYLE_ID = 'kpi-card-superset-wrapper-reset';
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        /* ── KPI Card: seamless dashboard integration ── */

        /* Remove background/shadow from ALL possible wrapper layers */
        div[data-test-viz-type="ext-kpi-card"],
        div[data-test-viz-type="ext-kpi-card"] .chart-container,
        div[data-test-viz-type="ext-kpi-card"] .dashboard-chart,
        div[data-test-viz-type="ext-kpi-card"] .chart-slice {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
          overflow: visible !important;
        }

        /*
         * SliceHeader: collapse to 0 height but keep overflow visible
         * so the three-dot menu floats over the card.
         * Superset calculates: chartHeight = totalHeight - headerHeight.
         * headerHeight=0 means chart gets full height.
         */
        div[data-test-viz-type="ext-kpi-card"] > [class*="SliceHeader"],
        div[data-test-viz-type="ext-kpi-card"] > .slice-header,
        div[data-test-viz-type="ext-kpi-card"] > div:first-child {
          height: 0 !important;
          min-height: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          overflow: visible !important;
          background: transparent !important;
          border: none !important;
          position: relative !important;
          z-index: 50 !important;
        }

        /* Hide title text, keep only the controls (three-dot menu) */
        div[data-test-viz-type="ext-kpi-card"] .header-title,
        div[data-test-viz-type="ext-kpi-card"] [data-test="slice-header-title"] {
          display: none !important;
        }

        /* Position the three-dot menu in top-right corner */
        div[data-test-viz-type="ext-kpi-card"] [data-test="slice-header-controls"],
        div[data-test-viz-type="ext-kpi-card"] .slice-header-controls-trigger,
        div[data-test-viz-type="ext-kpi-card"] > div:first-child {
          display: flex !important;
          justify-content: flex-end !important;
        }
        div[data-test-viz-type="ext-kpi-card"] > div:first-child > * {
          visibility: hidden !important;
        }
        div[data-test-viz-type="ext-kpi-card"] > div:first-child > *:last-child {
          visibility: visible !important;
          position: absolute !important;
          top: 8px !important;
          right: 8px !important;
          z-index: 100 !important;
        }

        /* chart-slice: relative for absolute children */
        div[data-test-viz-type="ext-kpi-card"].chart-slice {
          position: relative !important;
          overflow: visible !important;
        }

        /* dashboard-chart wrapper: no extra spacing */
        div[data-test-viz-type="ext-kpi-card"] .dashboard-chart {
          overflow: visible !important;
        }

        /* Parent holder — use :has() with fallback */
        .dashboard-component-chart-holder:has(div[data-test-viz-type="ext-kpi-card"]) {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
        }

        /* Ensure chart fills container edge-to-edge */
        div[data-test-viz-type="ext-kpi-card"] .slice-container {
          padding: 0 !important;
          margin: 0 !important;
        }
        div[data-test-viz-type="ext-kpi-card"] .superset-legacy-chart,
        div[data-test-viz-type="ext-kpi-card"] .chart-container > div {
          width: 100% !important;
          height: 100% !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Fallback: direct DOM manipulation for browsers without :has()
    const chartSlice = el.closest('.chart-slice') as HTMLElement | null;
    if (chartSlice) {
      chartSlice.style.position = 'relative';
      chartSlice.style.overflow = 'visible';
      chartSlice.style.background = 'transparent';
      chartSlice.style.boxShadow = 'none';
      chartSlice.style.border = 'none';

      // Collapse SliceHeader to 0 height
      const header = chartSlice.querySelector(':scope > div:first-child') as HTMLElement | null;
      if (header) {
        header.style.height = '0';
        header.style.minHeight = '0';
        header.style.padding = '0';
        header.style.margin = '0';
        header.style.overflow = 'visible';
        header.style.background = 'transparent';
        header.style.border = 'none';
        header.style.position = 'relative';
        header.style.zIndex = '50';
      }

      // Hide title text
      const title = chartSlice.querySelector('.header-title') as HTMLElement | null;
      if (title) title.style.display = 'none';

      // Dashboard chart wrapper
      const dashChart = chartSlice.querySelector('.dashboard-chart') as HTMLElement | null;
      if (dashChart) {
        dashChart.style.overflow = 'visible';
        dashChart.style.background = 'transparent';
      }
    }

    // Parent holder
    const holder = el.closest('.dashboard-component-chart-holder') as HTMLElement | null;
    if (holder) {
      holder.style.background = 'transparent';
      holder.style.boxShadow = 'none';
      holder.style.border = 'none';
      holder.style.padding = '0';
      holder.style.overflow = 'visible';
    }
  }, []);

  // Disable entrance animations after initial render completes
  useEffect(() => {
    const timer = window.setTimeout(() => setHasAnimated(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const isA = activeMode === 'a';
  const isDual = modeCount === 'dual';
  const isPartial = dataState === 'partial';

  // ── Empty state — no data available ──
  if (dataState === 'empty') {
    return (
      <KpiCardRoot
        ref={rootRef}
        width={width}
        height={height}
        data-theme={isDarkMode ? 'dark' : 'light'}
        role="figure"
        aria-label={`${headerText}: нет данных`}
      >
        <Card className={CARD_CLASS}>
          <CardHead>
            <CardTitle>{headerText}</CardTitle>
          </CardHead>
          <EmptyStateWrap>
            <EmptyStateIcon aria-hidden="true">—</EmptyStateIcon>
            <EmptyStateText>Нет данных за выбранный период</EmptyStateText>
          </EmptyStateWrap>
        </Card>
      </KpiCardRoot>
    );
  }

  const rawRows = detailDataRaw?.rows;

  // Resolve 'auto' delta format by aggregationType
  const resolveAutoFmt = (fmt: DeltaFormat, aggType: AggregationType): string =>
    fmt === 'auto'
      ? aggType === 'PERCENT'
        ? 'pp'
        : aggType === 'SUM'
          ? 'absolute'
          : 'percent'
      : fmt;

  // Recompute hero + comparisons from raw data when aggregation != SUM
  const recomputeFromRaw = (
    aggType: AggregationType,
    fmtValue: (n: number) => string,
    baseView: KpiViewData,
    deltaFmt1: DeltaFormat,
    deltaFmt2: DeltaFormat,
  ): KpiViewData | null => {
    if (aggType === 'SUM' || !rawRows?.length) return null;

    // Group by primaryGroup for aggregation
    const groups = new Map<string, { metric: number; comp1: number; comp2: number }>();
    for (const r of rawRows) {
      const existing = groups.get(r.primaryGroup);
      if (existing) {
        existing.metric += r.metricValue;
        existing.comp1 += r.comp1Value ?? 0;
        existing.comp2 += r.comp2Value ?? 0;
      } else {
        groups.set(r.primaryGroup, {
          metric: r.metricValue,
          comp1: r.comp1Value ?? 0,
          comp2: r.comp2Value ?? 0,
        });
      }
    }

    const total = rawRows.reduce((s, r) => s + r.metricValue, 0);
    const totalComp1 = rawRows.reduce((s, r) => s + (r.comp1Value ?? 0), 0);
    const totalComp2 = rawRows.reduce((s, r) => s + (r.comp2Value ?? 0), 0);
    const hasComp1 = rawRows.some(r => r.comp1Value != null);
    const hasComp2 = rawRows.some(r => r.comp2Value != null);

    const vals = [...groups.values()];
    let heroNum: number;
    let comp1Num: number;
    let comp2Num: number;

    switch (aggType) {
      case 'AVERAGE':
        heroNum = total / groups.size;
        comp1Num = totalComp1 / groups.size;
        comp2Num = totalComp2 / groups.size;
        break;
      case 'MAX':
        heroNum = Math.max(...vals.map(v => v.metric));
        comp1Num = Math.max(...vals.map(v => v.comp1));
        comp2Num = Math.max(...vals.map(v => v.comp2));
        break;
      case 'MIN':
        heroNum = Math.min(...vals.map(v => v.metric));
        comp1Num = Math.min(...vals.map(v => v.comp1));
        comp2Num = Math.min(...vals.map(v => v.comp2));
        break;
      case 'PERCENT':
        heroNum = totalComp1 !== 0 ? total / totalComp1 : 0;
        comp1Num = 1; // 100% baseline
        comp2Num = totalComp2 !== 0 ? total / totalComp2 : 0;
        break;
      default:
        return null;
    }

    const isPercent = aggType === 'PERCENT';
    const heroStr = isPercent
      ? formatRussianPercent(heroNum, false)
      : fmtValue(heroNum);

    // Rebuild comparisons from aggregated values
    const comparisons: CmpItem[] = [];

    if (hasComp1) {
      const d = heroNum - comp1Num;
      const status: DeltaStatus = d > 0 ? 'up' : d < 0 ? 'dn' : 'neutral';
      comparisons.push({
        label: comp1Label,
        value: isPercent ? formatRussianPercent(comp1Num, false) : fmtValue(comp1Num),
        delta: formatDeltaByFormat(d, comp1Num, resolveAutoFmt(deltaFmt1, aggType), isPercent),
        status,
        type: 'comp1',
        rawDiff: d,
        rawRef: comp1Num,
      });
    }

    if (hasComp2) {
      const d = heroNum - comp2Num;
      const status: DeltaStatus = d > 0 ? 'up' : d < 0 ? 'dn' : 'neutral';
      comparisons.push({
        label: comp2Label,
        value: isPercent ? formatRussianPercent(comp2Num, false) : fmtValue(comp2Num),
        delta: formatDeltaByFormat(d, comp2Num, resolveAutoFmt(deltaFmt2, aggType), isPercent),
        status,
        type: 'comp2',
        rawDiff: d,
        rawRef: comp2Num,
      });
    }

    return { value: heroStr, subtitle: baseView.subtitle, comparisons };
  };

  // Filter comparisons, override labels, apply colorScheme inversion
  const processView = (
    view: KpiViewData,
    scheme1: ComparisonColorScheme,
    scheme2: ComparisonColorScheme,
    fmtDelta1: (n: number) => string,
    fmtDelta2: (n: number) => string,
  ): KpiViewData => ({
    ...view,
    comparisons: view.comparisons
      .filter(cmp => {
        if (cmp.type === 'comp1' && !enableComp1) return false;
        if (cmp.type === 'comp2' && !enableComp2) return false;
        return true;
      })
      .map(cmp => {
        // Override labels with user-configured values
        let { label, delta } = cmp;
        if (cmp.type === 'comp1') label = comp1Label;
        if (cmp.type === 'comp2') label = comp2Label;

        // Hide delta pill if showDelta is false for this comparison
        const isDeltaVisible = cmp.type === 'comp2' ? showDelta2 : showDelta1;
        if (!isDeltaVisible) {
          return { ...cmp, label, delta: '', status: 'neutral' as DeltaStatus };
        }

        // Re-format delta from raw values using per-value formatter
        if (cmp.rawDiff != null) {
          const fmt = cmp.type === 'comp2' ? fmtDelta2 : fmtDelta1;
          delta = fmt(cmp.rawDiff);
        }

        // Apply per-comparison colorScheme
        const scheme = cmp.type === 'comp2' ? scheme2 : scheme1;
        if (scheme === 'green_up') return { ...cmp, label, delta };
        // green_down: growth is bad → invert up ↔ dn
        const inverted: DeltaStatus =
          cmp.status === 'up' ? 'dn' : cmp.status === 'dn' ? 'up' : cmp.status;
        return { ...cmp, label, delta, status: inverted };
      }),
  });

  const viewA = processView(
    recomputeFromRaw('SUM' as const, formatValueA, modeAView, deltaFormat1A, deltaFormat2A) ?? modeAView,
    colorScheme1A, colorScheme2A, formatDelta1A, formatDelta2A,
  );
  const viewB = processView(
    recomputeFromRaw('SUM' as const, formatValueB, modeBView, deltaFormat1B, deltaFormat2B) ?? modeBView,
    colorScheme1B, colorScheme2B, formatDelta1B, formatDelta2B,
  );

  // Detail modal only available when active mode has data
  const activeView = isA ? viewA : viewB;
  const activeModeEmpty = activeView.value === '' && activeView.comparisons.length === 0;
  const hasDetail = Boolean(rawRows?.length) && !activeModeEmpty;

  return (
    <KpiCardRoot
      ref={rootRef}
      width={width}
      height={height}
      data-theme={isDarkMode ? 'dark' : 'light'}
      role="figure"
      aria-label={`${headerText}: ${modeAView.value}`}
    >
      {/* XSS-safe: KEYFRAMES_CSS is a compile-time constant string, never user input */}
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />

      <Card
        className={CARD_CLASS}
        clickable={hasDetail}
        onClick={hasDetail ? () => setIsModalOpen(true) : undefined}
      >
        <CardHead>
          <CardTitle>{headerText}</CardTitle>
          {isPartial && <PartialBadge>Частичные данные</PartialBadge>}
          {isDual && (
            <ToggleGroup role="tablist" aria-label="Toggle mode A / B">
              <ToggleButton
                active={isA}
                role="tab"
                aria-selected={isA}
                onClick={e => { e.stopPropagation(); setActiveMode('a'); }}
              >
                {toggleLabelA}
              </ToggleButton>
              <ToggleButton
                active={!isA}
                role="tab"
                aria-selected={!isA}
                onClick={e => { e.stopPropagation(); setActiveMode('b'); }}
              >
                {toggleLabelB}
              </ToggleButton>
            </ToggleGroup>
          )}
        </CardHead>

        <DataContainer>
          <DataLayer style={layerStyle(isA, 'left')} aria-hidden={!isA}>
            {viewA.value ? (
              <ViewContent view={viewA} skipAnimation={hasAnimated} />
            ) : (
              <EmptyStateWrap>
                <EmptyStateIcon aria-hidden="true">—</EmptyStateIcon>
                <EmptyStateText>Нет данных за выбранный период</EmptyStateText>
              </EmptyStateWrap>
            )}
          </DataLayer>
          {isDual && (
            <DataLayer style={layerStyle(!isA, 'right')} aria-hidden={isA}>
              {viewB.value ? (
                <ViewContent view={viewB} skipAnimation={hasAnimated} />
              ) : (
                <EmptyStateWrap>
                  <EmptyStateIcon aria-hidden="true">—</EmptyStateIcon>
                  <EmptyStateText>Нет данных за выбранный период</EmptyStateText>
                </EmptyStateWrap>
              )}
            </DataLayer>
          )}
        </DataContainer>
      </Card>

      {hasDetail && detailDataRaw && (
        <DetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={headerText}
          headerValue={isA ? viewA.value : viewB.value}
          detailDataRaw={detailDataRaw}
          aggregationType={isA ? 'SUM' as const : 'SUM' as const}
          colorScheme1={isA ? colorScheme1A : colorScheme1B}
          colorScheme2={isA ? colorScheme2A : colorScheme2B}
          deltaFormat1={isA ? deltaFormat1A : deltaFormat1B}
          deltaFormat2={isA ? deltaFormat2A : deltaFormat2B}
          formatValue={isA ? formatValueA : formatValueB}
          formatDelta={formatDelta}
          formatComp1={isA ? formatComp1A : formatComp1B}
          formatComp2={isA ? formatComp2A : formatComp2B}
          formatDelta1={isA ? formatDelta1A : formatDelta1B}
          formatDelta2={isA ? formatDelta2A : formatDelta2B}
          showDelta1={showDelta1}
          showDelta2={showDelta2}
          colFact={detailColFact}
          colComp1={detailColComp1}
          colDelta1={detailColDelta1}
          colComp2={detailColComp2}
          colDelta2={detailColDelta2}
          hierarchyLabelPrimary={hierarchyLabelPrimary}
          hierarchyLabelSecondary={hierarchyLabelSecondary}
          enableComp1={enableComp1}
          enableComp2={enableComp2}
          comp1Label={comp1Label}
          comp2Label={comp2Label}
          topN={detailTopN}
          pageSize={detailPageSize}
          isDarkMode={isDarkMode}
        />
      )}
    </KpiCardRoot>
  );
}
