// Minimal mock of @superset-ui/core for unit tests
export const getMetricLabel = (m: unknown): string => {
  if (typeof m === 'string') return m;
  if (m && typeof m === 'object' && 'label' in m) return (m as { label: string }).label;
  return '';
};

export const getNumberFormatter = () => (n: number) => String(n);
export const NumberFormats = {};
export const buildQueryContext = jest.fn();

export type QueryFormMetric = string | { label?: string; [k: string]: unknown };
export type ChartProps = Record<string, unknown>;
