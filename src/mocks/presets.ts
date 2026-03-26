/**
 * Mock data presets for KPI card design mode.
 *
 * Each preset contains realistic numbers for a specific KPI type.
 * Used when building dashboards before real data is available.
 */

export interface MockPresetData {
  /** Display name (Russian) */
  label: string;
  /** Main metric value — Mode A */
  mainA: number;
  /** Comparison 1 (e.g. previous year) — Mode A */
  comp1A: number | null;
  /** Comparison 2 (e.g. plan) — Mode A */
  comp2A: number | null;
  /** Main metric value — Mode B (percentage/ratio) */
  mainB: number;
  /** Comparison 1 — Mode B */
  comp1B: number | null;
  /** Comparison 2 — Mode B */
  comp2B: number | null;
  /** Number of groups for detail modal */
  groupCount: number;
  /** Children per group in detail modal */
  childrenPerGroup: number;
}

export const MOCK_PRESETS: Record<string, MockPresetData> = {
  revenue: {
    label: 'Выручка',
    mainA: 12_400_000_000,
    comp1A: 11_200_000_000,
    comp2A: 10_800_000_000,
    mainB: 14.8,
    comp1B: 12.3,
    comp2B: 11.5,
    groupCount: 10,
    childrenPerGroup: 3,
  },
  expenses: {
    label: 'Расходы',
    mainA: 3_200_000_000,
    comp1A: 3_400_000_000,
    comp2A: 3_000_000_000,
    mainB: 25.8,
    comp1B: 28.1,
    comp2B: 24.5,
    groupCount: 10,
    childrenPerGroup: 3,
  },
  margin: {
    label: 'Маржа',
    mainA: 9_200_000_000,
    comp1A: 8_100_000_000,
    comp2A: 8_200_000_000,
    mainB: 74.2,
    comp1B: 72.3,
    comp2B: 75.9,
    groupCount: 10,
    childrenPerGroup: 3,
  },
  losses: {
    label: 'Потери',
    mainA: 264_000_000,
    comp1A: 280_000_000,
    comp2A: 240_000_000,
    mainB: 2.13,
    comp1B: 2.5,
    comp2B: 2.22,
    groupCount: 10,
    childrenPerGroup: 3,
  },
  conversion: {
    label: 'Конверсия',
    mainA: 5.63,
    comp1A: 5.5,
    comp2A: 4.41,
    mainB: 27.7,
    comp1B: 25.1,
    comp2B: 22.3,
    groupCount: 10,
    childrenPerGroup: 2,
  },
  empty: {
    label: 'Пустой',
    mainA: 0,
    comp1A: 0,
    comp2A: 0,
    mainB: 0,
    comp1B: 0,
    comp2B: 0,
    groupCount: 0,
    childrenPerGroup: 0,
  },
};

/**
 * Parse custom JSON into MockPresetData with safe defaults.
 */
export function parseCustomPreset(json: string): MockPresetData {
  try {
    const obj = JSON.parse(json) as Partial<MockPresetData>;
    return {
      label: obj.label ?? 'Кастом',
      mainA: obj.mainA ?? 0,
      comp1A: obj.comp1A ?? null,
      comp2A: obj.comp2A ?? null,
      mainB: obj.mainB ?? 0,
      comp1B: obj.comp1B ?? null,
      comp2B: obj.comp2B ?? null,
      groupCount: obj.groupCount ?? 20,
      childrenPerGroup: obj.childrenPerGroup ?? 5,
    };
  } catch {
    return MOCK_PRESETS.empty;
  }
}

/**
 * Get preset by key, falling back to 'revenue'.
 */
export function getPreset(key: string | undefined, customJson?: string): MockPresetData {
  if (key === 'custom') return parseCustomPreset(customJson ?? '{}');
  return MOCK_PRESETS[key ?? 'revenue'] ?? MOCK_PRESETS.revenue;
}
