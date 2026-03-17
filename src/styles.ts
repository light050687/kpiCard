import { styled } from '@superset-ui/core';

/*
 * Design System v2.0 tokens as CSS custom properties.
 * Light/dark switching via `data-theme` attribute on the root container.
 *
 * Animations: plain CSS @keyframes injected via <style> in KpiCard.tsx.
 * Timing functions as TS constants (not CSS var()) to avoid Stylis issues.
 * Parent-hover selectors use `.kpi-card:hover` (plain CSS class).
 *
 * All values match kpi-cards-v1.html mockup exactly.
 */

/* ── Shared constants (used in template literals) ── */

/** Standard easing — matches mockup's --ease token */
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

/** Hover-state pill backgrounds (stronger opacity than default --up-b/--dn-b/--wn-b) */
const HOVER_UP = 'rgba(22, 163, 74, 0.15)';
const HOVER_DN = 'rgba(220, 38, 38, 0.15)';
const HOVER_WN = 'rgba(204, 182, 4, 0.15)';

export const CARD_CLASS = 'kpi-card';

/* ── Keyframes CSS string (injected via <style> in KpiCard.tsx) ── */

export const KEYFRAMES_CSS = `
@keyframes kpi-card-in{
  0%{opacity:0;transform:translateY(24px) scale(.93);filter:blur(6px)}
  50%{filter:blur(1px)}
  100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}
}
@keyframes kpi-sub-in{
  from{opacity:0;transform:translateX(-8px)}
  to{opacity:1;transform:translateX(0)}
}
@keyframes kpi-cmp-in{
  from{opacity:0;transform:translateY(6px)}
  to{opacity:1;transform:translateY(0)}
}
@keyframes kpi-line-in{
  from{transform:scaleX(0)}
  to{transform:scaleX(1)}
}
@keyframes kpi-pill-pop{
  from{opacity:0;transform:translateY(4px)}
  to{opacity:1;transform:translateY(0)}
}
@keyframes kpi-fade-in{
  from{opacity:0}
  to{opacity:1}
}
@keyframes kpi-overlay-in{
  from{opacity:0}
  to{opacity:1}
}
@keyframes kpi-modal-in{
  from{opacity:0;transform:translateY(12px) scale(.97)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
`;

/* ── Root container with theme tokens ── */

export const KpiCardRoot = styled.div<{ width: number; height: number }>`
  --bg: #f3f3f3;
  --s: #ffffff;
  --ink: #0a0a0a;
  --g50: #f7f7f7;
  --g100: #ebebeb;
  --g200: #dcdcdc;
  --g300: #c0c0c0;
  --g400: #999999;
  --g500: #737373;
  --g600: #555555;
  --g700: #2e2e2e;
  --up: #16a34a;
  --dn: #dc2626;
  --wn: #ccb604;
  --up-b: rgba(22, 163, 74, 0.07);
  --dn-b: rgba(220, 38, 38, 0.07);
  --wn-b: rgba(204, 182, 4, 0.07);
  --c-sky: #3b8bd9;
  --f: 'Manrope', system-ui, sans-serif;
  --m: 'JetBrains Mono', monospace;

  &[data-theme='dark'] {
    --bg: #0f1114;
    --s: #171a1e;
    --ink: #e6e9ef;
    --g50: #131619;
    --g100: #1b1e22;
    --g200: #272b30;
    --g300: #363b42;
    --g400: #555c65;
    --g500: #7b8390;
    --g600: #9ba3ae;
    --g700: #c4cad2;
    --up: #34d399;
    --dn: #f87171;
    --wn: #f8f571;
    --up-b: rgba(52, 211, 153, 0.1);
    --dn-b: rgba(248, 113, 113, 0.1);
    --wn-b: rgba(248, 245, 113, 0.1);
    --c-sky: #5caaf0;
  }

  width: ${({ width }) => width}px;
  max-width: 100%;
  min-height: ${({ height }) => height}px;
  height: auto;
  display: flex;
  align-items: stretch;
  justify-content: center;
  font-family: var(--f);
  -webkit-font-smoothing: antialiased;

  /* prefers-reduced-motion intentionally omitted —
     animations are core to this visualization's UX.
     If needed, re-enable per WCAG 2.3.3 (Motion from Interaction). */
`;

/* ── Card ── */

