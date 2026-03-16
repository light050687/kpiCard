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
 * Matches kpi-cards-v1.html mockup behavior: the integer part of the
 * hero value counts up from 0 → target.
 *
 * Mockup uses CSS @property + counter-reset (Houdini), which cannot
 * work inside Emotion styled-components. We replicate the same visual
 * effect with requestAnimationFrame.
 *
 * Easing: cubic-bezier(.4,0,.2,1) ≈ easeOutQuart.
 * Duration scales with target magnitude (700ms–1200ms, matching
 * mockup's c1=1s c2=.8s c3=1.2s c4=.7s).
 * Delay: 250ms (mockup: .25s for first card).
 * ────────────────────────────────────────────────────────────────── */

const COUNTER_DELAY_MS = 250;

function easeOutQuart(t: number): number {
  return 1 - (1 - t) ** 4;
}

function counterDuration(target: number): number {
  return Math.min(1200, 700 + target * 30);
}

/** Extract first integer from formatted value string.
 *  "12,4 млрд" → { prefix: "", num: 12, suffix: ",4 млрд" }
 *  "₽ 8.7M"   → { prefix: "₽ ", num: 8, suffix: ".7M" }
 *  "+14,8%"    → { prefix: "+", num: 14, suffix: ",8%" }
 */
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

/** Hero number with counter animation (integer part counts up from 0). */
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

/* ── Toggle slide transition ───────────────────────────────────────
 * Inline style on DataLayer avoids Emotion class swap, matching
 * mockup's .kpi-layer.visible / .hidden / .exit-left pattern.
 * ────────────────────────────────────────────────────────────────── */

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

/**
 * KPI Card — Main visualization component.
 *
 * Animation strategy (matching kpi-cards-v1.html mockup):
 *   • Entry: plain CSS @keyframes injected via <style> tag (card-in, sub-in, etc.)
 *   • Counter: JS requestAnimationFrame on hero integer (replaces CSS @property)
 *   • Toggle: inline style on DataLayer (translateX slide)
 *   • Hover: CSS transitions on title underline, value color, pill bg
 *   • Dark mode: data-theme attribute switches CSS custom properties
 */
export default function KpiCard({
  width,
  height,
  headerText,
  toggleMode,
  toggleLabelAbs,
  toggleLabelPct,
  absView,
  pctView,
  isDarkMode,
  detailData,
}: KpiCardProps): JSX.Element {
  const [activeMode, setActiveMode] = useState<'abs' | 'pct'>('abs');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAbs = activeMode === 'abs';

  const absStyle = layerStyle(isAbs, 'left');
  const pctStyle = layerStyle(!isAbs, 'right');

  return (
    <KpiCardRoot
      width={width}
      height={height}
      data-theme={isDarkMode ? 'dark' : 'light'}
      role="figure"
      aria-label={`${headerText}: ${absView.value}`}
    >
      {/* Plain CSS @keyframes — bypasses Emotion/Stylis, guaranteed to work */}
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />

      <Card
        className={CARD_CLASS}
        onClick={detailData?.bySegment ? () => setIsModalOpen(true) : undefined}
        style={detailData?.bySegment ? { cursor: 'pointer' } : undefined}
      >
        <CardHead>
          <CardTitle>{headerText}</CardTitle>
          {toggleMode === 'abs_pct' && (
            <ToggleGroup role="tablist" aria-label="Toggle absolute / percentage">
              <ToggleButton
                active={isAbs}
                role="tab"
                aria-selected={isAbs}
                onClick={e => { e.stopPropagation(); setActiveMode('abs'); }}
              >
                {toggleLabelAbs}
              </ToggleButton>
              <ToggleButton
                active={!isAbs}
                role="tab"
                aria-selected={!isAbs}
                onClick={e => { e.stopPropagation(); setActiveMode('pct'); }}
              >
                {toggleLabelPct}
              </ToggleButton>
            </ToggleGroup>
          )}
        </CardHead>

        <DataContainer>
          <DataLayer style={absStyle} aria-hidden={!isAbs}>
            <ViewContent view={absView} />
          </DataLayer>
          {toggleMode === 'abs_pct' && (
            <DataLayer style={pctStyle} aria-hidden={isAbs}>
              <ViewContent view={pctView} />
            </DataLayer>
          )}
        </DataContainer>
      </Card>

      {detailData?.bySegment && (
        <DetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={headerText}
          headerValue={isAbs ? absView.value : pctView.value}
          detailData={detailData}
          isDarkMode={isDarkMode}
        />
      )}
    </KpiCardRoot>
  );
}
