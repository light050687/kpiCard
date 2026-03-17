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

// ── Visibility helpers ──
type ControlsMap = { controls: Record<string, { value?: unknown }> };

const isDual = ({ controls }: ControlsMap): boolean =>
  controls?.mode_count?.value === 'dual';

const isPlanEnabled = ({ controls }: ControlsMap): boolean =>
  controls?.enable_plan?.value === true;

const isYoyEnabled = ({ controls }: ControlsMap): boolean =>
  controls?.enable_yoy?.value === true;

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
            name: 'mode_a_name',
            config: {
              type: 'TextControl',
              label: t('Mode A Name'),
              description: t('Internal name for this mode'),
              default: 'Рубли',
              renderTrigger: true,
            },
          },
        ],
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
            name: 'color_scheme_a',
            config: {
              type: 'SelectControl',
              label: t('Color Logic'),
              description: t('Determines delta pill colors for this mode'),
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
            name: 'mode_b_name',
            config: {
              type: 'TextControl',
              label: t('Mode B Name'),
              default: 'Проценты',
              renderTrigger: true,
              visibility: isDual,
            },
          },
        ],
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
            name: 'color_scheme_b',
            config: {
              type: 'SelectControl',
              label: t('Color Logic'),
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
            name: 'enable_plan',
            config: {
              type: 'CheckboxControl',
              label: t('Show Plan Comparison'),
              description: t('Display plan/target comparison row'),
              default: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'plan_label',
            config: {
              type: 'TextControl',
              label: t('Plan Label'),
              description: t('Label text (e.g., "План:", "Target:")'),
              default: 'План:',
              renderTrigger: true,
              visibility: isPlanEnabled,
            },
          },
        ],
        [
          {
            name: 'enable_yoy',
            config: {
              type: 'CheckboxControl',
              label: t('Show Period Comparison'),
              description: t('Display previous period comparison row'),
              default: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'yoy_label',
            config: {
              type: 'TextControl',
              label: t('Period Label'),
              description: t('Label text (e.g., "ПГ:", "YoY:", "vs LM:")'),
              default: 'ПГ:',
              renderTrigger: true,
              visibility: isYoyEnabled,
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
