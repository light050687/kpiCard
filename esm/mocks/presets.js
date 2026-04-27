/**
 * Mock data presets for KPI card design mode.
 *
 * Each preset contains realistic numbers for a specific KPI type.
 * Used when building dashboards before real data is available.
 */
export const MOCK_PRESETS = {
    revenue: {
        label: 'Выручка',
        mainA: 12400000000,
        comp1A: 11200000000,
        comp2A: 10800000000,
        mainB: 14.8,
        comp1B: 12.3,
        comp2B: 11.5,
        groupCount: 10,
        childrenPerGroup: 3,
    },
    expenses: {
        label: 'Расходы',
        mainA: 3200000000,
        comp1A: 3400000000,
        comp2A: 3000000000,
        mainB: 25.8,
        comp1B: 28.1,
        comp2B: 24.5,
        groupCount: 10,
        childrenPerGroup: 3,
    },
    margin: {
        label: 'Маржа',
        mainA: 9200000000,
        comp1A: 8100000000,
        comp2A: 8200000000,
        mainB: 74.2,
        comp1B: 72.3,
        comp2B: 75.9,
        groupCount: 10,
        childrenPerGroup: 3,
    },
    losses: {
        label: 'Потери',
        mainA: 264000000,
        comp1A: 280000000,
        comp2A: 240000000,
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
export function parseCustomPreset(json) {
    try {
        const obj = JSON.parse(json);
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
    }
    catch {
        return MOCK_PRESETS.empty;
    }
}
/**
 * Get preset by key, falling back to 'revenue'.
 */
export function getPreset(key, customJson) {
    if (key === 'custom')
        return parseCustomPreset(customJson ?? '{}');
    return MOCK_PRESETS[key ?? 'revenue'] ?? MOCK_PRESETS.revenue;
}
//# sourceMappingURL=presets.js.map