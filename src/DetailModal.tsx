import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import {
  DetailDataRaw,
  DeltaFormat,
  DetailGroup,
  DetailRow,
  HierarchyMode,
  AggregationType,
  ComparisonColorScheme,
} from './types';
import { aggregateDetailData } from './utils/aggregation';
import {
  Overlay,
  Modal,
  ModalHead,
  ModalTitle,
  ModalValue,
  CloseButton,
  ModalToolbar,
  SearchBox,
  SearchIcon,
  SearchInput,
  SearchScopeToggle,
  SearchScopeButton,
  FlipButton,
  FlipIcon,
  FlipLabel,
  ResultsCount,
  TableWrap,
  DetailTable,
  THead,
  THRow,
  GroupRow,
  ChildRow,
  Chevron,
  TablePill,
  EmptyRow,
  ModalFoot,
  FooterHint,
  ExportButton,
} from './styles';

/* ── Constants ── */

const CLOSE_DURATION_MS = 300;

type SearchScope = 'group' | 'child';

/* ── CSV Export ── */

function exportToCsv(
  data: DetailGroup[],
  title: string,
  groupLabel: string,
  childLabel: string,
  enableComp1: boolean,
  enableComp2: boolean,
  comp1Header: string,
  comp2Header: string,
  factHeader: string,
  delta1Header: string,
  delta2Header: string,
): void {
  const BOM = '\uFEFF';
  const headers = [groupLabel, childLabel, factHeader];
  if (enableComp1) {
    headers.push(comp1Header);
    // delta1 column added only if data has deltas (delta1Header present)
    headers.push(delta1Header);
  }
  if (enableComp2) {
    headers.push(comp2Header);
    headers.push(delta2Header);
  }

  const rows: string[][] = [];
  for (const group of data) {
    for (const child of group.children) {
      const row = [group.name, child.name, child.value];
      if (enableComp1) row.push(child.comp1Value ?? '', child.comp1Delta ?? '');
      if (enableComp2) row.push(child.comp2Value ?? '', child.comp2Delta ?? '');
      rows.push(row);
    }
  }

  const escape = (cell: string): string => `"${cell.replace(/"/g, '""')}"`;
  const csv =
    BOM +
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

function MagnifyIcon(): JSX.Element {
  return (
    <SearchIcon
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
    </SearchIcon>
  );
}

/* ── Table cell helpers ── */

function DeltaCell({
  delta,
  status,
}: {
  delta?: string;
  status?: string;
}): JSX.Element {
  if (!delta) return <td className="r" />;
  return (
    <td className="r">
      <TablePill status={status ?? 'neutral'}>{delta}</TablePill>
    </td>
  );
}

function GroupRowView({
  group,
  expanded,
  onToggle,
  enableComp1,
  enableComp2,
  showDelta1 = true,
  showDelta2 = true,
}: {
  group: DetailGroup;
  expanded: boolean;
  onToggle: () => void;
  enableComp1: boolean;
  enableComp2: boolean;
  showDelta1?: boolean;
  showDelta2?: boolean;
}): JSX.Element {
  const { summary } = group;
  return (
    <GroupRow onClick={onToggle}>
      <td>
        <Chevron expanded={expanded} aria-hidden="true">▶</Chevron>
        {group.name}
      </td>
      <td className="r">{summary.value}</td>
      {enableComp1 && <td className="r">{summary.comp1Value ?? ''}</td>}
      {enableComp1 && showDelta1 && (
        <DeltaCell delta={summary.comp1Delta} status={summary.comp1Status} />
      )}
      {enableComp2 && <td className="r">{summary.comp2Value ?? ''}</td>}
      {enableComp2 && showDelta2 && (
        <DeltaCell delta={summary.comp2Delta} status={summary.comp2Status} />
      )}
    </GroupRow>
  );
}

function ChildRowView({
  row,
  enableComp1,
  enableComp2,
  showDelta1 = true,
  showDelta2 = true,
}: {
  row: DetailRow;
  enableComp1: boolean;
  enableComp2: boolean;
  showDelta1?: boolean;
  showDelta2?: boolean;
}): JSX.Element {
  return (
    <ChildRow>
      <td>{row.name}</td>
      <td className="r">{row.value}</td>
      {enableComp1 && <td className="r">{row.comp1Value ?? ''}</td>}
      {enableComp1 && showDelta1 && (
        <DeltaCell delta={row.comp1Delta} status={row.comp1Status} />
      )}
      {enableComp2 && <td className="r">{row.comp2Value ?? ''}</td>}
      {enableComp2 && showDelta2 && (
        <DeltaCell delta={row.comp2Delta} status={row.comp2Status} />
      )}
    </ChildRow>
  );
}

/* ── Props ── */

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headerValue: string;
  detailDataRaw: DetailDataRaw;
  aggregationType: AggregationType;
  colorScheme1: ComparisonColorScheme;
  colorScheme2: ComparisonColorScheme;
  deltaFormat1: DeltaFormat;
  deltaFormat2: DeltaFormat;
  formatValue: (n: number) => string;
  formatDelta: (n: number) => string;
  hierarchyLabelPrimary: string;
  hierarchyLabelSecondary: string;
  enableComp1: boolean;
  enableComp2: boolean;
  comp1Label: string;
  comp2Label: string;
  colFact?: string;
  colComp1?: string;
  colDelta1?: string;
  colComp2?: string;
  colDelta2?: string;
  formatComp1?: (n: number) => string;
  formatComp2?: (n: number) => string;
  formatDelta1?: (n: number) => string;
  formatDelta2?: (n: number) => string;
  showDelta1?: boolean;
  showDelta2?: boolean;
  topN: number;
  pageSize: number;
  isDarkMode: boolean;
}

