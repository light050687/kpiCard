import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { formatRussianPercent, formatDeltaByFormat, } from './utils/formatRussian';
import { CARD_CLASS, KEYFRAMES_CSS, KpiCardRoot, Card, CardHead, CardTitle, ToggleGroup, ToggleButton, DataContainer, DataLayer, HeroValue, Subtitle, ComparisonSection, ComparisonItem, ComparisonLabel, ComparisonValue, DeltaPill, } from './styles';
import DetailModal from './DetailModal';
/* ── Counter animation ──────────────────────────────────────────────
 * The integer part of the hero value counts up from 0 → target.
 * Easing: cubic-bezier(.4,0,.2,1) ≈ easeOutQuart.
 * ────────────────────────────────────────────────────────────────── */
const COUNTER_DELAY_MS = 250;
function easeOutQuart(t) {
    return 1 - (1 - t) ** 4;
}
function counterDuration(target) {
    return Math.min(1200, 700 + target * 30);
}
function parseHeroInt(value) {
    const m = value.match(/^(.*?)(\d+)([\s\S]*)$/);
    if (!m)
        return null;
    return { prefix: m[1], num: parseInt(m[2], 10), suffix: m[3] };
}
function useCountUp(target, duration, delay) {
    const [current, setCurrent] = useState(0);
    const raf = useRef(0);
    useEffect(() => {
        if (target <= 0) {
            setCurrent(target);
            return undefined;
        }
        const timer = window.setTimeout(() => {
            const start = performance.now();
            const tick = (now) => {
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
function AnimatedHero({ value }) {
    const parsed = parseHeroInt(value);
    const target = parsed?.num ?? 0;
    const dur = counterDuration(target);
    const count = useCountUp(target, dur, COUNTER_DELAY_MS);
    if (!parsed || target === 0) {
        return _jsx(HeroValue, { children: value });
    }
    return (_jsxs(HeroValue, { children: [parsed.prefix, count, parsed.suffix] }));
}
/* ── Toggle slide transition ─────────────────────────────────────── */
function layerStyle(visible, direction) {
    if (visible) {
        return { opacity: 1, transform: 'translateX(0)', pointerEvents: 'auto' };
    }
    const tx = direction === 'left' ? '-16px' : '16px';
    return { opacity: 0, transform: `translateX(${tx})`, pointerEvents: 'none' };
}
/* ── Sub-components ────────────────────────────────────────────── */
function ComparisonRow({ item, skipAnimation, }) {
    return (_jsxs(ComparisonItem, { children: [_jsx(ComparisonLabel, { children: item.label }), _jsx(ComparisonValue, { children: item.value }), _jsx(DeltaPill, { status: item.status, skipAnimation: skipAnimation, children: item.delta })] }));
}
function ViewContent({ view, skipAnimation, }) {
    return (_jsxs(_Fragment, { children: [_jsx(AnimatedHero, { value: view.value }), view.subtitle && _jsx(Subtitle, { children: view.subtitle }), view.comparisons.length > 0 && (_jsx(ComparisonSection, { skipAnimation: skipAnimation, children: view.comparisons.map((cmp, i) => (_jsx(ComparisonRow, { item: cmp, skipAnimation: skipAnimation }, `${cmp.label}-${i}`))) }))] }));
}
/* ── Main component ────────────────────────────────────────────── */
export default function KpiCard({ width, height, headerText, modeCount, toggleLabelA, toggleLabelB, modeAView, modeBView, colorScheme1A, colorScheme1B, colorScheme2A, colorScheme2B, deltaFormat1A, deltaFormat2A, deltaFormat1B, deltaFormat2B, enableComp1, enableComp2, comp1Label, comp2Label, hierarchyLabelPrimary, hierarchyLabelSecondary, isDarkMode, detailDataRaw, 
// aggregationType removed — always SUM-based logic
formatValueA, formatValueB, formatDelta, detailTopN, }) {
    const [activeMode, setActiveMode] = useState('a');
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
    // Resolve 'auto' delta format by aggregationType
    const resolveAutoFmt = (fmt, aggType) => fmt === 'auto'
        ? aggType === 'PERCENT'
            ? 'pp'
            : aggType === 'SUM'
                ? 'absolute'
                : 'percent'
        : fmt;
    // Recompute hero + comparisons from raw data when aggregation != SUM
    const recomputeFromRaw = (aggType, fmtValue, baseView, deltaFmt1, deltaFmt2) => {
        if (aggType === 'SUM' || !rawRows?.length)
            return null;
        // Group by primaryGroup for aggregation
        const groups = new Map();
        for (const r of rawRows) {
            const existing = groups.get(r.primaryGroup);
            if (existing) {
                existing.metric += r.metricValue;
                existing.comp1 += r.comp1Value ?? 0;
                existing.comp2 += r.comp2Value ?? 0;
            }
            else {
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
        let heroNum;
        let comp1Num;
        let comp2Num;
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
        const comparisons = [];
        if (hasComp1) {
            const d = heroNum - comp1Num;
            const status = d > 0 ? 'up' : d < 0 ? 'dn' : 'neutral';
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
            const status = d > 0 ? 'up' : d < 0 ? 'dn' : 'neutral';
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
    // Filter comparisons, override labels, re-format deltas, apply colorScheme inversion
    const processView = (view, scheme1, scheme2, dFmt1, dFmt2, aggType) => ({
        ...view,
        comparisons: view.comparisons
            .filter(cmp => {
            if (cmp.type === 'comp1' && !enableComp1)
                return false;
            if (cmp.type === 'comp2' && !enableComp2)
                return false;
            return true;
        })
            .map(cmp => {
            // Override labels with user-configured values
            let { label, delta } = cmp;
            if (cmp.type === 'comp1')
                label = comp1Label;
            if (cmp.type === 'comp2')
                label = comp2Label;
            // Re-format delta from raw values when available
            if (cmp.rawDiff != null && cmp.rawRef != null) {
                const fmt = cmp.type === 'comp2' ? dFmt2 : dFmt1;
                delta = formatDeltaByFormat(cmp.rawDiff, cmp.rawRef, resolveAutoFmt(fmt, aggType), aggType === 'PERCENT');
            }
            // Apply per-comparison colorScheme
            const scheme = cmp.type === 'comp2' ? scheme2 : scheme1;
            if (scheme === 'green_up')
                return { ...cmp, label, delta };
            // green_down: growth is bad → invert up ↔ dn
            const inverted = cmp.status === 'up' ? 'dn' : cmp.status === 'dn' ? 'up' : cmp.status;
            return { ...cmp, label, delta, status: inverted };
        }),
    });
    const viewA = processView(recomputeFromRaw('SUM', formatValueA, modeAView, deltaFormat1A, deltaFormat2A) ?? modeAView, colorScheme1A, colorScheme2A, deltaFormat1A, deltaFormat2A, 'SUM');
    const viewB = processView(recomputeFromRaw('SUM', formatValueB, modeBView, deltaFormat1B, deltaFormat2B) ?? modeBView, colorScheme1B, colorScheme2B, deltaFormat1B, deltaFormat2B, 'SUM');
    const hasDetail = Boolean(rawRows?.length);
    return (_jsxs(KpiCardRoot, { width: width, height: height, "data-theme": isDarkMode ? 'dark' : 'light', role: "figure", "aria-label": `${headerText}: ${modeAView.value}`, children: [_jsx("style", { dangerouslySetInnerHTML: { __html: KEYFRAMES_CSS } }), _jsxs(Card, { className: CARD_CLASS, onClick: hasDetail ? () => setIsModalOpen(true) : undefined, style: hasDetail ? { cursor: 'pointer' } : undefined, children: [_jsxs(CardHead, { children: [_jsx(CardTitle, { children: headerText }), isDual && (_jsxs(ToggleGroup, { role: "tablist", "aria-label": "Toggle mode A / B", children: [_jsx(ToggleButton, { active: isA, role: "tab", "aria-selected": isA, onClick: e => { e.stopPropagation(); setActiveMode('a'); }, children: toggleLabelA }), _jsx(ToggleButton, { active: !isA, role: "tab", "aria-selected": !isA, onClick: e => { e.stopPropagation(); setActiveMode('b'); }, children: toggleLabelB })] }))] }), _jsxs(DataContainer, { children: [_jsx(DataLayer, { style: layerStyle(isA, 'left'), "aria-hidden": !isA, children: _jsx(ViewContent, { view: viewA, skipAnimation: hasAnimated }) }), isDual && (_jsx(DataLayer, { style: layerStyle(!isA, 'right'), "aria-hidden": isA, children: _jsx(ViewContent, { view: viewB, skipAnimation: hasAnimated }) }))] })] }), hasDetail && detailDataRaw && (_jsx(DetailModal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), title: headerText, headerValue: isA ? viewA.value : viewB.value, detailDataRaw: detailDataRaw, aggregationType: isA ? 'SUM' : 'SUM', colorScheme1: isA ? colorScheme1A : colorScheme1B, colorScheme2: isA ? colorScheme2A : colorScheme2B, deltaFormat1: isA ? deltaFormat1A : deltaFormat1B, deltaFormat2: isA ? deltaFormat2A : deltaFormat2B, formatValue: isA ? formatValueA : formatValueB, formatDelta: formatDelta, hierarchyLabelPrimary: hierarchyLabelPrimary, hierarchyLabelSecondary: hierarchyLabelSecondary, enableComp1: enableComp1, enableComp2: enableComp2, comp1Label: comp1Label, comp2Label: comp2Label, topN: detailTopN, isDarkMode: isDarkMode }))] }));
}
//# sourceMappingURL=KpiCard.js.map