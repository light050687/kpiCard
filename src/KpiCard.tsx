import React, { useState, useEffect, useRef } from 'react';
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
      <AnimatedHero value={view.value} />
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
  enableComp1,
  enableComp2,
  comp1Label,
  comp2Label,
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
  const [hasAnimated, setHasAnimated] = useState(false);

  // Disable entrance animations after initial render completes
  useEffect(() => {
    const timer = window.setTimeout(() => setHasAnimated(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const isA = activeMode === 'a';
  const isDual = modeCount === 'dual';

  const rawRows = detailDataRaw?.rows;

  // Format delta: 'auto' resolves by aggregationType, anything else is literal suffix
  const fmtDeltaByType = (
    diff: number,
    ref: number,
    fmt: DeltaFormat,
    aggType: AggregationType,
  ): string => {
    const effective =
      fmt === 'auto'
        ? aggType === 'PERCENT'
          ? 'pp'
          : aggType === 'SUM'
            ? 'absolute'
            : 'percent'
        : fmt;
    return formatDeltaByFormat(diff, ref, effective);
  };

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
        delta: fmtDeltaByType(heroNum - comp1Num, comp1Num, deltaFmt1, aggType),
        status,
        type: 'comp1',
      });
    }

    if (hasComp2) {
      const d = heroNum - comp2Num;
      const status: DeltaStatus = d > 0 ? 'up' : d < 0 ? 'dn' : 'neutral';
      comparisons.push({
        label: comp2Label,
        value: isPercent ? formatRussianPercent(comp2Num, false) : fmtValue(comp2Num),
        delta: fmtDeltaByType(heroNum - comp2Num, comp2Num, deltaFmt2, aggType),
        status,
        type: 'comp2',
      });
    }

    return { value: heroStr, subtitle: baseView.subtitle, comparisons };
  };

  // Filter comparisons, override labels, apply per-comparison colorScheme inversion
  const processView = (
    view: KpiViewData,
    scheme1: ComparisonColorScheme,
    scheme2: ComparisonColorScheme,
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
        let { label } = cmp;
        if (cmp.type === 'comp1') label = comp1Label;
        if (cmp.type === 'comp2') label = comp2Label;
        // Apply per-comparison colorScheme
        const scheme = cmp.type === 'comp2' ? scheme2 : scheme1;
        if (scheme === 'green_up') return { ...cmp, label };
        // green_down: growth is bad → invert up ↔ dn
        const inverted: DeltaStatus =
          cmp.status === 'up' ? 'dn' : cmp.status === 'dn' ? 'up' : cmp.status;
        return { ...cmp, label, status: inverted };
      }),
  });

  const viewA = processView(
    recomputeFromRaw(aggregationTypeA, formatValueA, modeAView, deltaFormat1A, deltaFormat2A) ?? modeAView,
    colorScheme1A, colorScheme2A,
  );
  const viewB = processView(
    recomputeFromRaw(aggregationTypeB, formatValueB, modeBView, deltaFormat1B, deltaFormat2B) ?? modeBView,
    colorScheme1B, colorScheme2B,
  );

  const hasDetail = Boolean(rawRows?.length);

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
            <ViewContent view={viewA} skipAnimation={hasAnimated} />
          </DataLayer>
          {isDual && (
            <DataLayer style={layerStyle(!isA, 'right')} aria-hidden={isA}>
              <ViewContent view={viewB} skipAnimation={hasAnimated} />
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
          colorScheme1={isA ? colorScheme1A : colorScheme1B}
          colorScheme2={isA ? colorScheme2A : colorScheme2B}
          formatValue={isA ? formatValueA : formatValueB}
          formatDelta={formatDelta}
          hierarchyLabelPrimary={hierarchyLabelPrimary}
          hierarchyLabelSecondary={hierarchyLabelSecondary}
          enableComp1={enableComp1}
          enableComp2={enableComp2}
          comp1Label={comp1Label}
          comp2Label={comp2Label}
          topN={detailTopN}
          isDarkMode={isDarkMode}
        />
      )}
    </KpiCardRoot>
  );
}
