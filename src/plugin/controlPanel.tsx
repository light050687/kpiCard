import {
  ControlPanelConfig,
  D3_FORMAT_OPTIONS,
  sections,
  sharedControls,
} from '@superset-ui/chart-controls';
import { t } from '@superset-ui/core';

// ── Custom format options (Russian smart + standard D3) ──
const NUMBER_FORMAT_OPTIONS: [string, string][] = [
  ['RU_SMART', t('Russian smart (тыс, млн, млрд)')],
  ...D3_FORMAT_OPTIONS,
];

const AGGREGATION_CHOICES: [string, string][] = [
  ['SUM', t('Sum')],
  ['AVERAGE', t('Average')],
  ['PERCENT', t('Percent (weighted avg, delta in п.п.)')],
  ['MAX', t('Maximum')],
  ['MIN', t('Minimum')],
];

const TIME_COMPARISON_CHOICES: [string, string][] = [
  ['none', t('None')],
  ['1 year ago', t('Previous Year (YoY)')],
  ['1 month ago', t('Previous Month (MoM)')],
  ['1 week ago', t('Previous Week (WoW)')],
  ['28 days ago', t('28 Days Ago')],
  ['52 weeks ago', t('52 Weeks Ago')],
];

const COLOR_SCHEME_CHOICES: [string, string][] = [
  ['green_up', t('Increase is Good (revenue)')],
  ['green_down', t('Decrease is Good (expenses)')],
];

const DELTA_FORMAT_CHOICES: [string, string][] = [
  ['auto', t('Auto (based on aggregation)')],
  ['percent', t('Percentage (%)')],
  ['pp', t('Percentage Points (п.п.)')],
  ['absolute', t('Absolute Value (₽, units)')],
];

// ── Visibility helpers ──
type ControlsMap = { controls: Record<string, { value?: unknown }> };

const isDual = ({ controls }: ControlsMap): boolean =>
  controls?.mode_count?.value === 'dual';

const isComp1Enabled = ({ controls }: ControlsMap): boolean =>
  controls?.enable_comp1?.value === true;

const isComp2Enabled = ({ controls }: ControlsMap): boolean =>
  controls?.enable_comp2?.value === true;

// ═══════════════════════════════════════
// Control Panel Configuration
// ═══════════════════════════════════════

const config: ControlPanelConfig = {
  controlPanelSections: [
    // ── Section 1: Query ──
    sections.legacyTimeseriesTime,
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'metric',
            config: {
              ...sharedControls.metric,
              label: t('Primary Metric'),
              description: t('Main KPI value displayed as the hero number'),
            },
          },
        ],
        [
          {
            name: 'metric_plan',
            config: {
              ...sharedControls.metric,
              label: t('Plan / Target Metric'),
              description: t(
                'Optional plan or target metric for comparison. Leave empty to hide plan.',
              ),
              validators: [],
            },
          },
        ],
        [
          {
            name: 'time_comparison',
            config: {
              type: 'SelectControl',
              label: t('Time Comparison'),
              description: t('Compare against a previous time period'),
              default: '1 year ago',
              choices: TIME_COMPARISON_CHOICES,
              renderTrigger: false,
            },
          },
        ],
      ],
    },

    // ── Section 2: Card Display ──
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
              description: t(
                'Single = one view, no toggle. Dual = two views with toggle buttons.',
              ),
              default: 'dual',
              choices: [
                ['single', t('Single Mode')],
                ['dual', t('Dual Mode (A / B toggle)')],
              ] as [string, string][],
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
              description: t(
                'Auto-format with тыс/млн/млрд, space separator, comma decimal',
              ),
              default: true,
              renderTrigger: true,
            },
          },
        ],
      ],
    },

    // ── Section 3: Mode A ──
    {
      label: t('Mode A'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'toggle_label_a',
            config: {
              type: 'TextControl',
              label: t('Toggle Button Label'),
              description: t('Short label on the toggle button (e.g., "₽")'),
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
              description: t('Text below the hero value (e.g., "₽ за период")'),
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
              description: t('How to format the hero value'),
              default: 'RU_SMART',
              choices: NUMBER_FORMAT_OPTIONS,
              freeForm: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'aggregation_type_a',
            config: {
              type: 'SelectControl',
              label: t('Aggregation Type'),
              description: t(
                'How values are aggregated in detail drill-down. ' +
                  'PERCENT: deltas shown in п.п. (percentage points).',
              ),
              default: 'SUM',
              choices: AGGREGATION_CHOICES,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'delta_format_1a',
            config: {
              type: 'SelectControl',
              label: t('Delta Format — Comparison 1'),
              description: t('How delta is displayed for comparison 1 (%, п.п., absolute, or custom text)'),
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
              label: t('Delta Format — Comparison 2'),
              description: t('How delta is displayed for comparison 2 (%, п.п., absolute, or custom text)'),
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
              label: t('Color Logic — Comparison 1'),
              description: t('Delta pill colors for comparison 1 in this mode'),
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
              label: t('Color Logic — Comparison 2'),
              description: t('Delta pill colors for comparison 2 in this mode'),
              default: 'green_up',
              choices: COLOR_SCHEME_CHOICES,
              renderTrigger: true,
            },
          },
        ],
      ],
    },

    // ── Section 4: Mode B (visible only in dual mode) ──
    {
      label: t('Mode B'),
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
              default: 'рост к ПГ',
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
            name: 'aggregation_type_b',
            config: {
              type: 'SelectControl',
              label: t('Aggregation Type'),
              default: 'PERCENT',
              choices: AGGREGATION_CHOICES,
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
              label: t('Delta Format — Comparison 1'),
              description: t('How delta is displayed for comparison 1 (%, п.п., absolute, or custom text)'),
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
              label: t('Delta Format — Comparison 2'),
              description: t('How delta is displayed for comparison 2 (%, п.п., absolute, or custom text)'),
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
              label: t('Color Logic — Comparison 1'),
              description: t('Delta pill colors for comparison 1 in this mode'),
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
              label: t('Color Logic — Comparison 2'),
              description: t('Delta pill colors for comparison 2 in this mode'),
              default: 'green_up',
              choices: COLOR_SCHEME_CHOICES,
              renderTrigger: true,
              visibility: isDual,
            },
          },
        ],
      ],
    },

    // ── Section 5: Comparisons ──
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
              description: t('Display first comparison row (e.g., plan/target)'),
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
              description: t('Label text (e.g., "План:", "Target:", "Budget:")'),
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
              description: t('Display second comparison row (e.g., previous period)'),
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
              description: t('Label text (e.g., "ПГ:", "YoY:", "vs LM:")'),
              default: 'ПГ:',
              renderTrigger: true,
              visibility: isComp2Enabled,
            },
          },
        ],
      ],
    },

    // ── Section 6: Detail / Drill-Down ──
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
              description: t(
                'Column for primary hierarchy level (e.g., segment, category)',
              ),
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
              description: t(
                'Column for secondary hierarchy level (e.g., store, region)',
              ),
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
              description: t('Display name for primary group (e.g., "Сегмент", "Category")'),
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
              description: t('Display name for secondary group (e.g., "Магазин", "Region")'),
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
              description: t(
                'Limit detail data to top N groups by metric value. 0 = show all.',
              ),
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
