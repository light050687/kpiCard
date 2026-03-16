import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { DetailData, DetailGroup, DetailRow, HierarchyMode } from './types';
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
  hierarchy: HierarchyMode,
): void {
  const BOM = '\uFEFF';
  const groupLabel = hierarchy === 'segment' ? 'Сегмент' : 'Магазин';
  const childLabel = hierarchy === 'segment' ? 'Магазин' : 'Сегмент';
  const headers = [
    groupLabel,
    childLabel,
    'Факт',
    'План',
    'Δ План',
    'ПГ',
    'Δ ПГ',
  ];

  const rows: string[][] = [];
  for (const group of data) {
    for (const child of group.children) {
      rows.push([
        group.name,
        child.name,
        child.value,
        child.planValue ?? '',
        child.planDelta ?? '',
        child.prevValue ?? '',
        child.prevDelta ?? '',
      ]);
    }
  }

  const escape = (cell: string): string =>
    `"${cell.replace(/"/g, '""')}"`;

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

/* ── Search icon SVG — matches mockup: 13×13, viewBox 0 0 16 16 ── */

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

/* ── Table row rendering — 6 columns: Name | Факт | План | Δ | ПГ | Δ ── */

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
}: {
  group: DetailGroup;
  expanded: boolean;
  onToggle: () => void;
}): JSX.Element {
  const { summary } = group;
  return (
    <GroupRow onClick={onToggle}>
      <td>
        <Chevron expanded={expanded} aria-hidden="true">
          ▶
        </Chevron>
        {group.name}
      </td>
      <td className="r">{summary.value}</td>
      <td className="r">{summary.planValue ?? ''}</td>
      <DeltaCell delta={summary.planDelta} status={summary.planStatus} />
      <td className="r">{summary.prevValue ?? ''}</td>
      <DeltaCell delta={summary.prevDelta} status={summary.prevStatus} />
    </GroupRow>
  );
}

function ChildRowView({ row }: { row: DetailRow }): JSX.Element {
  return (
    <ChildRow>
      <td>{row.name}</td>
      <td className="r">{row.value}</td>
      <td className="r">{row.planValue ?? ''}</td>
      <DeltaCell delta={row.planDelta} status={row.planStatus} />
      <td className="r">{row.prevValue ?? ''}</td>
      <DeltaCell delta={row.prevDelta} status={row.prevStatus} />
    </ChildRow>
  );
}

/* ── Main component ── */

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headerValue: string;
  detailData: DetailData;
  isDarkMode: boolean;
}

/*
 * Detail drill-down modal.
 *
 * Renders inside KpiCardRoot (in KpiCard.tsx) so CSS custom properties
 * (--ink, --s, --g*, etc.) and keyframes are inherited — no portal needed.
 * Overlay uses position:fixed → positioned from viewport regardless of
 * DOM nesting. z-index:100 sits above all Superset dashboard content.
 */
export default function DetailModal({
  isOpen,
  onClose,
  title,
  headerValue,
  detailData,
}: DetailModalProps): JSX.Element | null {
  const [isClosing, setIsClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hierarchyMode, setHierarchyMode] =
    useState<HierarchyMode>('segment');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(),
  );

  const modalRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const isSeg = hierarchyMode === 'segment';

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

  /* ── Backdrop click (only direct click, not bubbled) ── */

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

  /* ── Data filtering ── */

  const activeData =
    (isSeg ? detailData?.bySegment : detailData?.byStore) ?? [];

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return activeData;

    return activeData
      .map(group => {
        const groupMatches = group.name.toLowerCase().includes(q);
        if (groupMatches) return group;

        const matchingChildren = group.children.filter(child =>
          child.name.toLowerCase().includes(q),
        );
        if (matchingChildren.length > 0) {
          return { ...group, children: matchingChildren };
        }
        return null;
      })
      .filter((g): g is DetailGroup => g !== null);
  }, [activeData, searchQuery]);

  const groupCount = filteredData.length;

  /* ── Group expand/collapse ── */

  const toggleGroup = useCallback((name: string): void => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  /* ── Hierarchy flip ── */

  const flipHierarchy = useCallback((): void => {
    setHierarchyMode(prev =>
      prev === 'segment' ? 'store' : 'segment',
    );
    setExpandedGroups(new Set());
    setSearchQuery('');
  }, []);

  /* ── Export ── */

  const handleExport = useCallback((): void => {
    exportToCsv(filteredData, title, hierarchyMode);
  }, [filteredData, title, hierarchyMode]);

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
              placeholder={
                isSeg ? 'Поиск по сегменту...' : 'Поиск по магазину...'
              }
              aria-label="Поиск"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <ModeToggle>
              <ModeButton
                active={isSeg}
                onClick={() => setHierarchyMode('segment')}
              >
                Сегм
              </ModeButton>
              <ModeButton
                active={!isSeg}
                onClick={() => setHierarchyMode('store')}
              >
                Маг
              </ModeButton>
            </ModeToggle>
          </SearchBox>

          <FlipButton
            onClick={flipHierarchy}
            aria-label="Сменить иерархию"
          >
            <FlipIcon flipped={!isSeg} aria-hidden="true">
              ⇅
            </FlipIcon>
            <FlipLabel>
              {isSeg ? 'Сегмент\u00A0→\u00A0Магазин' : 'Магазин\u00A0→\u00A0Сегмент'}
            </FlipLabel>
          </FlipButton>

          <ResultsCount>{groupCount} групп</ResultsCount>
        </ModalToolbar>

        {/* ── Table — 6 columns ── */}
        <TableWrap>
          <DetailTable>
            <THead>
              <THRow>
                <th style={{ width: '30%' }}>
                  {isSeg ? 'Сегмент' : 'Магазин'}
                </th>
                <th className="r" style={{ width: '14%' }}>Факт</th>
                <th className="r" style={{ width: '14%' }}>План</th>
                <th className="r" style={{ width: '10%' }}>Δ</th>
                <th className="r" style={{ width: '14%' }}>ПГ</th>
                <th className="r" style={{ width: '10%' }}>Δ</th>
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
                    />
                    {isExpanded &&
                      group.children.map(child => (
                        <ChildRowView
                          key={child.name}
                          row={child}
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
            ↓ Экспорт
          </ExportButton>
        </ModalFoot>
      </Modal>
    </Overlay>
  );
}
