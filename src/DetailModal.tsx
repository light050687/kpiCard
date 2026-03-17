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
  ModalFoot,
  FooterHint,
  ExportButton,
} from './styles';

/* ── Constants ── */

const CLOSE_DURATION_MS = 300;

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
): void {
  const BOM = '\uFEFF';
  const headers = [groupLabel, childLabel, 'Факт'];
  if (enableComp1) headers.push(comp1Header, `Δ ${comp1Header}`);
  if (enableComp2) headers.push(comp2Header, `Δ ${comp2Header}`);

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
}: {
  group: DetailGroup;
  expanded: boolean;
  onToggle: () => void;
  enableComp1: boolean;
  enableComp2: boolean;
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
      {enableComp1 && (
        <DeltaCell delta={summary.comp1Delta} status={summary.comp1Status} />
      )}
      {enableComp2 && <td className="r">{summary.comp2Value ?? ''}</td>}
      {enableComp2 && (
        <DeltaCell delta={summary.comp2Delta} status={summary.comp2Status} />
      )}
    </GroupRow>
  );
}

function ChildRowView({
  row,
  enableComp1,
  enableComp2,
}: {
  row: DetailRow;
  enableComp1: boolean;
  enableComp2: boolean;
}): JSX.Element {
  return (
    <ChildRow>
      <td>{row.name}</td>
      <td className="r">{row.value}</td>
      {enableComp1 && <td className="r">{row.comp1Value ?? ''}</td>}
      {enableComp1 && (
        <DeltaCell delta={row.comp1Delta} status={row.comp1Status} />
      )}
      {enableComp2 && <td className="r">{row.comp2Value ?? ''}</td>}
      {enableComp2 && (
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
  topN: number;
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
  topN,
}: DetailModalProps): JSX.Element | null {
  const [isClosing, setIsClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hierarchyMode, setHierarchyMode] =
    useState<HierarchyMode>('primary');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(),
  );

  const modalRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const isPrimary = hierarchyMode === 'primary';

  // Current hierarchy labels
  const groupLabel = isPrimary ? hierarchyLabelPrimary : hierarchyLabelSecondary;
  const childLabel = isPrimary ? hierarchyLabelSecondary : hierarchyLabelPrimary;

  // Comparison header labels (strip trailing colon for table/CSV)
  const comp1Header = comp1Label.replace(/:?\s*$/, '');
  const comp2Header = comp2Label.replace(/:?\s*$/, '');

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
      }),
    [
      detailDataRaw, isPrimary, aggregationType, topN,
      formatValue, formatDelta, colorScheme1, colorScheme2,
      enableComp1, enableComp2, deltaFormat1, deltaFormat2,
    ],
  );

  /* ── Search filtering (searches both groups and children) ── */

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return aggregatedData;

    return aggregatedData
      .map(group => {
        // If group name matches, show it with all children
        if (group.name.toLowerCase().includes(q)) return group;

        // Otherwise, filter children by match
        const matchingChildren = group.children.filter(child =>
          child.name.toLowerCase().includes(q),
        );
        if (matchingChildren.length > 0) {
          return { ...group, children: matchingChildren };
        }
        return null;
      })
      .filter((g): g is DetailGroup => g !== null);
  }, [aggregatedData, searchQuery]);

  const groupCount = filteredData.length;

  /* ── Close with exit animation ── */

  const handleClose = useCallback((): void => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setSearchQuery('');
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
    exportToCsv(filteredData, title, groupLabel, childLabel, enableComp1, enableComp2, comp1Header, comp2Header);
  }, [filteredData, title, groupLabel, childLabel, enableComp1, enableComp2, comp1Header, comp2Header]);

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
                <th style={{ width: nameWidth }}>{groupLabel}</th>
                <th className="r" style={{ width: valWidth }}>Факт</th>
                {enableComp1 && (
                  <th className="r" style={{ width: valWidth }}>{comp1Header}</th>
                )}
                {enableComp1 && (
                  <th className="r" style={{ width: deltaWidth }}>Δ</th>
                )}
                {enableComp2 && (
                  <th className="r" style={{ width: valWidth }}>{comp2Header}</th>
                )}
                {enableComp2 && (
                  <th className="r" style={{ width: deltaWidth }}>Δ</th>
                )}
              </THRow>
            </THead>
            <tbody>
              {filteredData.map(group => {
                const isExpanded = expandedGroups.has(group.name);
                return (
                  <React.Fragment key={group.name}>
                    <GroupRowView
                      group={group}
                      expanded={isExpanded}
                      onToggle={() => toggleGroup(group.name)}
                      enableComp1={enableComp1}
                      enableComp2={enableComp2}
                    />
                    {isExpanded &&
                      group.children.map(child => (
                        <ChildRowView
                          key={child.name}
                          row={child}
                          enableComp1={enableComp1}
                          enableComp2={enableComp2}
                        />
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </DetailTable>
        </TableWrap>

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
