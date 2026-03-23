import {
  ControlPanelConfig,
  D3_FORMAT_OPTIONS,
  sections,
  sharedControls,
} from '@superset-ui/chart-controls';
import { t } from '@superset-ui/core';

// ── Custom format options (Russian smart + standard D3) ──
const NUMBER_FORMAT_OPTIONS: [string, string][] = [
  ['RU_SMART', t('Русский формат (тыс, млн, млрд)')],
  ...D3_FORMAT_OPTIONS,
];

const COLOR_SCHEME_CHOICES: [string, string][] = [
  ['green_up', t('Рост — хорошо')],
  ['green_down', t('Снижение — хорошо')],
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
    // ── Section 1: Time ──
    sections.legacyTimeseriesTime,

    // ── Section 2: Query — Mode A ──
    {
      label: t('Запрос — Режим А'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'metric_a',
            config: {
              ...sharedControls.metric,
              label: t('Основная мера'),
              description: t('Основное значение KPI — большое число на карточке'),
            },
          },
        ],
        [
          {
            name: 'metric_plan_a',
            config: {
              ...sharedControls.metric,
              label: t('Мера сравнения 1'),
              description: t('Первая мера сравнения (например, план, бюджет)'),
              validators: [],
            },
          },
        ],
        [
          {
            name: 'metric_comp2_a',
            config: {
              ...sharedControls.metric,
              label: t('Мера сравнения 2'),
              description: t('Вторая мера сравнения (например, прошлый год, среднее)'),
              validators: [],
            },
          },
        ],
        [
          {
            name: 'metric_delta_1a',
            config: {
              ...sharedControls.metric,
              label: t('Мера дельты — Сравнение 1'),
              description: t('Готовое значение дельты из SQL. Если не задано — дельта = факт − план.'),
              validators: [],
              visibility: isComp1Enabled,
            },
          },
        ],
        [
          {
            name: 'metric_delta_2a',
            config: {
              ...sharedControls.metric,
              label: t('Мера дельты — Сравнение 2'),
              description: t('Готовое значение дельты из SQL. Если не задано — дельта = факт − план.'),
              validators: [],
              visibility: isComp2Enabled,
            },
          },
        ],
      ],
    },

    // ── Section 3: Query — Mode B (only in dual mode) ──
    {
      label: t('Запрос — Режим Б'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'metric_b',
            config: {
              ...sharedControls.metric,
              label: t('Основная мера'),
              description: t('Основное значение KPI для Режима Б'),
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
              label: t('Мера сравнения 1'),
              description: t('Первая мера сравнения для Режима Б'),
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
              label: t('Мера сравнения 2'),
              description: t('Вторая мера сравнения для Режима Б'),
              validators: [],
              visibility: isDual,
            },
          },
        ],
        [
          {
            name: 'metric_delta_1b',
            config: {
              ...sharedControls.metric,
              label: t('Мера дельты — Сравнение 1'),
              description: t('Готовое значение дельты из SQL. Если не задано — дельта = факт − план.'),
              validators: [],
              visibility: (state: ControlsMap) => isDual(state) && isComp1Enabled(state),
            },
          },
        ],
        [
          {
            name: 'metric_delta_2b',
            config: {
              ...sharedControls.metric,
              label: t('Мера дельты — Сравнение 2'),
              description: t('Готовое значение дельты из SQL. Если не задано — дельта = факт − план.'),
              validators: [],
              visibility: (state: ControlsMap) => isDual(state) && isComp2Enabled(state),
            },
          },
        ],
      ],
    },

    // ── Section 4: Card Display ──
    {
      label: t('Отображение карточки'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'header_text',
            config: {
              type: 'TextControl',
              label: t('Заголовок карточки'),
              description: t('По умолчанию — название метрики'),
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
              label: t('Режимы отображения'),
              description: t(
                'Single = one view, no toggle. Dual = two views with toggle buttons.',
              ),
              default: 'dual',
              choices: [
                ['single', t('Один режим')],
                ['dual', t('Два режима (переключатель А / Б)')],
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
              label: t('Русский формат чисел'),
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

    // ── Section 5: Mode A Settings ──
    {
      label: t('Настройки режима А'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'toggle_label_a',
            config: {
              type: 'TextControl',
              label: t('Название кнопки переключения'),
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
              label: t('Подзаголовок'),
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
              label: t('Формат числа'),
              default: 'RU_SMART',
              choices: NUMBER_FORMAT_OPTIONS,
              freeForm: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'suffix_main_a',
            config: {
              type: 'TextControl',
              label: t('Суффикс основного числа'),
              default: '',
              placeholder: '₽, %, шт.',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'decimals_main_a',
            config: {
              type: 'TextControl',
              isInt: true,
              label: t('Знаков после запятой'),
              default: '',
              placeholder: t('Авто'),
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'suffix_comp1_a',
            config: {
              type: 'TextControl',
              label: t('Суффикс — Сравнение 1'),
              default: '',
              renderTrigger: true,
              visibility: isComp1Enabled,
            },
          },
        ],
        [
          {
            name: 'decimals_comp1_a',
            config: {
              type: 'TextControl',
              isInt: true,
              label: t('Знаков — Сравнение 1'),
              default: '',
              placeholder: t('Авто'),
              renderTrigger: true,
              visibility: isComp1Enabled,
            },
          },
        ],
        [
          {
            name: 'suffix_comp2_a',
            config: {
              type: 'TextControl',
              label: t('Суффикс — Сравнение 2'),
              default: '',
              renderTrigger: true,
              visibility: isComp2Enabled,
            },
          },
        ],
        [
          {
            name: 'decimals_comp2_a',
            config: {
              type: 'TextControl',
              isInt: true,
              label: t('Знаков — Сравнение 2'),
              default: '',
              placeholder: t('Авто'),
              renderTrigger: true,
              visibility: isComp2Enabled,
            },
          },
        ],
        [
          {
            name: 'suffix_delta1_a',
            config: {
              type: 'TextControl',
              label: t('Суффикс дельты 1'),
              default: '',
              renderTrigger: true,
              visibility: isComp1Enabled,
            },
          },
        ],
        [
          {
            name: 'decimals_delta1_a',
            config: {
              type: 'TextControl',
              isInt: true,
              label: t('Знаков — Дельта 1'),
              default: '',
              placeholder: t('Авто'),
              renderTrigger: true,
              visibility: isComp1Enabled,
            },
          },
        ],
        [
          {
            name: 'suffix_delta2_a',
            config: {
              type: 'TextControl',
              label: t('Суффикс дельты 2'),
              default: '',
              renderTrigger: true,
              visibility: isComp2Enabled,
            },
          },
        ],
        [
          {
            name: 'decimals_delta2_a',
            config: {
              type: 'TextControl',
              isInt: true,
              label: t('Знаков — Дельта 2'),
              default: '',
              placeholder: t('Авто'),
              renderTrigger: true,
              visibility: isComp2Enabled,
            },
          },
        ],
        [
          {
            name: 'color_scheme_1a',
            config: {
              type: 'SelectControl',
              label: t('Цветовая логика — Сравнение 1'),
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
              label: t('Цветовая логика — Сравнение 2'),
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
      label: t('Настройки режима Б'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'toggle_label_b',
            config: {
              type: 'TextControl',
              label: t('Название кнопки переключения'),
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
              label: t('Подзаголовок'),
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
              label: t('Формат числа'),
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
            name: 'suffix_main_b',
            config: {
              type: 'TextControl',
              label: t('Суффикс основного числа'),
              default: '',
              placeholder: '₽, %, шт.',
              renderTrigger: true,
              visibility: isDual,
            },
          },
        ],
        [
          {
            name: 'decimals_main_b',
            config: {
              type: 'TextControl',
              isInt: true,
              label: t('Знаков после запятой'),
              default: '',
              placeholder: t('Авто'),
              renderTrigger: true,
              visibility: isDual,
            },
          },
        ],
        [
          {
            name: 'suffix_comp1_b',
            config: {
              type: 'TextControl',
              label: t('Суффикс — Сравнение 1'),
              default: '',
              renderTrigger: true,
              visibility: (state: ControlsMap) => isDual(state) && isComp1Enabled(state),
            },
          },
        ],
        [
          {
            name: 'decimals_comp1_b',
            config: {
              type: 'TextControl',
              isInt: true,
              label: t('Знаков — Сравнение 1'),
              default: '',
              placeholder: t('Авто'),
              renderTrigger: true,
              visibility: (state: ControlsMap) => isDual(state) && isComp1Enabled(state),
            },
          },
        ],
        [
          {
            name: 'suffix_comp2_b',
            config: {
              type: 'TextControl',
              label: t('Суффикс — Сравнение 2'),
              default: '',
              renderTrigger: true,
              visibility: (state: ControlsMap) => isDual(state) && isComp2Enabled(state),
            },
          },
        ],
        [
          {
            name: 'decimals_comp2_b',
            config: {
              type: 'TextControl',
              isInt: true,
              label: t('Знаков — Сравнение 2'),
              default: '',
              placeholder: t('Авто'),
              renderTrigger: true,
              visibility: (state: ControlsMap) => isDual(state) && isComp2Enabled(state),
            },
          },
        ],
        [
          {
            name: 'suffix_delta1_b',
            config: {
              type: 'TextControl',
              label: t('Суффикс дельты 1'),
              default: '',
              renderTrigger: true,
              visibility: (state: ControlsMap) => isDual(state) && isComp1Enabled(state),
            },
          },
        ],
        [
          {
            name: 'decimals_delta1_b',
            config: {
              type: 'TextControl',
              isInt: true,
              label: t('Знаков — Дельта 1'),
              default: '',
              placeholder: t('Авто'),
              renderTrigger: true,
              visibility: (state: ControlsMap) => isDual(state) && isComp1Enabled(state),
            },
          },
        ],
        [
          {
            name: 'suffix_delta2_b',
            config: {
              type: 'TextControl',
              label: t('Суффикс дельты 2'),
              default: '',
              renderTrigger: true,
              visibility: (state: ControlsMap) => isDual(state) && isComp2Enabled(state),
            },
          },
        ],
        [
          {
            name: 'decimals_delta2_b',
            config: {
              type: 'TextControl',
              isInt: true,
              label: t('Знаков — Дельта 2'),
              default: '',
              placeholder: t('Авто'),
              renderTrigger: true,
              visibility: (state: ControlsMap) => isDual(state) && isComp2Enabled(state),
            },
          },
        ],
        [
          {
            name: 'color_scheme_1b',
            config: {
              type: 'SelectControl',
              label: t('Цветовая логика — Сравнение 1'),
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
              label: t('Цветовая логика — Сравнение 2'),
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
      label: t('Сравнения'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'enable_comp1',
            config: {
              type: 'CheckboxControl',
              label: t('Показывать сравнение 1'),
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
              label: t('Название сравнения 1'),
              default: 'ПЛАН:',
              renderTrigger: true,
              visibility: isComp1Enabled,
            },
          },
        ],
        [
          {
            name: 'show_delta_1',
            config: {
              type: 'CheckboxControl',
              label: t('Показывать дельту — Сравнение 1'),
              description: t('Если выключено, строка сравнения отображается без дельты (pill)'),
              default: true,
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
              label: t('Показывать сравнение 2'),
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
              label: t('Название сравнения 2'),
              default: 'ПГ:',
              renderTrigger: true,
              visibility: isComp2Enabled,
            },
          },
        ],
        [
          {
            name: 'show_delta_2',
            config: {
              type: 'CheckboxControl',
              label: t('Показывать дельту — Сравнение 2'),
              description: t('Если выключено, строка сравнения отображается без дельты (pill)'),
              default: true,
              renderTrigger: true,
              visibility: isComp2Enabled,
            },
          },
        ],
      ],
    },

    // ── Section 8: Detail / Drill-Down ──
    {
      label: t('Детализация'),
      expanded: false,
      controlSetRows: [
        [
          {
            name: 'groupby_primary',
            config: {
              ...sharedControls.groupby,
              label: t('Основная группировка'),
              description: t('Колонка основного уровня иерархии'),
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
              label: t('Вторичная группировка'),
              description: t('Колонка вторичного уровня иерархии'),
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
              label: t('Название основной группы'),
              default: 'Магазин',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'hierarchy_label_secondary',
            config: {
              type: 'TextControl',
              label: t('Название вторичной группы'),
              default: 'Сегмент',
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
              label: t('Топ N групп'),
              description: t('Ограничить до N групп. 0 = показать все.'),
              default: 0,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'detail_page_size',
            config: {
              type: 'TextControl',
              isInt: true,
              label: t('Строк на странице'),
              description: t('Количество групп верхнего уровня на одной странице. 0 = без пагинации.'),
              default: 20,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'detail_col_fact',
            config: {
              type: 'TextControl',
              label: t('Название колонки Факт'),
              default: 'Факт',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'detail_col_comp1',
            config: {
              type: 'TextControl',
              label: t('Название колонки Сравнение 1'),
              default: '',
              placeholder: t('Из названия сравнения'),
              renderTrigger: true,
              visibility: isComp1Enabled,
            },
          },
        ],
        [
          {
            name: 'detail_col_delta1',
            config: {
              type: 'TextControl',
              label: t('Название колонки Дельта 1'),
              default: 'Дельта',
              renderTrigger: true,
              visibility: isComp1Enabled,
            },
          },
        ],
        [
          {
            name: 'detail_col_comp2',
            config: {
              type: 'TextControl',
              label: t('Название колонки Сравнение 2'),
              default: '',
              placeholder: t('Из названия сравнения'),
              renderTrigger: true,
              visibility: isComp2Enabled,
            },
          },
        ],
        [
          {
            name: 'detail_col_delta2',
            config: {
              type: 'TextControl',
              label: t('Название колонки Дельта 2'),
              default: 'Дельта',
              renderTrigger: true,
              visibility: isComp2Enabled,
            },
          },
        ],
      ],
    },
  ],
};

export default config;
