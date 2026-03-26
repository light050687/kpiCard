/**
 * Mock data generator for DetailModal.
 *
 * Generates realistic-looking aggregated groups and children
 * with Pareto-like distribution (top groups get most of the value).
 * Supports pagination, sorting, and search — all client-side.
 */

import type { MockPresetData } from './presets';

interface MockGroupRow {
  name: string;
  mainValue: number;
  comp1Value: number | null;
  comp2Value: number | null;
}

interface GenerateMockGroupsParams {
  preset: MockPresetData;
  groupbyCol: string;
  childCol?: string;
  page: number;
  pageSize: number;
  sortAsc: boolean;
  searchQuery: string;
  exactMatch: boolean;
  isModeBActive: boolean;
}

interface MockGroupsResult {
  rows: Record<string, unknown>[];
  totalCount: number;
}

/**
 * Seeded pseudo-random number generator (deterministic, no Math.random).
 * Ensures same preset always produces same groups.
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

/**
 * Distribute total value among N groups using Pareto-like distribution.
 * Top groups get proportionally more.
 */
function paretoDistribute(total: number, count: number, seed: number): number[] {
  if (count === 0) return [];
  const rng = seededRandom(seed);
  const weights: number[] = [];
  for (let i = 0; i < count; i++) {
    // Power law: first groups get more weight
    weights.push(Math.pow(1 / (i + 1), 0.8) * (0.7 + 0.6 * rng()));
  }
  const sumW = weights.reduce((a, b) => a + b, 0);
  return weights.map(w => Math.round((w / sumW) * total));
}

/**
 * Generate group names based on column type.
 */
function generateGroupNames(col: string | undefined, count: number, seed: number): string[] {
  const rng = seededRandom(seed + 42);
  const names: string[] = [];
  const lower = (col ?? 'group').toLowerCase();

  if (lower.includes('centrum') || lower.includes('store') || lower.includes('магазин')) {
    // Store codes like real data
    for (let i = 0; i < count; i++) {
      names.push(String(Math.floor(rng() * 9000) + 100));
    }
  } else if (lower.includes('segment') || lower.includes('category') || lower.includes('сегмент')) {
    for (let i = 0; i < count; i++) {
      names.push(String(Math.floor(rng() * 900000) + 100000));
    }
  } else {
    for (let i = 0; i < count; i++) {
      names.push(`${col ?? 'group'}_${i + 1}`);
    }
  }

  // Ensure unique names
  return [...new Set(names)].slice(0, count);
}

/**
 * Generate mock aggregated groups for DetailModal.
 *
 * Returns data in the same shape as Superset API response rows.
 */
export function generateMockGroups(params: GenerateMockGroupsParams): MockGroupsResult {
  const { preset, groupbyCol, page, pageSize, sortAsc, searchQuery, exactMatch, isModeBActive } = params;

  if (preset.groupCount === 0) {
    return { rows: [], totalCount: 0 };
  }

  const mainTotal = isModeBActive ? preset.mainB : preset.mainA;
  const comp1Total = isModeBActive ? preset.comp1B : preset.comp1A;
  const comp2Total = isModeBActive ? preset.comp2B : preset.comp2A;

  const count = preset.groupCount;
  const names = generateGroupNames(groupbyCol, count, 12345);
  const mainValues = paretoDistribute(mainTotal, count, 67890);
  const comp1Values = comp1Total != null ? paretoDistribute(comp1Total, count, 11111) : null;
  const comp2Values = comp2Total != null ? paretoDistribute(comp2Total, count, 22222) : null;

  // Build all groups
  let groups: MockGroupRow[] = names.map((name, i) => ({
    name,
    mainValue: mainValues[i],
    comp1Value: comp1Values ? comp1Values[i] : null,
    comp2Value: comp2Values ? comp2Values[i] : null,
  }));

  // Filter by search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    groups = groups.filter(g => {
      if (exactMatch) return g.name.toLowerCase() === q;
      return g.name.toLowerCase().includes(q);
    });
  }

  // Sort
  groups.sort((a, b) => {
    const diff = b.mainValue - a.mainValue; // desc by default
    return sortAsc ? -diff : diff;
  });

  const totalCount = groups.length;

  // Paginate
  const start = page * pageSize;
  const pageRows = groups.slice(start, start + pageSize);

  // Convert to API-like format
  const rows = pageRows.map(g => {
    const row: Record<string, unknown> = { [groupbyCol]: g.name };
    // Use generic metric keys — transformProps will map them
    row.__mock_main = g.mainValue;
    row.__mock_comp1 = g.comp1Value;
    row.__mock_comp2 = g.comp2Value;
    return row;
  });

  return { rows, totalCount };
}

/**
 * Generate mock children for a specific group.
 */
export function generateMockChildren(params: {
  preset: MockPresetData;
  groupName: string;
  childCol: string;
  parentMainValue: number;
  isModeBActive: boolean;
}): Record<string, unknown>[] {
  const { preset, groupName, childCol, parentMainValue, isModeBActive } = params;

  if (preset.childrenPerGroup === 0) return [];

  // Use group name as seed for deterministic children
  const seed = groupName.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const count = preset.childrenPerGroup;

  const names = generateGroupNames(childCol, count, seed);
  const values = paretoDistribute(parentMainValue, count, seed + 999);

  const comp1Ratio = isModeBActive
    ? (preset.comp1B != null && preset.mainB ? preset.comp1B / preset.mainB : 1)
    : (preset.comp1A != null && preset.mainA ? preset.comp1A / preset.mainA : 1);

  const comp2Ratio = isModeBActive
    ? (preset.comp2B != null && preset.mainB ? preset.comp2B / preset.mainB : 1)
    : (preset.comp2A != null && preset.mainA ? preset.comp2A / preset.mainA : 1);

  return names.map((name, i) => {
    const row: Record<string, unknown> = { [childCol]: name };
    row.__mock_main = values[i];
    row.__mock_comp1 = Math.round(values[i] * comp1Ratio);
    row.__mock_comp2 = Math.round(values[i] * comp2Ratio);
    return row;
  });
}