export const Card = styled.div`
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 16px 20px;
  overflow: hidden;
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  cursor: default;
  transition: border-color 0.25s ${EASE};
  animation-name: kpi-card-in;
  animation-duration: 0.6s;
  animation-timing-function: ${EASE};
  animation-fill-mode: both;

  &:hover {
    border-color: var(--g300);
  }
`;

/* ── Header ── */

export const CardHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  min-height: 24px;
`;

export const CardTitle = styled.div`
  font-family: var(--f);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 18px;
  text-transform: uppercase;
  color: var(--ink);
  position: relative;
  display: inline-block;

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 1.5px;
    background: var(--c-sky);
    transition: width 0.3s ${EASE};
  }

  .kpi-card:hover &::after {
    width: 100%;
  }
`;

/* ── Toggle ── */

export const ToggleGroup = styled.div`
  display: flex;
  gap: 2px;
  background: var(--g100);
  border-radius: 6px;
  padding: 2px;
  animation-name: kpi-fade-in;
  animation-duration: 0.3s;
  animation-timing-function: ${EASE};
  animation-delay: 0.3s;
  animation-fill-mode: both;
`;

export const ToggleButton = styled.button<{ active: boolean }>`
  border: none;
  background: ${({ active }) => (active ? 'var(--s)' : 'transparent')};
  font-family: var(--m);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ active }) => (active ? 'var(--ink)' : 'var(--g400)')};
  padding: 4px 10px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s ${EASE};
  line-height: 1;
  box-shadow: ${({ active }) =>
    active ? '0 1px 3px rgba(0, 0, 0, 0.06)' : 'none'};

  &:hover {
    color: ${({ active }) => (active ? 'var(--ink)' : 'var(--g600)')};
  }
`;

/* ── Data layers (toggle transition via inline style) ── */

export const DataContainer = styled.div`
  display: grid;
  overflow: hidden;
`;

export const DataLayer = styled.div`
  grid-area: 1 / 1;
  transition:
    opacity 0.3s ${EASE},
    transform 0.3s ${EASE};
  will-change: opacity, transform;
`;

/* ── Hero number ── */

export const HeroValue = styled.div`
  font-family: var(--f);
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  margin-bottom: 4px;
  color: var(--ink);
  transition: color 0.2s ${EASE};

  .kpi-card:hover & {
    color: var(--c-sky);
  }
`;

export const HeroUnit = styled.span`
  font-size: 14px;
  font-weight: 600;
  margin-left: 2px;
  color: var(--g500);
`;

/* ── Subtitle ── */

export const Subtitle = styled.div`
  font-family: var(--m);
  font-size: 11px;
  line-height: 16px;
  color: var(--g600);
  margin-bottom: 14px;
  animation-name: kpi-sub-in;
  animation-duration: 0.5s;
  animation-timing-function: ${EASE};
  animation-delay: 0.4s;
  animation-fill-mode: both;
`;

/* ── Comparisons (horizontal wrap: Plan + YoY side by side) ── */

export const ComparisonSection = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 10px;
  position: relative;
  animation-name: kpi-cmp-in;
  animation-duration: 0.5s;
  animation-timing-function: ${EASE};
  animation-delay: 0.55s;
  animation-fill-mode: both;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--g100);
    transform-origin: left;
    animation-name: kpi-line-in;
    animation-duration: 0.4s;
    animation-timing-function: ${EASE};
    animation-delay: 0.5s;
    animation-fill-mode: both;
  }
`;

export const ComparisonItem = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
`;

export const ComparisonLabel = styled.span`
  font-family: var(--m);
  font-size: 11px;
  line-height: 16px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--g600);
  white-space: nowrap;
`;

export const ComparisonValue = styled.span`
  font-family: var(--m);
  font-size: 11px;
  line-height: 16px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--g700);
  white-space: nowrap;
`;

/* ── Delta pill ── */

export const DeltaPill = styled.span<{ status: string }>`
  font-family: var(--m);
  font-size: 10px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  animation-name: kpi-pill-pop;
  animation-duration: 0.45s;
  animation-timing-function: ${EASE};
  animation-delay: 0.7s;
  animation-fill-mode: both;
  transition: background 0.2s ${EASE};

  color: ${({ status }) => {
    if (status === 'up') return 'var(--up)';
    if (status === 'dn') return 'var(--dn)';
    if (status === 'wn') return 'var(--wn)';
    return 'var(--g600)';
  }};

  background: ${({ status }) => {
    if (status === 'up') return 'var(--up-b)';
    if (status === 'dn') return 'var(--dn-b)';
    if (status === 'wn') return 'var(--wn-b)';
    return 'transparent';
  }};

  .kpi-card:hover & {
    background: ${({ status }) => {
      if (status === 'up') return HOVER_UP;
      if (status === 'dn') return HOVER_DN;
      if (status === 'wn') return HOVER_WN;
      return 'transparent';
    }};
  }
