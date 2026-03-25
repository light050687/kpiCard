import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { SupersetClient } from '@superset-ui/core';
import {
  DetailQueryParams,
  DeltaFormat,
  DetailGroup,
  DetailRow,
  HierarchyMode,
  AggregationType,
  ComparisonColorScheme,
} from './types';
import {
  buildGroupsPayload,
  buildChildrenPayload,
  buildCountPayload,
  buildExportPayload,
  formatServerRow,
  resolveSortTarget,
} from './utils/detailApi';
import type { FormatRowOpts } from './utils/detailApi';
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
  PaginationWrap,
  PageBtn,
  PageEllipsis,
  PageInput,
  ModalFoot,
  FooterHint,
  ExportButton,
  RefreshBar,
} from './styles';

const CLOSE_DURATION_MS = 200;

type SearchScope = 'group' | 'child';

/* ── CSV Export ── */

async function exportToCsv(
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fileHandle: any,
): Promise<void> {
  const BOM = '\uFEFF';
  const headers = [groupLabel, childLabel, factHeader];
  if (enableComp1) {
    headers.push(comp1Header);
    headers.push(delta1Header);
  }
  if (enableComp2) {
    headers.push(comp2Header);
    headers.push(delta2Header);
  }

  const rawNum = (v: number | undefined): string =>
    v != null ? String(v) : '';

  const rows: string[][] = [];
  for (const group of data) {
    for (const child of group.children) {
      const row = [group.name, child.name, rawNum(child.rawValue)];
      if (enableComp1) row.push(rawNum(child.rawComp1), rawNum(child.rawComp1Delta));
      if (enableComp2) row.push(rawNum(child.rawComp2), rawNum(child.rawComp2Delta));
      rows.push(row);
    }
  }

  const escape = (cell: string): string => `"${cell.replace(/"/g, '""')}"`;
  const csv =
    BOM +
    [headers, ...rows].map(row => row.map(escape).join(';')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });

  // Write to pre-obtained file handle (from showSaveFilePicker)
  if (fileHandle) {
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }

  // Fallback: auto-download for older browsers
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
  isLoadingChildren,
  onToggle,
  enableComp1,
  enableComp2,
  showDelta1 = true,
  showDelta2 = true,
}: {
  group: DetailGroup;
  expanded: boolean;
  isLoadingChildren: boolean;
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
        {isLoadingChildren ? (
          <span
            style={{
              display: 'inline-block', width: 10, height: 10, marginRight: 6,
              border: '1.5px solid var(--g200, #e5e5e5)',
              borderTopColor: 'var(--c-sky, #3B8BD9)',
              borderRadius: '50%',
              animation: 'kpi-spin 0.7s linear infinite',
            }}
            aria-label="Загрузка"
          />
        ) : (
          <Chevron expanded={expanded} aria-hidden="true">▶</Chevron>
        )}
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
  queryParams: DetailQueryParams;
  activeMode: 'a' | 'b';
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

/* ── Helper: extract API response rows ── */

function extractApiRows(json: Record<string, unknown>): Record<string, unknown>[] {
  const resultArr = json.result as Array<{ data: Record<string, unknown>[] }> | undefined;
  return resultArr?.[0]?.data ?? [];
}

/* ── Main component ── */

function DetailModalInner({
  isOpen,
  onClose,
  title,
  headerValue,
  queryParams,
  activeMode,
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
}: DetailModalProps): JSX.Element {
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

  /* ── Server-side data state ── */

  const [groups, setGroups] = useState<DetailGroup[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [expandedChildren, setExpandedChildren] = useState<Map<string, DetailRow[]>>(new Map());
  const [loadingChildren, setLoadingChildren] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  // Abort controllers
  const groupsAbortRef = useRef<AbortController | null>(null);
  const childrenAbortRef = useRef<Map<string, AbortController>>(new Map());
  const hasEverLoaded = useRef(false);

  /* ── Debounced search ── */

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  /* ── Resolve metric labels for current mode ── */

  const isA = activeMode === 'a';
  const metricLabel = isA ? queryParams.metricALabel : queryParams.metricBLabel;
  const comp1Label_ = isA ? queryParams.comp1LabelA : queryParams.comp1LabelB;
  const comp2Label_ = isA ? queryParams.comp2LabelA : queryParams.comp2LabelB;
  const delta1Label_ = isA ? queryParams.delta1LabelA : queryParams.delta1LabelB;
  const delta2Label_ = isA ? queryParams.delta2LabelA : queryParams.delta2LabelB;

  // Shared formatting options for formatServerRow
  const fmtOpts: FormatRowOpts = {
    aggregationType,
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
  };

  /* ── Resolve groupby columns ── */

  const groupbyCol = isPrimary ? queryParams.groupbyPrimary : queryParams.groupbySecondary;
  const childCol = isPrimary ? queryParams.groupbySecondary : queryParams.groupbyPrimary;

  /* ── fetchGroups: main server-side paginated query ── */

  useEffect(() => {
    if (!isOpen) return;

    // Abort previous request
    groupsAbortRef.current?.abort();
    const controller = new AbortController();
    groupsAbortRef.current = controller;

    // Stale-while-revalidate: spinner only on first ever load
    if (!hasEverLoaded.current) {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setFetchError(null);

    const metrics = isA ? queryParams.metricsA : queryParams.metricsB;

    if (!groupbyCol || metrics.length === 0) {
      setGroups([]);
      setIsInitialLoading(false);
      setIsRefreshing(false);
      return;
    }

    // Resolve sort target for server
    const sortTarget = resolveSortTarget(
      sortColumn, groupbyCol, metricLabel,
      comp1Label_, comp2Label_, delta1Label_, delta2Label_,
    );

    const effectivePageSize = topN > 0 ? Math.min(pageSize, topN) : pageSize;

    const payload = buildGroupsPayload({
      queryParams,
      activeMode,
      groupbyCol,
      childCol,
      page: currentPage,
      pageSize: effectivePageSize,
      sortTarget,
      sortAsc: sortDirection === 'asc',
      searchQuery: debouncedSearch,
      searchScope,
      metricLabel,
    });

    SupersetClient.post({
      endpoint: 'api/v1/chart/data',
      jsonPayload: payload,
      signal: controller.signal,
    })
      .then(({ json }: { json: Record<string, unknown> }) => {
        const rows = extractApiRows(json);

        const hasMore = rows.length > effectivePageSize;
        const displayRows = hasMore ? rows.slice(0, effectivePageSize) : rows;

        const formatted = displayRows.map(row =>
          formatServerRow(row, groupbyCol!, metricLabel, comp1Label_, comp2Label_, delta1Label_, delta2Label_, fmtOpts),
        );

        setGroups(formatted.map(f => ({
          name: f.name,
          summary: f.summary,
          children: [], // children loaded lazily on expand
        })));
        setHasNextPage(hasMore);

        // Reset expanded state on new data (page/sort/search change)
        setExpandedGroups(new Set());
        setExpandedChildren(new Map());
        hasEverLoaded.current = true;
        setIsInitialLoading(false);
        setIsRefreshing(false);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setFetchError('Ошибка загрузки данных');
          setIsInitialLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeMode, currentPage, sortColumn, sortDirection, hierarchyMode, debouncedSearch, searchScope, queryParams.datasourceId]);

  /* ── fetchTotalCount: exact count of non-zero groups ── */

  useEffect(() => {
    if (!isOpen || !groupbyCol) return;

    // Don't reset totalCount — keep old pagination visible (stale-while-revalidate)

    const countPayload = buildCountPayload({
      queryParams,
      activeMode,
      groupbyCol,
      childCol,
      searchQuery: debouncedSearch,
      searchScope,
      metricLabel,
    });

    SupersetClient.post({
      endpoint: 'api/v1/chart/data',
      jsonPayload: countPayload,
    })
      .then(({ json }: { json: Record<string, unknown> }) => {
        const rows = extractApiRows(json);
        setTotalCount(rows.length);
      })
      .catch(() => {
        // Non-critical — UI works without exact count
        setTotalCount(null);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeMode, hierarchyMode, debouncedSearch, searchScope, queryParams.datasourceId]);

  /* ── fetchChildren: load children on group expand ── */

  const fetchChildren = useCallback((groupName: string): void => {
    // Already loaded — just toggle visibility
    if (expandedChildren.has(groupName)) {
      setExpandedGroups(prev => {
        const next = new Set(prev);
        if (next.has(groupName)) next.delete(groupName);
        else next.add(groupName);
        return next;
      });
      return;
    }

    if (!groupbyCol || !childCol) return;

    // Abort previous request for this group
    childrenAbortRef.current.get(groupName)?.abort();
    const controller = new AbortController();
    childrenAbortRef.current.set(groupName, controller);

    setLoadingChildren(prev => new Set(prev).add(groupName));

    const payload = buildChildrenPayload({
      queryParams,
      activeMode,
      parentCol: groupbyCol,
      parentValue: groupName,
      childCol,
      metricLabel,
      searchQuery: debouncedSearch,
      searchScope,
    });

    SupersetClient.post({
      endpoint: 'api/v1/chart/data',
      jsonPayload: payload,
      signal: controller.signal,
    })
      .then(({ json }: { json: Record<string, unknown> }) => {
        const rows = extractApiRows(json);
        const children = rows.map(row =>
          formatServerRow(row, childCol!, metricLabel, comp1Label_, comp2Label_, delta1Label_, delta2Label_, fmtOpts).summary,
        );

        setExpandedChildren(prev => {
          const next = new Map(prev);
          next.set(groupName, children);
          return next;
        });
        setExpandedGroups(prev => {
          const next = new Set(prev);
          next.add(groupName);
          return next;
        });
        setLoadingChildren(prev => {
          const next = new Set(prev);
          next.delete(groupName);
          return next;
        });
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setLoadingChildren(prev => {
            const next = new Set(prev);
            next.delete(groupName);
            return next;
          });
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedChildren, groupbyCol, childCol, queryParams.datasourceId, activeMode, metricLabel]);

  /* ── Sorting ── */

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
      setExpandedChildren(new Map());
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

  /* ── Hierarchy flip ── */

  const flipHierarchy = useCallback((): void => {
    setHierarchyMode(prev => (prev === 'primary' ? 'secondary' : 'primary'));
    setCurrentPage(0); // page 0 needed — different groupby
    // expanded/children reset in fetchGroups .then()
    // searchQuery preserved — user decides
  }, []);

  /* ── Export (server-side fetch with both GROUP BY columns) ── */

  const handleExport = useCallback(async (): Promise<void> => {
    if (!groupbyCol || !childCol) return;

    // Step 1: Show "Save As" dialog IMMEDIATELY (requires user gesture)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fileHandle: any = null;
    if ('showSaveFilePicker' in window) {
      try {
        // @ts-expect-error showSaveFilePicker not in all TS lib types
        fileHandle = await window.showSaveFilePicker({
          suggestedName: `${title}-detail.csv`,
          types: [{ description: 'CSV', accept: { 'text/csv': ['.csv'] } }],
        });
      } catch {
        return; // user cancelled dialog
      }
    }

    // Step 2: Fetch data from server
    setIsExporting(true);
    try {
      const payload = buildExportPayload(
        queryParams, activeMode, groupbyCol, childCol,
        metricLabel, debouncedSearch, searchScope,
      );

      const { json } = await SupersetClient.post({
        endpoint: 'api/v1/chart/data',
        jsonPayload: payload,
      }) as { json: Record<string, unknown> };

      const rows = extractApiRows(json);

      // Group rows by parent column for CSV structure
      const groupedMap = new Map<string, DetailRow[]>();
      for (const row of rows) {
        const parentName = String(row[groupbyCol!] ?? 'N/A');
        const childFormatted = formatServerRow(
          row, childCol!, metricLabel,
          comp1Label_, comp2Label_, delta1Label_, delta2Label_, fmtOpts,
        );
        const existing = groupedMap.get(parentName);
        if (existing) {
          existing.push(childFormatted.summary);
        } else {
          groupedMap.set(parentName, [childFormatted.summary]);
        }
      }

      // Build DetailGroup[] for CSV export
      const exportGroups: DetailGroup[] = [];
      for (const [name, children] of groupedMap) {
        const parentRow = formatServerRow(
          { [groupbyCol!]: name } as Record<string, unknown>,
          groupbyCol!, metricLabel,
          comp1Label_, comp2Label_, delta1Label_, delta2Label_, fmtOpts,
        );
        exportGroups.push({ name, summary: parentRow.summary, children });
      }

      // Step 3: Write CSV to file handle (or fallback download)
      await exportToCsv(exportGroups, title, groupLabel, childLabel, enableComp1, enableComp2, comp1Header, comp2Header, colFact, delta1Header, delta2Header, fileHandle);
    } finally {
      setIsExporting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupbyCol, childCol, queryParams.datasourceId, activeMode, metricLabel, debouncedSearch, searchScope, title, groupLabel, childLabel]);

  /* ── Cleanup abort controllers on close ── */

  useEffect(() => {
    if (!isOpen) {
      groupsAbortRef.current?.abort();
      childrenAbortRef.current.forEach(c => c.abort());
      childrenAbortRef.current.clear();
      hasEverLoaded.current = false;
    }
  }, [isOpen]);

  /* ── Compute column count for table-layout ── */

  const colCount = 2 + (enableComp1 ? 2 : 0) + (enableComp2 ? 2 : 0);

  // Column widths based on visible columns
  const nameWidth = colCount <= 4 ? '40%' : '30%';
  const valWidth = colCount <= 4 ? '20%' : '14%';
  const deltaWidth = colCount <= 4 ? '15%' : '10%';

  /* ── Render guard ── */

  const isHidden = !isOpen && !isClosing;

  return (
    <Overlay closing={isClosing} onClick={handleOverlayClick} style={isHidden ? { visibility: 'hidden', pointerEvents: 'none', opacity: 0 } : undefined}>
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
                onClick={() => setSearchScope('group')}
                aria-label={`Поиск по ${groupLabel}`}
              >
                {groupLabel}
              </SearchScopeButton>
              <SearchScopeButton
                active={searchScope === 'child'}
                onClick={() => setSearchScope('child')}
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

          <ResultsCount>{groupLabel}: {totalCount != null ? totalCount : `${groups.length}${hasNextPage ? '+' : ''}`}</ResultsCount>
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
            {isRefreshing && <RefreshBar />}
            <tbody style={{
              opacity: isRefreshing ? 0.45 : 1,
              transition: 'opacity 0.15s ease',
              pointerEvents: isRefreshing ? 'none' : 'auto',
            }}>
              {isInitialLoading ? (
                <EmptyRow>
                  <td colSpan={colCount}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span style={{
                        display: 'inline-block', width: 16, height: 16,
                        border: '2px solid var(--g200, #e5e5e5)',
                        borderTopColor: 'var(--c-sky, #3B8BD9)',
                        borderRadius: '50%',
                        animation: 'kpi-spin 0.7s linear infinite',
                      }} />
                      Загрузка…
                    </div>
                    <style>{`@keyframes kpi-spin{to{transform:rotate(360deg)}}`}</style>
                  </td>
                </EmptyRow>
              ) : fetchError ? (
                <EmptyRow>
                  <td colSpan={colCount}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--dn, #DC2626)' }}>
                      <span>{fetchError}</span>
                      <button
                        type="button"
                        onClick={() => { setFetchError(null); setCurrentPage(p => p); }}
                        style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--g300)', background: 'var(--s)', cursor: 'pointer', fontSize: 12 }}
                      >
                        Повторить
                      </button>
                    </div>
                  </td>
                </EmptyRow>
              ) : groups.length === 0 ? (
                <EmptyRow>
                  <td colSpan={colCount}>
                    {debouncedSearch ? 'Ничего не найдено' : 'Нет данных'}
                  </td>
                </EmptyRow>
              ) : (
                groups.flatMap(group => {
                  const isExpanded = expandedGroups.has(group.name);
                  const children = expandedChildren.get(group.name) ?? [];
                  const isChildLoading = loadingChildren.has(group.name);
                  return [
                    <GroupRowView
                      key={`g-${group.name}`}
                      group={group}
                      expanded={isExpanded}
                      isLoadingChildren={isChildLoading}
                      onToggle={() => fetchChildren(group.name)}
                      enableComp1={enableComp1}
                      enableComp2={enableComp2}
                      showDelta1={showDelta1}
                      showDelta2={showDelta2}
                    />,
                    ...(isExpanded
                      ? children.map(child => (
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

        {/* Numbered pagination */}
        {(() => {
          const effectivePageSize = topN > 0 ? Math.min(pageSize, topN) : pageSize;
          const totalPages = totalCount != null ? Math.ceil(totalCount / effectivePageSize) : null;
          if (totalPages == null || totalPages <= 1) return null;

          const getPageNumbers = (current0: number, total: number): (number | '...')[] => {
            if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
            const pages = new Set<number>();
            pages.add(1);
            pages.add(total); pages.add(total - 1); pages.add(total - 2);
            const cur1 = current0 + 1;
            pages.add(cur1);
            if (cur1 > 1) pages.add(cur1 - 1);
            if (cur1 < total) pages.add(cur1 + 1);
            const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
            const result: (number | '...')[] = [];
            for (let i = 0; i < sorted.length; i++) {
              if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
              result.push(sorted[i]);
            }
            return result;
          };

          return (
            <PaginationWrap style={{
              opacity: isRefreshing ? 0.5 : 1,
              pointerEvents: isRefreshing ? 'none' : 'auto',
              transition: 'opacity 0.15s ease',
            }}>
              {getPageNumbers(currentPage, totalPages).map((item, idx) =>
                item === '...'
                  ? <PageEllipsis key={`e${idx}`}>…</PageEllipsis>
                  : <PageBtn
                      key={item}
                      type="button"
                      isActive={item === currentPage + 1}
                      aria-label={`Страница ${item}`}
                      aria-current={item === currentPage + 1 ? 'page' : undefined}
                      onClick={() => setCurrentPage((item as number) - 1)}
                      disabled={isRefreshing}
                    >
                      {item}
                    </PageBtn>
              )}
              {totalPages > 7 && (
                <PageInput
                  type="number"
                  min={1}
                  max={totalPages}
                  placeholder="№"
                  aria-label="Перейти на страницу"
                  disabled={isRefreshing}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      const val = parseInt((e.target as HTMLInputElement).value, 10);
                      if (val >= 1 && val <= totalPages) {
                        setCurrentPage(val - 1);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              )}
            </PaginationWrap>
          );
        })()}

        {/* ── Footer ── */}
        <ModalFoot>
          <FooterHint>
            ▶ раскрыть детализацию&ensp;·&ensp;<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{verticalAlign: 'middle'}}><path d="M2 2h8.5L13 4.5V14H2V2z" /><path d="M4 2v4h6V2" /><path d="M9 3v2" /><path d="M4 9h6v5H4z" /></svg> экспорт
          </FooterHint>
          <ExportButton
            onClick={handleExport}
            aria-label="Экспорт данных в CSV"
            title="Сохранить как CSV"
            disabled={isExporting}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 2h8.5L13 4.5V14H2V2z" />
              <path d="M4 2v4h6V2" />
              <path d="M9 3v2" />
              <path d="M4 9h6v5H4z" />
            </svg>
          </ExportButton>
        </ModalFoot>
      </Modal>
    </Overlay>
  );
}

// React.memo: block ALL re-renders when modal is closed (toggle perf).
// When opening: isOpen changes false→true → allows re-render with fresh props.
function areDetailPropsEqual(prev: DetailModalProps, next: DetailModalProps): boolean {
  // If modal stays closed → block everything (toggle A/B won't trigger heavy re-render)
  if (!prev.isOpen && !next.isOpen) return true;
  // If modal is opening or closing → allow re-render
  if (prev.isOpen !== next.isOpen) return false;
  // Modal is open → skip only function props
  const keys = Object.keys(next) as (keyof DetailModalProps)[];
  for (const key of keys) {
    if (typeof next[key] === 'function') continue;
    if (prev[key] !== next[key]) return false;
  }
  return true;
}

export default React.memo(
  DetailModalInner,
  areDetailPropsEqual,
) as unknown as React.ComponentType<DetailModalProps>;
