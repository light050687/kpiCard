import {
  ControlPanelConfig,
  sections,
  sharedControls,
} from '@superset-ui/chart-controls';
import { t } from '@superset-ui/core';

const config: ControlPanelConfig = {
  controlPanelSections: [
    sections.legacyTimeseriesTime,
    {
      label: t('KPI Metric'),
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
                'Optional plan or target metric for comparison. ' +
                  'Leave empty to hide plan comparison.',
              ),
              validators: [],
            },
          },
        ],
      ],
    },
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
              description: t(
                'Title displayed at the top of the card. ' +
                  'Defaults to metric name if empty.',
              ),
              default: '',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'subheader_text',
            config: {
              type: 'TextControl',
              label: t('Subtitle (Abs)'),
              description: t('Subtitle for absolute value view'),
              default: '',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'subheader_text_pct',
            config: {
              type: 'TextControl',
              label: t('Subtitle (Pct)'),
              description: t('Subtitle for percentage view'),
              default: '',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'number_format',
            config: {
              type: 'TextControl',
              label: t('Number Format'),
              description: t(
                'D3 format string for the main value (e.g., ",.2f", ".1%")',
              ),
              default: 'SMART_NUMBER',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'number_format_secondary',
            config: {
              type: 'TextControl',
              label: t('Percentage Format'),
              description: t(
                'D3 format for delta percentages (e.g., "+.1%")',
              ),
              default: '+.1%',
              renderTrigger: true,
            },
          },
        ],
      ],
    },
    {
      label: t('Comparison'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'time_comparison',
            config: {
              type: 'SelectControl',
              label: t('Time Comparison'),
              description: t(
                'Compare against a previous time period. ' +
                  'Uses Superset time_offsets under the hood.',
              ),
              default: '1 year ago',
              choices: [
                ['none', t('None')],
                ['1 year ago', t('Previous Year (YoY)')],
                ['1 month ago', t('Previous Month (MoM)')],
                ['1 week ago', t('Previous Week (WoW)')],
                ['28 days ago', t('28 Days Ago')],
                ['52 weeks ago', t('52 Weeks Ago')],
              ],
              renderTrigger: false,
            },
          },
        ],
        [
          {
            name: 'comparison_color_scheme',
            config: {
              type: 'SelectControl',
              label: t('Color Logic'),
              description: t(
                'Determines delta pill color. ' +
                  '"Increase is good" = green when value grows (e.g., Revenue). ' +
                  '"Decrease is good" = green when value drops (e.g., Expenses).',
              ),
              default: 'green_up',
              choices: [
                ['green_up', t('Increase is Good')],
                ['green_down', t('Decrease is Good')],
              ],
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
              description: t('Label for plan comparison row'),
              default: t('Plan:'),
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'comparison_label',
            config: {
              type: 'TextControl',
              label: t('Period Label'),
              description: t('Label for time comparison row'),
              default: t('YoY:'),
              renderTrigger: true,
            },
          },
        ],
      ],
    },
    {
      label: t('Toggle'),
      expanded: false,
      controlSetRows: [
        [
          {
            name: 'toggle_mode',
            config: {
              type: 'SelectControl',
              label: t('Toggle Mode'),
              description: t(
                'Show toggle buttons to switch between absolute and percentage views',
              ),
              default: 'abs_pct',
              choices: [
                ['abs_pct', t('Abs / Pct Toggle')],
                ['none', t('No Toggle')],
              ],
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'toggle_label_abs',
            config: {
              type: 'TextControl',
              label: t('Abs Button Label'),
              default: '₽',
              renderTrigger: true,
              visibility: ({ controls }: { controls: Record<string, any> }) =>
                controls?.toggle_mode?.value === 'abs_pct',
            },
          },
        ],
        [
          {
            name: 'toggle_label_pct',
            config: {
              type: 'TextControl',
              label: t('Pct Button Label'),
              default: '%',
              renderTrigger: true,
              visibility: ({ controls }: { controls: Record<string, any> }) =>
                controls?.toggle_mode?.value === 'abs_pct',
            },
          },
        ],
      ],
    },
  ],
};

export default config;
