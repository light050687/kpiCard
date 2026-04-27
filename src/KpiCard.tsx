import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  KpiCardProps,
  KpiViewData,
  ComparisonItem as CmpItem,
  ComparisonColorScheme,
  DeltaStatus,
} from './types';
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
  MockBadge,
  SkeletonBlock,
  SkeletonWrap,
  ErrorStateIcon,
  RefreshBar,
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
  // DS v2.0: максимум анимации 0.6s (раздел 08, "Переходы и анимации")
  return Math.min(600, 350 + target * 15);
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

/**
 * Shallow compare for React.memo — skip function props (formatters)
 * which are recreated on every transformProps call.
 * This prevents Superset's framework from triggering full re-renders.
 */
function arePropsEqual(prev: KpiCardProps, next: KpiCardProps): boolean {
  // Compare all non-function props
  const keys = Object.keys(next) as (keyof KpiCardProps)[];
  for (const key of keys) {
    if (typeof next[key] === 'function') continue; // skip formatters
    if (key === 'theme') continue; // theme object changes reference often
    if (prev[key] !== next[key]) return false;
  }
  return true;
}

const KpiCardMemo = React.memo(function KpiCardInner({
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
  detailQueryParams,
  // aggregationType removed — always SUM-based logic
  formatValueA,
  formatValueB,
  formatDelta,
  detailTopN,
  detailPageSize,
  mockModeEnabled,
  mockPreset,
  mockCustomJson,
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

        /* Hide filter indicator badge — not needed on KPI cards */
        div[data-test-viz-type="ext-kpi-card"] .filter-counts {
          display: none !important;
        }

        /*
         * SliceHeader: height:0 + overflow:visible.
         * Superset measures headerHeight via offsetHeight which returns 0.
         * Dots button floats out via overflow:visible + position:absolute.
         */
        div[data-test-viz-type="ext-kpi-card"].chart-slice > div:first-child {
          height: 0 !important;
          min-height: 0 !important;
          max-height: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          overflow: visible !important;
          pointer-events: none !important;
        }

        /* chart-slice (SliceContainer): fill holder */
        div[data-test-viz-type="ext-kpi-card"].chart-slice {
          position: relative !important;
          overflow: visible !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* dashboard-chart wrapper: no extra spacing */
        div[data-test-viz-type="ext-kpi-card"] .dashboard-chart {
          overflow: visible !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* Parent holder — transparent, no padding so card touches grid border */
        .dashboard-component-chart-holder:has(div[data-test-viz-type="ext-kpi-card"]),
        [data-test="dashboard-component-chart-holder"]:has(div[data-test-viz-type="ext-kpi-card"]) {
          background: transparent !important;
          box-shadow: none !important;
          overflow: visible !important;
          padding: 0 !important;
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
      chartSlice.style.padding = '0';
      chartSlice.style.margin = '0';

      // SliceHeader: find dots button FIRST (before hiding), then hide.
      const header = chartSlice.querySelector(':scope > div:first-child') as HTMLElement | null;
      if (header) {
        // Find dots button BEFORE hiding
        const dotsBtn = header.querySelector('.ant-dropdown-trigger') as HTMLElement | null;

        // Hide header title but keep it in DOM flow at height 0
        // so React events still work on the dots button
        header.style.cssText = [
          'height: 0 !important',
          'min-height: 0 !important',
          'max-height: 0 !important',
          'padding: 0 !important',
          'margin: 0 !important',
          'border: none !important',
          'overflow: visible !important',
          'background: transparent !important',
          'position: relative !important',
          'pointer-events: none !important',
        ].join(';');

        // Hide all children
        Array.from(header.children).forEach(child => {
          (child as HTMLElement).style.cssText = 'visibility:hidden!important;pointer-events:none!important;height:0!important;overflow:hidden!important;';
        });

        // Show ONLY the dots button, positioned over our card
        if (dotsBtn) {
          const controlsDiv = dotsBtn.closest('.header-controls') as HTMLElement | null;
          if (controlsDiv) {
            controlsDiv.style.cssText = [
              'visibility: visible !important',
              'pointer-events: auto !important',
              'position: absolute !important',
              'top: 6px !important',
              'right: -6px !important',
              'z-index: 100 !important',
              'height: auto !important',
              'overflow: visible !important',
              'opacity: 0',
              'transition: opacity 0.15s ease',
            ].join(';');
          }
          dotsBtn.style.cssText += ';visibility:visible!important;pointer-events:auto!important;';

          // Show dots on hover — listen on chart-slice (parent of both header and card)
          // so mouse moving from card to dots doesn't trigger mouseleave
          const hoverTarget = chartSlice || el;
          const target = controlsDiv || dotsBtn;
          const onEnter = () => { target.style.opacity = '1'; };
          const onLeave = () => { target.style.opacity = '0'; };
          hoverTarget.addEventListener('mouseenter', onEnter);
          hoverTarget.addEventListener('mouseleave', onLeave);

          // Store cleanup refs
          (el as HTMLElement & { __kpiDotsCleanup?: () => void }).__kpiDotsCleanup = () => {
            hoverTarget.removeEventListener('mouseenter', onEnter);
            hoverTarget.removeEventListener('mouseleave', onLeave);
          };
        }
      }

      // Dashboard chart wrapper — stretch to fill holder height
      const dashChart = chartSlice.querySelector('.dashboard-chart') as HTMLElement | null;
      if (dashChart) {
        dashChart.style.overflow = 'visible';
        dashChart.style.background = 'transparent';
        dashChart.style.height = '100%';
      }

      // chart-container + slice_container + inner wrappers — full height chain
      const chartContainer = chartSlice.querySelector('.chart-container') as HTMLElement | null;
      if (chartContainer) {
        chartContainer.style.height = '100%';
        // Traverse inner divs to ensure height propagates to KpiCardRoot
        let inner: HTMLElement | null = chartContainer;
        for (let depth = 0; depth < 4; depth++) {
          const child = inner.querySelector(':scope > div') as HTMLElement | null;
          if (!child) break;
          child.style.height = '100%';
          inner = child;
        }
      }
    }

    // Parent holder — transparent, no padding, full height for card alignment
    const holder = el.closest('.dashboard-component-chart-holder') as HTMLElement | null;
    if (holder) {
      holder.style.cssText += ';background:transparent!important;box-shadow:none!important;overflow:visible!important;padding:0!important;';
    }

    return () => {
      // Cleanup event listeners to prevent memory leak
      type ElWithCleanup = HTMLElement & { __kpiDotsCleanup?: () => void };
      const elc = el as ElWithCleanup | null;
      if (elc?.__kpiDotsCleanup) {
        elc.__kpiDotsCleanup();
        elc.__kpiDotsCleanup = undefined;
      }
    };
  }, []);

  // Disable entrance animations after initial render completes
  useEffect(() => {
    const timer = window.setTimeout(() => setHasAnimated(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const isA = activeMode === 'a';
  const isDual = modeCount === 'dual';
  const isPartial = dataState === 'partial';
  const isStale = dataState === 'stale';

  // ── Loading state — skeleton placeholder ──
  if (dataState === 'loading') {
    return (
      <KpiCardRoot
        ref={rootRef}
        width={width}
        height={height}
        data-theme={isDarkMode ? 'dark' : 'light'}
        role="figure"
        aria-label={`${headerText}: загрузка`}
        aria-busy="true"
      >
        <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
        <Card className={CARD_CLASS}>
          <CardHead>
            <SkeletonBlock w="120px" h={14} />
          </CardHead>
          <SkeletonWrap>
            <SkeletonBlock w="180px" h={36} />
            <SkeletonBlock w="100px" h={12} />
            <SkeletonBlock w="260px" h={14} />
          </SkeletonWrap>
        </Card>
      </KpiCardRoot>
    );
  }

  // ── Error state — query or render failure ──
  if (dataState === 'error') {
    return (
      <KpiCardRoot
        ref={rootRef}
        width={width}
        height={height}
        data-theme={isDarkMode ? 'dark' : 'light'}
        role="figure"
        aria-label={`${headerText}: ошибка`}
      >
        <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
        <Card className={CARD_CLASS}>
          <CardHead>
            <CardTitle>{headerText}</CardTitle>
          </CardHead>
          <EmptyStateWrap>
            <ErrorStateIcon aria-hidden="true" />
            <EmptyStateText>Ошибка загрузки данных</EmptyStateText>
          </EmptyStateWrap>
        </Card>
      </KpiCardRoot>
    );
  }

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

  const hasGroupby = Boolean(detailQueryParams?.groupbyPrimary);

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

  const viewA = useMemo(() => processView(
    modeAView,
    colorScheme1A, colorScheme2A, formatDelta1A, formatDelta2A,
  ), [modeAView, colorScheme1A, colorScheme2A, deltaFormat1A, deltaFormat2A,
      formatValueA, formatDelta1A, formatDelta2A, enableComp1, enableComp2,
      comp1Label, comp2Label, showDelta1, showDelta2]);
  const viewB = useMemo(() => processView(
    modeBView,
    colorScheme1B, colorScheme2B, formatDelta1B, formatDelta2B,
  ), [modeBView, colorScheme1B, colorScheme2B, deltaFormat1B, deltaFormat2B,
      formatValueB, formatDelta1B, formatDelta2B, enableComp1, enableComp2,
      comp1Label, comp2Label, showDelta1, showDelta2]);

  // Detail modal only available when active mode has data
  const activeView = isA ? viewA : viewB;
  const activeModeEmpty = activeView.value === '' && activeView.comparisons.length === 0;
  const hasDetail = (hasGroupby && !activeModeEmpty) || mockModeEnabled;

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
        {isStale && <RefreshBar />}
        <CardHead>
          <CardTitle>{headerText}{mockModeEnabled && <MockBadge>ТЕСТ</MockBadge>}</CardTitle>
          {isPartial && <PartialBadge>Частичные данные</PartialBadge>}
          {isDual && (
            <ToggleGroup role="tablist" aria-label="Toggle mode A / B">
              <ToggleButton
                active={isA}
                role="tab"
                aria-selected={isA}
                onClick={e => {
                  e.stopPropagation();
                  setActiveMode('a');
                }}
              >
                {toggleLabelA}
              </ToggleButton>
              <ToggleButton
                active={!isA}
                role="tab"
                aria-selected={!isA}
                onClick={e => {
                  e.stopPropagation();
                  setActiveMode('b');
                }}
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

      {hasDetail && detailQueryParams && (
        <DetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={headerText}
          headerValue={isA ? viewA.value : viewB.value}
          queryParams={detailQueryParams}
          activeMode={activeMode}
          aggregationType={'SUM' as const}
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
          mockModeEnabled={mockModeEnabled}
          mockPreset={mockPreset}
          mockCustomJson={mockCustomJson}
        />
      )}
    </KpiCardRoot>
  );
}, arePropsEqual);

// ── Error Boundary — catches render errors and shows error state ──

interface ErrorBoundaryState {
  hasError: boolean;
}

class KpiCardErrorBoundary extends React.Component<
  KpiCardProps,
  ErrorBoundaryState
> {
  constructor(props: KpiCardProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[KPI Card] Render error:', error, info.componentStack);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      const { width, height, headerText } = this.props;
      return (
        <KpiCardRoot
          width={width}
          height={height}
          data-theme="light"
          role="figure"
          aria-label={`${headerText}: ошибка`}
        >
          <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
          <Card className={CARD_CLASS}>
            <CardHead>
              <CardTitle>{headerText || 'KPI'}</CardTitle>
            </CardHead>
            <EmptyStateWrap>
              <ErrorStateIcon aria-hidden="true" />
              <EmptyStateText>Ошибка отображения</EmptyStateText>
            </EmptyStateWrap>
          </Card>
        </KpiCardRoot>
      );
    }
    return <KpiCardMemo {...this.props} />;
  }
}

// Superset expects a plain FunctionComponent, not MemoExoticComponent.
// ErrorBoundary wraps the memoized component to catch render crashes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const KpiCard = KpiCardErrorBoundary as any as (props: KpiCardProps) => JSX.Element;
export default KpiCard;
