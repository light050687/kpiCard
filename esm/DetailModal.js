import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useEffect, useRef, useMemo, } from 'react';
import { aggregateDetailData } from './utils/aggregation';
import { Overlay, Modal, ModalHead, ModalTitle, ModalValue, CloseButton, ModalToolbar, SearchBox, SearchIcon, SearchInput, SearchScopeToggle, SearchScopeButton, FlipButton, FlipIcon, FlipLabel, ResultsCount, TableWrap, DetailTable, THead, THRow, GroupRow, ChildRow, Chevron, TablePill, EmptyRow, ModalFoot, FooterHint, ExportButton, } from './styles';
/* ── Constants ── */
const CLOSE_DURATION_MS = 300;
/* ── CSV Export ── */
function exportToCsv(data, title, groupLabel, childLabel, enableComp1, enableComp2, comp1Header, comp2Header) {
    const BOM = '\uFEFF';
    const headers = [groupLabel, childLabel, 'Факт'];
    if (enableComp1)
        headers.push(comp1Header, `Δ ${comp1Header}`);
    if (enableComp2)
        headers.push(comp2Header, `Δ ${comp2Header}`);
    const rows = [];
    for (const group of data) {
        for (const child of group.children) {
            const row = [group.name, child.name, child.value];
            if (enableComp1)
                row.push(child.comp1Value ?? '', child.comp1Delta ?? '');
            if (enableComp2)
                row.push(child.comp2Value ?? '', child.comp2Delta ?? '');
            rows.push(row);
        }
    }
    const escape = (cell) => `"${cell.replace(/"/g, '""')}"`;
    const csv = BOM +
        [headers, ...rows].map(row => row.map(escape).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${title}-detail.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
}
/* ── Search icon SVG ── */
function MagnifyIcon() {
    return (_jsxs(SearchIcon, { width: "13", height: "13", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "7", cy: "7", r: "5" }), _jsx("line", { x1: "10.5", y1: "10.5", x2: "14", y2: "14" })] }));
}
/* ── Table cell helpers ── */
function DeltaCell({ delta, status, }) {
    if (!delta)
        return _jsx("td", { className: "r" });
    return (_jsx("td", { className: "r", children: _jsx(TablePill, { status: status ?? 'neutral', children: delta }) }));
}
function GroupRowView({ group, expanded, onToggle, enableComp1, enableComp2, }) {
    const { summary } = group;
    return (_jsxs(GroupRow, { onClick: onToggle, children: [_jsxs("td", { children: [_jsx(Chevron, { expanded: expanded, "aria-hidden": "true", children: "\u25B6" }), group.name] }), _jsx("td", { className: "r", children: summary.value }), enableComp1 && _jsx("td", { className: "r", children: summary.comp1Value ?? '' }), enableComp1 && (_jsx(DeltaCell, { delta: summary.comp1Delta, status: summary.comp1Status })), enableComp2 && _jsx("td", { className: "r", children: summary.comp2Value ?? '' }), enableComp2 && (_jsx(DeltaCell, { delta: summary.comp2Delta, status: summary.comp2Status }))] }));
}
function ChildRowView({ row, enableComp1, enableComp2, }) {
    return (_jsxs(ChildRow, { children: [_jsx("td", { children: row.name }), _jsx("td", { className: "r", children: row.value }), enableComp1 && _jsx("td", { className: "r", children: row.comp1Value ?? '' }), enableComp1 && (_jsx(DeltaCell, { delta: row.comp1Delta, status: row.comp1Status })), enableComp2 && _jsx("td", { className: "r", children: row.comp2Value ?? '' }), enableComp2 && (_jsx(DeltaCell, { delta: row.comp2Delta, status: row.comp2Status }))] }));
}
/* ── Main component ── */
export default function DetailModal({ isOpen, onClose, title, headerValue, detailDataRaw, aggregationType, colorScheme1, colorScheme2, deltaFormat1, deltaFormat2, formatValue, formatDelta, hierarchyLabelPrimary, hierarchyLabelSecondary, enableComp1, enableComp2, comp1Label, comp2Label, topN, }) {
    const [isClosing, setIsClosing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchScope, setSearchScope] = useState('group');
    const [hierarchyMode, setHierarchyMode] = useState('primary');
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const modalRef = useRef(null);
    const closeRef = useRef(null);
    const isPrimary = hierarchyMode === 'primary';
    // Current hierarchy labels
    const groupLabel = isPrimary ? hierarchyLabelPrimary : hierarchyLabelSecondary;
    const childLabel = isPrimary ? hierarchyLabelSecondary : hierarchyLabelPrimary;
    // Comparison header labels (strip trailing colon for table/CSV)
    const comp1Header = comp1Label.replace(/:?\s*$/, '');
    const comp2Header = comp2Label.replace(/:?\s*$/, '');
    /* ── Aggregate raw data on hierarchy/mode change (Req #11) ── */
    const aggregatedData = useMemo(() => aggregateDetailData({
        rows: detailDataRaw.rows,
        groupByField: isPrimary ? 'primaryGroup' : 'secondaryGroup',
        childField: isPrimary ? 'secondaryGroup' : 'primaryGroup',
        aggregationType,
        topN,
        formatValue,
        formatDelta,
        colorScheme1,
        colorScheme2,
        enableComp1,
        enableComp2,
        deltaFormat1,
        deltaFormat2,
    }), [
        detailDataRaw, isPrimary, aggregationType, topN,
        formatValue, formatDelta, colorScheme1, colorScheme2,
        enableComp1, enableComp2, deltaFormat1, deltaFormat2,
    ]);
    /* ── Search filtering (by scope: group or child) ── */
    const filteredData = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q)
            return aggregatedData;
        if (searchScope === 'group') {
            // Search by group name only — matching group shows all children
            return aggregatedData.filter(group => group.name.toLowerCase().includes(q));
        }
        // searchScope === 'child' — search by child name only
        return aggregatedData
            .map(group => {
            const matchingChildren = group.children.filter(child => child.name.toLowerCase().includes(q));
            if (matchingChildren.length > 0) {
                return { ...group, children: matchingChildren };
            }
            return null;
        })
            .filter((g) => g !== null);
    }, [aggregatedData, searchQuery, searchScope]);
    const groupCount = filteredData.length;
    /* ── Close with exit animation ── */
    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            setSearchQuery('');
            setSearchScope('group');
            setExpandedGroups(new Set());
            onClose();
        }, CLOSE_DURATION_MS);
    }, [onClose]);
    const handleOverlayClick = useCallback((e) => {
        if (e.target === e.currentTarget)
            handleClose();
    }, [handleClose]);
    /* ── Escape key ── */
    useEffect(() => {
        if (!isOpen)
            return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape')
                handleClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, handleClose]);
    /* ── Focus management ── */
    useEffect(() => {
        if (isOpen)
            closeRef.current?.focus();
    }, [isOpen]);
    /* ── Focus trap ── */
    const handleKeyDown = useCallback((e) => {
        if (e.key !== 'Tab')
            return;
        const focusable = modalRef.current?.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])');
        if (!focusable?.length)
            return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        }
        else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }, []);
    /* ── Group expand/collapse ── */
    const toggleGroup = useCallback((name) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(name))
                next.delete(name);
            else
                next.add(name);
            return next;
        });
    }, []);
    /* ── Hierarchy flip ── */
    const flipHierarchy = useCallback(() => {
        setHierarchyMode(prev => (prev === 'primary' ? 'secondary' : 'primary'));
        setExpandedGroups(new Set());
        setSearchQuery('');
    }, []);
    /* ── Export ── */
    const handleExport = useCallback(() => {
        exportToCsv(filteredData, title, groupLabel, childLabel, enableComp1, enableComp2, comp1Header, comp2Header);
    }, [filteredData, title, groupLabel, childLabel, enableComp1, enableComp2, comp1Header, comp2Header]);
    /* ── Compute column count for table-layout ── */
    const colCount = 2 + (enableComp1 ? 2 : 0) + (enableComp2 ? 2 : 0);
    // Column widths based on visible columns
    const nameWidth = colCount <= 4 ? '40%' : '30%';
    const valWidth = colCount <= 4 ? '20%' : '14%';
    const deltaWidth = colCount <= 4 ? '15%' : '10%';
    /* ── Render guard ── */
    if (!isOpen && !isClosing)
        return null;
    return (_jsx(Overlay, { closing: isClosing, onClick: handleOverlayClick, children: _jsxs(Modal, { ref: modalRef, closing: isClosing, role: "dialog", "aria-modal": "true", "aria-label": `${title} — детализация`, onClick: e => e.stopPropagation(), onKeyDown: handleKeyDown, children: [_jsxs(ModalHead, { children: [_jsx(ModalTitle, { children: title }), _jsx(ModalValue, { children: headerValue }), _jsx(CloseButton, { ref: closeRef, onClick: handleClose, "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", children: "\u00D7" })] }), _jsxs(ModalToolbar, { children: [_jsxs(SearchBox, { children: [_jsx(MagnifyIcon, {}), _jsx(SearchInput, { type: "text", placeholder: "\u041F\u043E\u0438\u0441\u043A...", "aria-label": "\u041F\u043E\u0438\u0441\u043A", value: searchQuery, onChange: e => setSearchQuery(e.target.value) }), _jsxs(SearchScopeToggle, { children: [_jsx(SearchScopeButton, { active: searchScope === 'group', onClick: () => { setSearchScope('group'); setExpandedGroups(new Set()); }, "aria-label": `Поиск по ${groupLabel}`, children: groupLabel }), _jsx(SearchScopeButton, { active: searchScope === 'child', onClick: () => { setSearchScope('child'); setExpandedGroups(new Set()); }, "aria-label": `Поиск по ${childLabel}`, children: childLabel })] })] }), _jsxs(FlipButton, { onClick: flipHierarchy, "aria-label": "\u0421\u043C\u0435\u043D\u0438\u0442\u044C \u0438\u0435\u0440\u0430\u0440\u0445\u0438\u044E", children: [_jsx(FlipIcon, { flipped: !isPrimary, "aria-hidden": "true", children: "\u21C5" }), _jsx(FlipLabel, { children: isPrimary
                                        ? `${hierarchyLabelPrimary}\u00A0→\u00A0${hierarchyLabelSecondary}`
                                        : `${hierarchyLabelSecondary}\u00A0→\u00A0${hierarchyLabelPrimary}` })] }), _jsxs(ResultsCount, { children: [groupLabel, ": ", groupCount] })] }), _jsx(TableWrap, { children: _jsxs(DetailTable, { children: [_jsx(THead, { children: _jsxs(THRow, { children: [_jsx("th", { style: { width: nameWidth }, children: groupLabel }), _jsx("th", { className: "r", style: { width: valWidth }, children: "\u0424\u0430\u043A\u0442" }), enableComp1 && (_jsx("th", { className: "r", style: { width: valWidth }, children: comp1Header })), enableComp1 && (_jsx("th", { className: "r", style: { width: deltaWidth }, children: "\u0394" })), enableComp2 && (_jsx("th", { className: "r", style: { width: valWidth }, children: comp2Header })), enableComp2 && (_jsx("th", { className: "r", style: { width: deltaWidth }, children: "\u0394" }))] }) }), _jsx("tbody", { children: filteredData.length === 0 ? (_jsx(EmptyRow, { children: _jsx("td", { colSpan: colCount, children: "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E" }) })) : (filteredData.flatMap(group => {
                                    const isExpanded = expandedGroups.has(group.name);
                                    return [
                                        _jsx(GroupRowView, { group: group, expanded: isExpanded, onToggle: () => toggleGroup(group.name), enableComp1: enableComp1, enableComp2: enableComp2 }, `g-${group.name}`),
                                        ...(isExpanded
                                            ? group.children.map(child => (_jsx(ChildRowView, { row: child, enableComp1: enableComp1, enableComp2: enableComp2 }, `c-${group.name}-${child.name}`)))
                                            : []),
                                    ];
                                })) })] }) }), _jsxs(ModalFoot, { children: [_jsx(FooterHint, { children: "\u25B6 \u0440\u0430\u0441\u043A\u0440\u044B\u0442\u044C \u0434\u0435\u0442\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044E" }), _jsxs(ExportButton, { onClick: handleExport, "aria-label": "\u042D\u043A\u0441\u043F\u043E\u0440\u0442 \u0434\u0430\u043D\u043D\u044B\u0445", children: [_jsx("svg", { width: "13", height: "13", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M8 2v9M4 7.5 8 11l4-3.5M3 14h10" }) }), ' ', "\u042D\u043A\u0441\u043F\u043E\u0440\u0442"] })] })] }) }));
}
//# sourceMappingURL=DetailModal.js.map