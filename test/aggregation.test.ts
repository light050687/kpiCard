import { getDeltaStatus, computeDelta } from '../src/utils/aggregation';

describe('getDeltaStatus', () => {
  it('returns neutral for zero delta', () => {
    expect(getDeltaStatus(0, 'green_up')).toBe('neutral');
    expect(getDeltaStatus(0, 'green_down')).toBe('neutral');
  });

  it('green_up: positive delta → up (good)', () => {
    expect(getDeltaStatus(100, 'green_up')).toBe('up');
  });

  it('green_up: negative delta → dn (bad)', () => {
    expect(getDeltaStatus(-100, 'green_up')).toBe('dn');
  });

  it('green_down: positive delta → dn (bad, e.g. expenses grew)', () => {
    expect(getDeltaStatus(100, 'green_down')).toBe('dn');
  });

  it('green_down: negative delta → up (good, e.g. expenses reduced)', () => {
    expect(getDeltaStatus(-100, 'green_down')).toBe('up');
  });
});

describe('computeDelta', () => {
  const fmt = (n: number) => `${(n * 100).toFixed(1)}%`;

  it('computes absolute delta in auto mode', () => {
    const result = computeDelta(1200, 1000, false, 'auto', fmt);
    expect(result.status_value).toBe(200);
    expect(result.formatted).toBeTruthy();
  });

  it('handles zero reference in auto mode', () => {
    const result = computeDelta(1200, 0, false, 'auto', fmt);
    expect(result.formatted).toBe('—');
    expect(result.status_value).toBe(0);
  });

  it('percent mode passes diff directly', () => {
    const result = computeDelta(0.15, 0.12, true, 'auto', fmt);
    expect(result.status_value).toBeCloseTo(0.03, 5);
  });

  it('custom format delegates to formatDeltaByFormat', () => {
    const result = computeDelta(1200, 1000, false, 'percent', fmt);
    expect(result.status_value).toBe(200);
    expect(result.formatted).toBeTruthy();
  });
});
