import React, { useState, useEffect, useRef } from 'react';
import { KpiCardProps, KpiViewData, ComparisonItem as CmpItem } from './types';
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

function AnimatedHero({ value }: { value: string }): JSX.Element {
  const parsed = parseHeroInt(value);
  const target = parsed?.num ?? 0;
  const dur = counterDuration(target);
  const count = useCountUp(target, dur, COUNTER_DELAY_MS);

  if (!parsed || target === 0) {
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
): React.CSSProperties {
  if (visible) {
    return { opacity: 1, transform: 'translateX(0)', pointerEvents: 'auto' };
  }
  const tx = direction === 'left' ? '-16px' : '16px';
  return { opacity: 0, transform: `translateX(${tx})`, pointerEvents: 'none' };
}

/* ── Sub-components ────────────────────────────────────────────── */

function ComparisonRow({ item }: { item: CmpItem }): JSX.Element {
  return (
    <ComparisonItem>
      <ComparisonLabel>{item.label}</ComparisonLabel>
      <ComparisonValue>{item.value}</ComparisonValue>
      <DeltaPill status={item.status}>{item.delta}</DeltaPill>
    </ComparisonItem>
  );
}

function ViewContent({ view }: { view: KpiViewData }): JSX.Element {
  return (
    <>
      <AnimatedHero value={view.value} />
      {view.subtitle && <Subtitle>{view.subtitle}</Subtitle>}
      {view.comparisons.length > 0 && (
        <ComparisonSection>
          {view.comparisons.map((cmp, i) => (
            <ComparisonRow key={`${cmp.label}-${i}`} item={cmp} />
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
  modeCount,
  toggleLabelA,
  toggleLabelB,
  modeAView,
  modeBView,
  colorSchemeA,
  colorSchemeB,
  enablePlan,
  enableYoy,
  hierarchyLabelPrimary,
  hierarchyLabelSecondary,
  isDarkMode,
  detailDataRaw,
  aggregationTypeA,
  aggregationTypeB,
  formatValueA,
  formatValueB,
  formatDelta,
  detailTopN,
}: KpiCardProps): JSX.Element {
  const [activeMode, setActiveMode] = useState<'a' | 'b'>('a');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isA = activeMode === 'a';
  const isDual = modeCount === 'dual';

  // Filter comparisons based on enablePlan/enableYoy flags
  const filterComparisons = (view: KpiViewData): KpiViewData => ({
    ...view,
    comparisons: view.comparisons.filter(cmp => {
      if (cmp.type === 'plan' && !enablePlan) return false;
      if (cmp.type === 'yoy' && !enableYoy) return false;
      return true;
    }),
  });
  const viewA = filterComparisons(modeAView);
  const viewB = filterComparisons(modeBView);

  const hasDetail = Boolean(detailDataRaw?.rows?.length);

  return (
    <KpiCardRoot
      width={width}
      height={height}
      data-theme={isDarkMode ? 'dark' : 'light'}
      role="figure"
      aria-label={`${headerText}: ${modeAView.value}`}
    >
      {/* Plain CSS @keyframes — bypasses Emotion/Stylis */}
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />

      <Card
        className={CARD_CLASS}
        onClick={hasDetail ? () => setIsModalOpen(true) : undefined}
        style={hasDetail ? { cursor: 'pointer' } : undefined}
      >
        <CardHead>
          <CardTitle>{headerText}</CardTitle>
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
            <ViewContent view={viewA} />
          </DataLayer>
          {isDual && (
            <DataLayer style={layerStyle(!isA, 'right')} aria-hidden={isA}>
              <ViewContent view={viewB} />
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
          aggregationType={isA ? aggregationTypeA : aggregationTypeB}
          colorScheme={isA ? colorSchemeA : colorSchemeB}
          formatValue={isA ? formatValueA : formatValueB}
          formatDelta={formatDelta}
          hierarchyLabelPrimary={hierarchyLabelPrimary}
          hierarchyLabelSecondary={hierarchyLabelSecondary}
          enablePlan={enablePlan}
          enableYoy={enableYoy}
          topN={detailTopN}
          isDarkMode={isDarkMode}
        />
      )}
    </KpiCardRoot>
  );
}
