import { D3_FORMAT_OPTIONS, sections, sharedControls, } from '@superset-ui/chart-controls';
import { t } from '@superset-ui/core';
// ── Custom format options (Russian smart + standard D3) ──
const NUMBER_FORMAT_OPTIONS = [
    ['RU_SMART', t('Russian smart (тыс, млн, млрд)')],
    ...D3_FORMAT_OPTIONS,
];
const COLOR_SCHEME_CHOICES = [
    ['green_up', t('Increase is Good (revenue)')],
    ['green_down', t('Decrease is Good (expenses)')],
];
const DELTA_FORMAT_CHOICES = [
    ['auto', t('Auto (percentage)')],
    ['percent', t('Percentage (%)')],
    ['pp', t('Percentage Points (п.п.)')],
    ['absolute', t('Absolute Value (₽, units)')],
];
const isDual = ({ controls }) => controls?.mode_count?.value === 'dual';
const isComp1Enabled = ({ controls }) => controls?.enable_comp1?.value === true;
const isComp2Enabled = ({ controls }) => controls?.enable_comp2?.value === true;
// ═══════════════════════════════════════
// Control Panel Configuration
// ═══════════════════════════════════════
const config = {
    controlPanelSections: [
        // ── Section 1: Time ──
        sections.legacyTimeseriesTime,
        // ── Section 2: Query — Mode A ──
        {
            label: t('Query — Mode A'),
            expanded: true,
            controlSetRows: [
                [
                    {
                        name: 'metric_a',
                        config: {
                            ...sharedControls.metric,
                            label: t('Primary Metric'),
                            description: t('Main KPI value displayed as the hero number'),
                        },
                    },
                ],
                [
                    {
                        name: 'metric_plan_a',
                        config: {
                            ...sharedControls.metric,
                            label: t('Comparison 1 Metric'),
                            description: t('First comparison metric (e.g., plan, target, budget)'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_comp2_a',
                        config: {
                            ...sharedControls.metric,
                            label: t('Comparison 2 Metric'),
                            description: t('Second comparison metric (e.g., previous year, average)'),
                            validators: [],
                        },
                    },
                ],
            ],
        },
        // ── Section 3: Query — Mode B (only in dual mode) ──
        {
            label: t('Query — Mode B'),
            expanded: true,
            controlSetRows: [
                [
                    {
                        name: 'metric_b',
                        config: {
                            ...sharedControls.metric,
                            label: t('Primary Metric'),
                            description: t('Main KPI value for Mode B'),
                            validators: [],
                            visibility: isDual,
                        },
                    },
                ],
                [
                    {
                        name: 'metric_plan_b',
                        config: {
                            ...sharedControls.metric,
                            label: t('Comparison 1 Metric'),
                            description: t('First comparison metric for Mode B'),
                            validators: [],
                            visibility: isDual,
                        },
                    },
                ],
                [
                    {
                        name: 'metric_comp2_b',
                        config: {
                            ...sharedControls.metric,
                            label: t('Comparison 2 Metric'),
                            description: t('Second comparison metric for Mode B'),
                            validators: [],
                            visibility: isDual,
                        },
                    },
                ],
            ],
        },
        // ── Section 4: Card Display ──
        {
            label: t('Card Display'),
            expanded: true,
            controlSetRows: [
                [
                    {
                        name: 'header_text',
                        config: {
                            type: 'TextControl',
                            label: t('Card Title'),
                            description: t('Defaults to metric name if empty'),
                            default: '',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'mode_count',
                        config: {
                            type: 'SelectControl',
                            label: t('Display Modes'),
                            description: t('Single = one view, no toggle. Dual = two views with toggle buttons.'),
                            default: 'dual',
                            choices: [
                                ['single', t('Single Mode')],
                                ['dual', t('Dual Mode (A / B toggle)')],
                            ],
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'auto_format_russian',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Russian Number Format'),
                            description: t('Auto-format with тыс/млн/млрд, space separator, comma decimal'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        // ── Section 5: Mode A Settings ──
        {
            label: t('Mode A Settings'),
            expanded: true,
            controlSetRows: [
                [
                    {
                        name: 'toggle_label_a',
                        config: {
                            type: 'TextControl',
                            label: t('Toggle Button Label'),
                            default: '₽',
                            renderTrigger: true,
                            visibility: isDual,
                        },
                    },
                ],
                [
                    {
                        name: 'subtitle_a',
                        config: {
                            type: 'TextControl',
                            label: t('Subtitle'),
                            default: '₽ за период',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'number_format_a',
                        config: {
                            type: 'SelectControl',
                            label: t('Number Format'),
                            default: 'RU_SMART',
                            choices: NUMBER_FORMAT_OPTIONS,
                            freeForm: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'delta_format_1a',
                        config: {
                            type: 'SelectControl',
                            label: t('Delta Format — Comp 1'),
                            default: 'auto',
                            choices: DELTA_FORMAT_CHOICES,
                            freeForm: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'delta_format_2a',
                        config: {
                            type: 'SelectControl',
                            label: t('Delta Format — Comp 2'),
                            default: 'auto',
                            choices: DELTA_FORMAT_CHOICES,
                            freeForm: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'color_scheme_1a',
                        config: {
                            type: 'SelectControl',
                            label: t('Color Logic — Comp 1'),
                            default: 'green_up',
                            choices: COLOR_SCHEME_CHOICES,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'color_scheme_2a',
                        config: {
                            type: 'SelectControl',
                            label: t('Color Logic — Comp 2'),
                            default: 'green_up',
                            choices: COLOR_SCHEME_CHOICES,
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        // ── Section 6: Mode B Settings (visible only in dual mode) ──
        {
            label: t('Mode B Settings'),
            expanded: true,
            controlSetRows: [
                [
                    {
                        name: 'toggle_label_b',
                        config: {
                            type: 'TextControl',
                            label: t('Toggle Button Label'),
                            default: '%',
                            renderTrigger: true,
                            visibility: isDual,
                        },
                    },
                ],
                [
                    {
                        name: 'subtitle_b',
                        config: {
                            type: 'TextControl',
                            label: t('Subtitle'),
                            default: '',
                            renderTrigger: true,
                            visibility: isDual,
                        },
                    },
                ],
                [
                    {
                        name: 'number_format_b',
                        config: {
                            type: 'SelectControl',
                            label: t('Number Format'),
                            default: 'RU_SMART',
                            choices: NUMBER_FORMAT_OPTIONS,
                            freeForm: true,
                            renderTrigger: true,
                            visibility: isDual,
                        },
                    },
                ],
                [
                    {
                        name: 'delta_format_1b',
                        config: {
                            type: 'SelectControl',
                            label: t('Delta Format — Comp 1'),
                            default: 'auto',
                            choices: DELTA_FORMAT_CHOICES,
                            freeForm: true,
                            renderTrigger: true,
                            visibility: isDual,
                        },
                    },
                ],
                [
                    {
                        name: 'delta_format_2b',
                        config: {
                            type: 'SelectControl',
                            label: t('Delta Format — Comp 2'),
                            default: 'auto',
                            choices: DELTA_FORMAT_CHOICES,
                            freeForm: true,
                            renderTrigger: true,
                            visibility: isDual,
                        },
                    },
                ],
                [
                    {
                        name: 'color_scheme_1b',
                        config: {
                            type: 'SelectControl',
                            label: t('Color Logic — Comp 1'),
                            default: 'green_up',
                            choices: COLOR_SCHEME_CHOICES,
                            renderTrigger: true,
                            visibility: isDual,
                        },
                    },
                ],
                [
                    {
                        name: 'color_scheme_2b',
                        config: {
                            type: 'SelectControl',
                            label: t('Color Logic — Comp 2'),
                            default: 'green_up',
                            choices: COLOR_SCHEME_CHOICES,
                            renderTrigger: true,
                            visibility: isDual,
                        },
                    },
                ],
            ],
        },
        // ── Section 7: Comparisons ──
        {
            label: t('Comparisons'),
            expanded: true,
            controlSetRows: [
                [
                    {
                        name: 'enable_comp1',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Show Comparison 1'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'comp1_label',
                        config: {
                            type: 'TextControl',
                            label: t('Comparison 1 Label'),
                            default: 'План:',
                            renderTrigger: true,
                            visibility: isComp1Enabled,
                        },
                    },
                ],
                [
                    {
                        name: 'enable_comp2',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Show Comparison 2'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'comp2_label',
                        config: {
                            type: 'TextControl',
                            label: t('Comparison 2 Label'),
                            default: 'ПГ:',
                            renderTrigger: true,
                            visibility: isComp2Enabled,
                        },
                    },
                ],
            ],
        },
        // ── Section 8: Detail / Drill-Down ──
        {
            label: t('Detail / Drill-Down'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'groupby_primary',
                        config: {
                            ...sharedControls.groupby,
                            label: t('Primary Group'),
                            description: t('Column for primary hierarchy level'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'groupby_secondary',
                        config: {
                            ...sharedControls.groupby,
                            label: t('Secondary Group'),
                            description: t('Column for secondary hierarchy level'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'hierarchy_label_primary',
                        config: {
                            type: 'TextControl',
                            label: t('Primary Label'),
                            default: 'Сегмент',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'hierarchy_label_secondary',
                        config: {
                            type: 'TextControl',
                            label: t('Secondary Label'),
                            default: 'Магазин',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'detail_top_n',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: t('Top N Groups'),
                            description: t('Limit to top N groups. 0 = show all.'),
                            default: 0,
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
    ],
};
export default config;
//# sourceMappingURL=controlPanel.js.map