import {
  formatRussianSmart,
  formatRussianSmartEx,
  formatRussianPercent,
  formatRussianPP,
  formatRussianDeltaAbs,
  formatRussianDeltaAbsEx,
} from '../src/utils/formatRussian';

describe('formatRussianSmart', () => {
  it('formats small numbers without abbreviation', () => {
    expect(formatRussianSmart(0)).toBe('0');
    expect(formatRussianSmart(999)).toBe('999');
    // Intl.NumberFormat uses thin space (U+202F) as thousands separator in ru-RU
    expect(formatRussianSmart(5000)).toMatch(/5.000/);
  });

  it('abbreviates thousands (тыс)', () => {
    const result = formatRussianSmart(12345);
    expect(result).toContain('тыс');
  });

  it('abbreviates millions (млн)', () => {
    const result = formatRussianSmart(1_234_567);
    expect(result).toContain('млн');
  });

  it('abbreviates billions (млрд)', () => {
    const result = formatRussianSmart(1_234_567_890);
    expect(result).toContain('млрд');
  });

  it('uses minus sign (−) for negative numbers', () => {
    const result = formatRussianSmart(-500_000);
    expect(result).toContain('−');
    expect(result).toContain('тыс');
  });
});

describe('formatRussianSmartEx', () => {
  it('applies custom suffix', () => {
    const result = formatRussianSmartEx(1_000_000, -1, '₽');
    expect(result).toContain('₽');
    expect(result).toContain('млн');
  });

  it('applies fixed decimals', () => {
    const result = formatRussianSmartEx(1_500_000, 3, '');
    expect(result).toContain('млн');
  });

  it('handles zero with suffix', () => {
    const result = formatRussianSmartEx(0, 0, '₽');
    expect(result).toBe('0 ₽');
  });
});

describe('formatRussianPercent', () => {
  it('formats positive ratio as percent', () => {
    const result = formatRussianPercent(0.148, true);
    expect(result).toMatch(/^\+14[,.]8%$/);
  });

  it('formats negative ratio with minus', () => {
    const result = formatRussianPercent(-0.053, true);
    expect(result).toContain('−');
    expect(result).toContain('%');
  });

  it('formats zero without sign', () => {
    const result = formatRussianPercent(0, true);
    expect(result).toMatch(/0[,.]0%/);
  });
});

describe('formatRussianPP', () => {
  it('formats positive as +X п.п.', () => {
    const result = formatRussianPP(0.013);
    expect(result).toContain('+');
    expect(result).toContain('п.п.');
  });

  it('formats negative as −X п.п.', () => {
    const result = formatRussianPP(-0.021);
    expect(result).toContain('−');
    expect(result).toContain('п.п.');
  });
});

describe('formatRussianDeltaAbs', () => {
  it('formats positive delta with + sign', () => {
    const result = formatRussianDeltaAbs(1_200_000);
    expect(result).toContain('+');
    expect(result).toContain('млн');
  });

  it('formats negative delta with − sign', () => {
    const result = formatRussianDeltaAbs(-500_000);
    expect(result).toContain('−');
    expect(result).toContain('тыс');
  });

  it('formats zero as 0', () => {
    const result = formatRussianDeltaAbs(0);
    expect(result).toBe('0');
  });
});

describe('formatRussianDeltaAbsEx', () => {
  it('applies custom suffix to delta', () => {
    const result = formatRussianDeltaAbsEx(1_500_000, -1, 'п.п.');
    expect(result).toContain('п.п.');
  });
});
