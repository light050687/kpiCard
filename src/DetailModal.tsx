import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import {
  DetailDataRaw,
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
  ModeToggle,
  ModeButton,
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
  enablePlan: boolean,
  enableYoy: boolean,
): void {
  const BOM = '\uFEFF';
  const headers = [groupLabel, childLabel, 'Факт'];
  if (enablePlan) headers.push('План', 'Δ План');
  if (enableYoy) headers.push('ПГ', 'Δ ПГ');

  const rows: string[][] = [];
  for (const group of data) {
    for (const child of group.children) {
      const row = [group.name, child.name, child.value];
      if (enablePlan) row.push(child.planValue ?? '', child.planDelta ?? '');
      if (enableYoy) row.push(child.prevValue ?? '', child.prevDelta ?? '');
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
  enablePlan,
  enableYoy,
}: {
  group: DetailGroup;
  expanded: boolean;
  onToggle: () => void;
  enablePlan: boolean;
  enableYoy: boolean;
}): JSX.Element {
  const { summary } = group;
  return (
    <GroupRow onClick={onToggle}>
      <td>
        <Chevron expanded={expanded} aria-hidden="true">▶</Chevron>
        {group.name}
      </td>
      <td className="r">{summary.value}</td>
      {enablePlan && <td className="r">{summary.planValue ?? ''}</td>}
      {enablePlan && (
        <DeltaCell delta={summary.planDelta} status={summary.planStatus} />
      )}
      {enableYoy && <td className="r">{summary.prevValue ?? ''}</td>}
      {enableYoy && (
        <DeltaCell delta={summary.prevDelta} status={summary.prevStatus} />
      )}
    </GroupRow>
  );
}

function ChildRowView({
  row,
  enablePlan,
  enableYoy,
}: {
  row: DetailRow;
  enablePlan: boolean;
  enableYoy: boolean;
}): JSX.Element {
  return (
    <ChildRow>
      <td>{row.name}</td>
      <td className="r">{row.value}</td>
      {enablePlan && <td className="r">{row.planValue ?? ''}</td>}
      {enablePlan && (
        <DeltaCell delta={row.planDelta} status={row.planStatus} />
      )}
      {enableYoy && <td className="r">{row.prevValue ?? ''}</td>}
      {enableYoy && (
        <DeltaCell delta={row.prevDelta} status={row.prevStatus} />
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
  colorScheme: ComparisonColorScheme;
  formatValue: (n: number) => string;
  formatDelta: (n: number) => string;
  hierarchyLabelPrimary: string;
  hierarchyLabelSecondary: string;
  enablePlan: boolean;
  enableYoy: boolean;
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
  colorScheme,
  formatValue,
  formatDelta,
  hierarchyLabelPrimary,
  hierarchyLabelSecondary,
  enablePlan,
  enableYoy,
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
        colorScheme,
        enablePlan,
        enableYoy,
      }),
    [
      detailDataRaw, isPrimary, aggregationType, topN,
      formatValue, formatDelta, colorScheme, enablePlan, enableYoy,
    ],
  );

  /* ── Search filtering ── */

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return aggregatedData;

    return aggregatedData
      .map(group => {
        if (group.name.toLowerCase().includes(q)) return group;
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
    exportToCsv(filteredData, title, groupLabel, childLabel, enablePlan, enableYoy);
  }, [filteredData, title, groupLabel, childLabel, enablePlan, enableYoy]);

  /* ── Compute column count for table-layout ── */

  const colCount = 2 + (enablePlan ? 2 : 0) + (enableYoy ? 2 : 0);

  // Column widths based on visible columns
  const nameWidth = colCount <= 4 ? '40%' : '30%';
  const valWidth = colCount <= 4 ? '20%' : '14%';
  const deltaWidth = colCount <= 4 ? '15%' : '10%';

  /* ── Render guard ── */

  if (!isOpen && !isClosing) return null;

  // Abbreviated labels for mode toggle buttons
  const primaryShort = hierarchyLabelPrimary.length > 4
    ? hierarchyLabelPrimary.slice(0, 4)
    : hierarchyLabelPrimary;
  const secondaryShort = hierarchyLabelSecondary.length > 3
    ? hierarchyLabelSecondary.slice(0, 3)
    : hierarchyLabelSecondary;

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
              placeholder={`Поиск по ${groupLabel.toLowerCase()}...`}
              aria-label="Поиск"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <ModeToggle>
              <ModeButton
                active={isPrimary}
                onClick={() => setHierarchyMode('primary')}
              >
                {primaryShort}
              </ModeButton>
              <ModeButton
                active={!isPrimary}
                onClick={() => setHierarchyMode('secondary')}
              >
                {secondaryShort}
              </ModeButton>
            </ModeToggle>
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

          <ResultsCount>{groupCount} групп</ResultsCount>
        </ModalToolbar>

        {/* ── Table — dynamic columns ── */}
        <TableWrap>
          <DetailTable>
            <THead>
              <THRow>
                <th style={{ width: nameWidth }}>{groupLabel}</th>
                <th className="r" style={{ width: valWidth }}>Факт</th>
                {enablePlan && (
                  <th className="r" style={{ width: valWidth }}>План</th>
                )}
                {enablePlan && (
                  <th className="r" style={{ width: deltaWidth }}>Δ</th>
                )}
                {enableYoy && (
                  <th className="r" style={{ width: valWidth }}>ПГ</th>
                )}
                {enableYoy && (
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
                      enablePlan={enablePlan}
                      enableYoy={enableYoy}
                    />
                    {isExpanded &&
                      group.children.map(child => (
                        <ChildRowView
                          key={child.name}
                          row={child}
                          enablePlan={enablePlan}
                          enableYoy={enableYoy}
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
