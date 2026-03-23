/**
 * Mock for @superset-ui/core used in standalone Storybook.
 *
 * Only exports what the plugin actually imports:
 * - styled (re-exported from @emotion/styled)
 * - QueryFormData, QueryFormMetric, supersetTheme (type stubs)
 * - getMetricLabel, getNumberFormatter, NumberFormats, ChartProps (runtime stubs)
 */

// Re-export Emotion's styled — identical to what @superset-ui/core provides
export { default as styled } from '@emotion/styled';

// Theme stub (only used for typeof in types.ts)
export const supersetTheme = {} as Record<string, unknown>;

// Type stubs — at runtime these are just shapes, not used in stories
export type QueryFormData = Record<string, unknown>;
export type QueryFormMetric = string | { label?: string; metric_name?: string };

// Runtime stubs used in transformProps (not called in stories directly)
export function getMetricLabel(metric: QueryFormMetric): string {
  if (typeof metric === 'string') return metric;
  return metric?.label ?? '';
}

export function getNumberFormatter(_format?: string) {
  return (n: number) => String(n);
}

export const NumberFormats = {
  SMART_NUMBER: 'SMART_NUMBER',
};

// ChartProps stub (used in tests, not stories — but needed for compilation)
export class ChartProps {
  width: number;
  height: number;
  formData: Record<string, unknown>;
  queriesData: Array<{ data: unknown[] }>;
  theme: Record<string, unknown>;

  constructor(opts: {
    width: number;
    height: number;
    formData: Record<string, unknown>;
    queriesData: Array<{ data: unknown[] }>;
    theme?: Record<string, unknown>;
  }) {
    this.width = opts.width;
    this.height = opts.height;
    this.formData = opts.formData;
    this.queriesData = opts.queriesData;
    this.theme = opts.theme ?? {};
  }
}

// ChartPlugin + ChartMetadata stubs (used in plugin/index.ts)
export class ChartMetadata {
  constructor(_opts: Record<string, unknown>) {}
}

export class ChartPlugin<T = unknown> {
  constructor(_opts: Record<string, unknown>) {}
  configure(_opts: Record<string, unknown>): this {
    return this;
  }
}