`;

/* ══════════════════════════════════════════════════════════
   Detail Modal — drill-down overlay with hierarchical table
   ══════════════════════════════════════════════════════════ */

/** Backdrop overlay — renders via portal to document.body */
export const Overlay = styled.div<{ closing?: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 10, 0.45);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ closing }) => (closing ? 0 : 1)};
  transition: opacity 0.25s ${EASE};
  animation: kpi-overlay-in 0.25s ${EASE} both;
`;

/** Modal container */
export const Modal = styled.div<{ closing?: boolean }>`
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 10px;
  width: 92%;
  max-width: 960px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: ${({ closing }) =>
    closing ? 'translateY(12px) scale(.97)' : 'translateY(0) scale(1)'};
  opacity: ${({ closing }) => (closing ? 0 : 1)};
  transition: transform 0.3s ${EASE}, opacity 0.3s ${EASE};
  animation: kpi-modal-in 0.3s ${EASE} both;

  @media (max-width: 428px) {
    width: 98%;
    max-height: 90vh;
  }
`;

/** Modal header row */
export const ModalHead = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--g100);
  flex-shrink: 0;

  @media (max-width: 428px) {
    padding: 12px 14px;
    gap: 8px;
  }
`;

export const ModalTitle = styled.span`
  font-family: var(--f);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 18px;
  color: var(--ink);
`;

export const ModalValue = styled.span`
  font-family: var(--m);
  font-size: 14px;
  font-weight: 600;
  color: var(--c-sky);
  font-variant-numeric: tabular-nums;
`;

export const CloseButton = styled.button`
  margin-left: auto;
  width: 32px;
  height: 32px;
  border: 1px solid var(--g200);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  color: var(--g500);
  transition: border-color 0.15s ${EASE}, color 0.15s ${EASE};

  &:hover {
    border-color: var(--g300);
    color: var(--g700);
  }

  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
`;

/** Toolbar with search, mode toggles, hierarchy flip */
export const ModalToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--g100);
  flex-shrink: 0;

  @media (max-width: 428px) {
    flex-wrap: wrap;
  }
`;

export const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--g200);
  border-radius: 7px;
  padding: 0 4px 0 12px;
  height: 32px;
  flex: 1;
  max-width: 360px;
  transition: border-color 0.15s ${EASE};

  &:focus-within {
    border-color: var(--g300);
  }

  @media (max-width: 428px) {
    width: 100%;
    max-width: none;
  }
`;

export const SearchIcon = styled.svg`
  flex-shrink: 0;
  display: block;
  color: var(--g500);
`;

export const SearchInput = styled.input`
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--m);
  font-size: 11px;
  color: var(--ink);
  width: 100%;
  min-width: 0;

  &::placeholder {
    color: var(--g500);
  }
`;

export const ModeToggle = styled.div`
  display: flex;
  gap: 1px;
  background: var(--g100);
  border-radius: 5px;
  padding: 2px;
  flex-shrink: 0;