/* ── Main component ── */

export default function DetailModal({
  isOpen,
  onClose,
  title,
  headerValue,
  detailDataRaw,
  aggregationType,
  colorScheme1,
  colorScheme2,
  deltaFormat1,
  deltaFormat2,
  formatValue,
  formatDelta,
  hierarchyLabelPrimary,
  hierarchyLabelSecondary,
  enableComp1,
  enableComp2,
  comp1Label,
  comp2Label,
  colFact = 'Факт',
  colComp1 = '',
  colDelta1 = 'Дельта',
  colComp2 = '',
  colDelta2 = 'Дельта',
  formatComp1: fmtComp1,
  formatComp2: fmtComp2,
  formatDelta1: fmtDelta1,
  formatDelta2: fmtDelta2,
  showDelta1 = true,
  showDelta2 = true,
  topN,
  pageSize = 20,
}: DetailModalProps): JSX.Element | null {
  const [isClosing, setIsClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('group');
  const [hierarchyMode, setHierarchyMode] =
    useState<HierarchyMode>('primary');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(),
  );
  const [currentPage, setCurrentPage] = useState(0);
  type SortColumn = 'name' | 'value' | 'comp1Value' | 'comp1Delta' | 'comp2Value' | 'comp2Delta';
  const [sortColumn, setSortColumn] = useState<SortColumn>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const modalRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const isPrimary = hierarchyMode === 'primary';

  // Current hierarchy labels
  const groupLabel = isPrimary ? hierarchyLabelPrimary : hierarchyLabelSecondary;
  const childLabel = isPrimary ? hierarchyLabelSecondary : hierarchyLabelPrimary;

  // Comparison header labels (strip trailing colon for table/CSV)
  const comp1Header = colComp1 || comp1Label.replace(/:?\s*$/, '');
  const comp2Header = colComp2 || comp2Label.replace(/:?\s*$/, '');
  const delta1Header = colDelta1;
  const delta2Header = colDelta2;

  /* ── Aggregate raw data on hierarchy/mode change (Req #11) ── */

  const aggregatedData = useMemo(
    () =>
      aggregateDetailData({
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
        fmtComp1,
        fmtComp2,
        fmtDelta1,
        fmtDelta2,
        showDelta1,
        showDelta2,
      }),
    [
      detailDataRaw, isPrimary, aggregationType, topN,
      formatValue, formatDelta, colorScheme1, colorScheme2,
      enableComp1, enableComp2, deltaFormat1, deltaFormat2,
      fmtComp1, fmtComp2, fmtDelta1, fmtDelta2, showDelta1, showDelta2,
    ],
  );

  /* ── Search filtering (by scope: group or child) ── */

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return aggregatedData;

    if (searchScope === 'group') {
      // Search by group name only — matching group shows all children
      return aggregatedData.filter(group =>
        group.name.toLowerCase().includes(q),
      );
    }

    // searchScope === 'child' — search by child name only
    return aggregatedData
      .map(group => {
        const matchingChildren = group.children.filter(child =>
          child.name.toLowerCase().includes(q),
        );
        if (matchingChildren.length > 0) {
          return { ...group, children: matchingChildren };
        }
        return null;
      })
      .filter((g): g is DetailGroup => g !== null);
  }, [aggregatedData, searchQuery, searchScope]);

  // Reset page on search/flip
  useEffect(() => { setCurrentPage(0); }, [searchQuery, hierarchyMode]);

  /* ── Sorting ── */
  const parseNumeric = (s: string | undefined): number => {
    if (!s) return 0;
    const clean = s.replace(/[^\d,\-−.]/g, '').replace('−', '-').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const sortedData = useMemo(() => {
    const data = [...filteredData];
    const dir = sortDirection === 'asc' ? 1 : -1;
    data.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      if (sortColumn === 'name') {
        return dir * a.name.localeCompare(b.name, 'ru');
      }
      aVal = parseNumeric(a.summary[sortColumn]);
      bVal = parseNumeric(b.summary[sortColumn]);
      return dir * ((aVal as number) - (bVal as number));
    });
    // Sort children within each group by same column
    return data.map(group => ({
      ...group,
      children: [...group.children].sort((a, b) => {
        if (sortColumn === 'name') return dir * a.name.localeCompare(b.name, 'ru');
        return dir * (parseNumeric(a[sortColumn]) - parseNumeric(b[sortColumn]));
      }),
    }));
  }, [filteredData, sortColumn, sortDirection]);

  /* ── Pagination ── */
  const totalGroups = sortedData.length;
  const totalPages = pageSize > 0 ? Math.ceil(totalGroups / pageSize) : 1;
  const pagedData = pageSize > 0
    ? sortedData.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
    : sortedData;
  const groupCount = totalGroups;

  const handleSort = (col: SortColumn): void => {
    if (sortColumn === col) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('desc');
    }
    setCurrentPage(0);
  };

  const sortIcon = (col: SortColumn): string => {
    if (sortColumn !== col) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  /* ── Close with exit animation ── */

  const handleClose = useCallback((): void => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setSearchQuery('');
      setSearchScope('group');
      setExpandedGroups(new Set());
      onClose();
    }, CLOSE_DURATION_MS);
  }, [onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent): void => {
      if (e.target === e.currentTarget) handleClose();
    },
    [handleClose],
  );

  /* ── Escape key ── */

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, handleClose]);

  /* ── Focus management ── */

  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  /* ── Focus trap ── */

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key !== 'Tab') return;
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, input, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [],
  );

  /* ── Group expand/collapse ── */

  const toggleGroup = useCallback((name: string): void => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  /* ── Hierarchy flip ── */

  const flipHierarchy = useCallback((): void => {
    setHierarchyMode(prev => (prev === 'primary' ? 'secondary' : 'primary'));
    setExpandedGroups(new Set());
    setSearchQuery('');
  }, []);

  /* ── Export ── */

  const handleExport = useCallback((): void => {
    exportToCsv(filteredData, title, groupLabel, childLabel, enableComp1, enableComp2, comp1Header, comp2Header, colFact, delta1Header, delta2Header);
  }, [filteredData, title, groupLabel, childLabel, enableComp1, enableComp2, comp1Header, comp2Header, colFact, delta1Header, delta2Header]);

  /* ── Compute column count for table-layout ── */

  const colCount = 2 + (enableComp1 ? 2 : 0) + (enableComp2 ? 2 : 0);

  // Column widths based on visible columns
  const nameWidth = colCount <= 4 ? '40%' : '30%';
  const valWidth = colCount <= 4 ? '20%' : '14%';
  const deltaWidth = colCount <= 4 ? '15%' : '10%';

  /* ── Render guard ── */

  if (!isOpen && !isClosing) return null;

  return (
    <Overlay closing={isClosing} onClick={handleOverlayClick}>
      <Modal
        ref={modalRef}
        closing={isClosing}
        role="dialog"
        aria-modal="true"
        aria-label={`${title} — детализация`}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* ── Header ── */}
        <ModalHead>
          <ModalTitle>{title}</ModalTitle>
          <ModalValue>{headerValue}</ModalValue>
          <CloseButton
            ref={closeRef}
            onClick={handleClose}
            aria-label="Закрыть"
          >
            &times;
          </CloseButton>
        </ModalHead>

        {/* ── Toolbar ── */}
        <ModalToolbar>
          <SearchBox>
            <MagnifyIcon />
            <SearchInput
              type="text"
              placeholder="Поиск..."
              aria-label="Поиск"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <SearchScopeToggle>
              <SearchScopeButton
                active={searchScope === 'group'}
                onClick={() => { setSearchScope('group'); setExpandedGroups(new Set()); }}
                aria-label={`Поиск по ${groupLabel}`}
              >
                {groupLabel}
              </SearchScopeButton>
              <SearchScopeButton
                active={searchScope === 'child'}
                onClick={() => { setSearchScope('child'); setExpandedGroups(new Set()); }}
                aria-label={`Поиск по ${childLabel}`}
              >
                {childLabel}
              </SearchScopeButton>
            </SearchScopeToggle>
          </SearchBox>

          <FlipButton
            onClick={flipHierarchy}
            aria-label="Сменить иерархию"
          >
            <FlipIcon flipped={!isPrimary} aria-hidden="true">⇅</FlipIcon>
            <FlipLabel>
              {isPrimary
                ? `${hierarchyLabelPrimary}\u00A0→\u00A0${hierarchyLabelSecondary}`
                : `${hierarchyLabelSecondary}\u00A0→\u00A0${hierarchyLabelPrimary}`}
            </FlipLabel>
          </FlipButton>

          <ResultsCount>{groupLabel}: {groupCount}</ResultsCount>
        </ModalToolbar>

        {/* ── Table — dynamic columns ── */}
        <TableWrap>
          <DetailTable>
            <THead>
              <THRow>
                <th style={{ width: nameWidth, cursor: 'pointer' }} onClick={() => handleSort('name')}>
                  {groupLabel}{sortIcon('name')}
                </th>
                <th className="r" style={{ width: valWidth, cursor: 'pointer' }} onClick={() => handleSort('value')}>
                  {colFact}{sortIcon('value')}
                </th>
                {enableComp1 && (
                  <th className="r" style={{ width: valWidth, cursor: 'pointer' }} onClick={() => handleSort('comp1Value')}>
                    {comp1Header}{sortIcon('comp1Value')}
                  </th>
                )}
                {enableComp1 && showDelta1 && (
                  <th className="r" style={{ width: deltaWidth, cursor: 'pointer' }} onClick={() => handleSort('comp1Delta')}>
                    {delta1Header}{sortIcon('comp1Delta')}
                  </th>
                )}
                {enableComp2 && (
                  <th className="r" style={{ width: valWidth, cursor: 'pointer' }} onClick={() => handleSort('comp2Value')}>
                    {comp2Header}{sortIcon('comp2Value')}
                  </th>
                )}
                {enableComp2 && showDelta2 && (
                  <th className="r" style={{ width: deltaWidth, cursor: 'pointer' }} onClick={() => handleSort('comp2Delta')}>
                    {delta2Header}{sortIcon('comp2Delta')}
                  </th>
                )}
              </THRow>
            </THead>
            <tbody>
              {filteredData.length === 0 ? (
                <EmptyRow>
                  <td colSpan={colCount}>Ничего не найдено</td>
                </EmptyRow>
              ) : (
                pagedData.flatMap(group => {
                  const isExpanded = expandedGroups.has(group.name);
                  return [
                    <GroupRowView
                      key={`g-${group.name}`}
                      group={group}
                      expanded={isExpanded}
                      onToggle={() => toggleGroup(group.name)}
                      enableComp1={enableComp1}
                      enableComp2={enableComp2}
                      showDelta1={showDelta1}
                      showDelta2={showDelta2}
                    />,
                    ...(isExpanded
                      ? group.children.map(child => (
                          <ChildRowView
                            key={`c-${group.name}-${child.name}`}
                            row={child}
                            enableComp1={enableComp1}
                            enableComp2={enableComp2}
                            showDelta1={showDelta1}
                            showDelta2={showDelta2}
                          />
                        ))
                      : []),
                  ];
                })
              )}
            </tbody>
          </DetailTable>
        </TableWrap>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '8px 0', fontSize: 13, color: '#666' }}>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              style={{ cursor: currentPage === 0 ? 'default' : 'pointer', opacity: currentPage === 0 ? 0.4 : 1, background: 'none', border: 'none', fontSize: 13, color: 'inherit' }}
            >
              ← Назад
            </button>
            <span>{currentPage + 1} из {totalPages}</span>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              style={{ cursor: currentPage >= totalPages - 1 ? 'default' : 'pointer', opacity: currentPage >= totalPages - 1 ? 0.4 : 1, background: 'none', border: 'none', fontSize: 13, color: 'inherit' }}
            >
              Далее →
            </button>
          </div>
        )}

        {/* ── Footer ── */}
        <ModalFoot>
          <FooterHint>▶ раскрыть детализацию</FooterHint>
          <ExportButton onClick={handleExport} aria-label="Экспорт данных">
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 2v9M4 7.5 8 11l4-3.5M3 14h10" />
            </svg>
            {' '}Экспорт
          </ExportButton>
        </ModalFoot>
      </Modal>
    </Overlay>
  );
}