`;

export const ModeButton = styled.button<{ active: boolean }>`
  border: none;
  background: ${({ active }) => (active ? 'var(--s)' : 'transparent')};
  font-family: var(--m);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ active }) => (active ? 'var(--ink)' : 'var(--g500)')};
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.12s ${EASE};
  line-height: 1;
  box-shadow: ${({ active }) =>
    active ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none'};
`;

export const FlipButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--g200);
  border-radius: 7px;
  padding: 0 12px;
  height: 32px;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ${EASE};
  color: var(--g600);

  &:hover {
    border-color: var(--g300);
    color: var(--g700);
  }

  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }

  @media (max-width: 428px) {
    width: 100%;
    justify-content: center;
  }
`;

export const FlipIcon = styled.span<{ flipped?: boolean }>`
  display: inline-block;
  font-size: 11px;
  line-height: 1;
  transition: transform 0.3s ${EASE};
  transform: ${({ flipped }) => (flipped ? 'rotate(180deg)' : 'none')};
`;

export const FlipLabel = styled.span`
  font-family: var(--m);
  font-size: 11px;
  font-weight: 500;
  color: var(--g600);
`;

export const ResultsCount = styled.span`
  margin-left: auto;
  font-family: var(--m);
  font-size: 11px;
  color: var(--g500);
  font-variant-numeric: tabular-nums;
`;

/** Scrollable table area — horizontally scrollable on mobile */
export const TableWrap = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  @media (max-width: 428px) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
`;

export const DetailTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  @media (max-width: 428px) {
    min-width: 580px;
    table-layout: auto;
  }
`;

export const THead = styled.thead`
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--bg);
`;

export const THRow = styled.tr`
  & > th {
    padding: 10px 12px;
    font-family: var(--m);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--g600);
    text-align: left;
    border-top: 1px solid var(--g200);
    border-bottom: 1px solid var(--g200);
    white-space: nowrap;
  }

  & > th.r {
    text-align: right;
  }

  @media (max-width: 428px) {
    & > th {
      padding: 8px 8px;
      font-size: 10px;
    }
  }
`;

export const GroupRow = styled.tr`
  cursor: pointer;
  user-select: none;
  transition: background 0.1s ${EASE};

  &:hover {
    background: var(--g50);
  }

  & > td {
    font-family: var(--f);
    font-size: 13px;
    line-height: 20px;
    padding: 12px 12px;
    font-weight: 600;
    color: var(--ink);
    border-bottom: 1px solid var(--g100);
    vertical-align: middle;
  }

  & > td.r {
    text-align: right;
    font-family: var(--m);
    font-size: 12px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 428px) {
    & > td {
      padding: 8px 8px;
      font-size: 12px;
      line-height: 18px;
    }
    & > td.r {
      font-size: 11px;
    }
  }
`;

export const ChildRow = styled.tr`
  transition: background 0.1s ${EASE};

  &:hover {
    background: var(--g50);
  }

  & > td {
    font-family: var(--f);
    font-size: 12px;
    line-height: 20px;
    padding: 12px 12px;
    color: var(--g600);
    font-weight: 400;
    border-bottom: 1px solid var(--g100);
    vertical-align: middle;
  }

  & > td:first-of-type {
    padding-left: 36px;
  }

  & > td.r {
    text-align: right;
    font-family: var(--m);
    font-size: 12px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 428px) {
    & > td {
      padding: 8px 8px;
      font-size: 11px;
      line-height: 18px;
    }
    & > td:first-of-type {
      padding-left: 28px;
    }
    & > td.r {
      font-size: 11px;
    }
  }
`;

export const Chevron = styled.span<{ expanded: boolean }>`
  display: inline-block;
  font-size: 10px;
  width: 16px;
  margin-right: 8px;
  color: var(--g500);
  vertical-align: middle;
  transition: transform 0.2s ${EASE};
  transform: rotate(${({ expanded }) => (expanded ? '90deg' : '0deg')});
`;

/** Small delta pill for table cells */
export const TablePill = styled.span<{ status: string }>`
  font-family: var(--m);
  font-size: 10px;
  font-weight: 600;
  padding: 4px 6px;
  border-radius: 4px;
  white-space: nowrap;

  color: ${({ status }) => {
    if (status === 'up') return 'var(--up)';
    if (status === 'dn') return 'var(--dn)';
    if (status === 'wn') return 'var(--wn)';
    return 'var(--g600)';
  }};

  background: ${({ status }) => {
    if (status === 'up') return 'var(--up-b)';
    if (status === 'dn') return 'var(--dn-b)';
    if (status === 'wn') return 'var(--wn-b)';
    return 'transparent';
  }};
`;

/** Modal footer */
export const ModalFoot = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-top: 1px solid var(--g100);
  flex-shrink: 0;

  @media (max-width: 428px) {
    padding: 8px 14px;
  }
`;

export const FooterHint = styled.span`
  font-family: var(--m);
  font-size: 11px;
  color: var(--g500);
`;

export const ExportButton = styled.button`
  margin-left: auto;
  border: 1px solid var(--g200);
  background: transparent;
  color: var(--g600);
  font-family: var(--m);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ${EASE};
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    border-color: var(--c-sky);
    color: var(--c-sky);
  }

  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
`;
