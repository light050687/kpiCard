/**
 * Russian-locale number formatting utilities.
 *
 * Follows standard Russian conventions:
 *   - Thousands separator: thin space (U+202F)
 *   - Decimal separator: comma
 *   - Abbreviations: тыс, млн, млрд
 *   - Percentage points: п.п.
 */
const RU_LOCALE = 'ru-RU';
/** Format a number with Russian locale (space-separated thousands, comma decimal) */
function ruNumber(value, fractionDigits) {
    return new Intl.NumberFormat(RU_LOCALE, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(value);
}
/**
 * Smart Russian number formatter with auto abbreviation.
 *
 * @example
 *   formatRussianSmart(1234)          → "1 234"
 *   formatRussianSmart(12345)         → "12,3 тыс"
 *   formatRussianSmart(1234567)       → "1,23 млн"
 *   formatRussianSmart(1234567890)    → "1,23 млрд"
 *   formatRussianSmart(-500000)       → "−500 тыс"
 */
export function formatRussianSmart(value) {
    return formatRussianSmartEx(value, -1, '');
}
/**
 * Extended smart formatter with configurable decimals and suffix.
 *
 * @param value    - numeric value
 * @param decimals - fixed decimal places (-1 = auto)
 * @param suffix   - unit suffix appended after abbreviation (₽, п.п., %)
 */
export function formatRussianSmartEx(value, decimals = -1, suffix = '') {
    const abs = Math.abs(value);
    const sign = value < 0 ? '−' : '';
    const sfx = suffix ? ` ${suffix}` : '';
    if (abs >= 1000000000) {
        const v = abs / 1000000000;
        const d = decimals >= 0 ? decimals : (abs >= 10000000000 ? 1 : 2);
        return `${sign}${ruNumber(v, d)} млрд${sfx}`;
    }
    if (abs >= 1000000) {
        const v = abs / 1000000;
        const d = decimals >= 0 ? decimals : (abs >= 100000000 ? 1 : 2);
        return `${sign}${ruNumber(v, d)} млн${sfx}`;
    }
    if (abs >= 10000) {
        const v = abs / 1000;
        const d = decimals >= 0 ? decimals : (abs >= 100000 ? 0 : 1);
        return `${sign}${ruNumber(v, d)} тыс${sfx}`;
    }
    const d = decimals >= 0 ? decimals : 0;
    return `${ruNumber(value, d)}${sfx}`;
}
/**
 * Format a ratio (0.148 → "+14,8%") with optional sign.
 *
 * @param ratio  - Fractional value (e.g. 0.148 for 14.8%)
 * @param signed - Whether to prepend + for positive values
 *
 * @example
 *   formatRussianPercent(0.148, true)  → "+14,8%"
 *   formatRussianPercent(-0.053, true) → "−5,3%"
 *   formatRussianPercent(0, true)      → "0,0%"
 */
export function formatRussianPercent(ratio, signed = false) {
    const pct = ratio * 100;
    const formatted = ruNumber(Math.abs(pct), 1);
    let prefix = '';
    if (signed) {
        if (pct > 0)
            prefix = '+';
        else if (pct < 0)
            prefix = '−';
    }
    else if (pct < 0) {
        prefix = '−';
    }
    return `${prefix}${formatted}%`;
}
/**
 * Format percentage-point delta (0.013 → "+1,3 п.п.").
 *
 * @param ratio - Fractional pp delta (e.g. 0.013 for 1.3 pp)
 *
 * @example
 *   formatRussianPP(0.013)  → "+1,3 п.п."
 *   formatRussianPP(-0.021) → "−2,1 п.п."
 */
export function formatRussianPP(ratio) {
    const pp = ratio * 100;
    const formatted = ruNumber(Math.abs(pp), 1);
    let sign = '';
    if (pp > 0)
        sign = '+';
    else if (pp < 0)
        sign = '−';
    return `${sign}${formatted} п.п.`;
}
/**
 * Format an absolute delta with sign and smart abbreviation.
 *
 * @example
 *   formatRussianDeltaAbs(1200000000) → "+1,2 млрд"
 *   formatRussianDeltaAbs(-200000000) → "−0,2 млрд"
 */
/**
 * Compute numeric part of delta (with sign, without suffix).
 * Used internally and for custom suffix override.
 */
/**
 * Returns ONLY the numeric part of delta (with sign), WITHOUT any suffix.
 * Used when a custom suffix override is provided.
 */
function computeNumericDelta(diff, ref, fmt, isRatioSpace) {
    switch (fmt) {
        case 'percent': {
            if (isRatioSpace) {
                const pct = diff * 100;
                const formatted = ruNumber(Math.abs(pct), 1);
                const sign = pct > 0 ? '+' : pct < 0 ? '−' : '';
                return `${sign}${formatted}`;
            }
            if (ref === 0)
                return '—';
            const ratio = diff / ref;
            const pct = ratio * 100;
            const formatted = ruNumber(Math.abs(pct), 1);
            const sign = pct > 0 ? '+' : pct < 0 ? '−' : '';
            return `${sign}${formatted}`;
        }
        case 'pp': {
            const pp = (isRatioSpace ? diff : ref !== 0 ? diff / ref : 0) * 100;
            if (!isRatioSpace && ref === 0)
                return '—';
            const formatted = ruNumber(Math.abs(pp), 1);
            const sign = pp > 0 ? '+' : pp < 0 ? '−' : '';
            return `${sign}${formatted}`;
        }
        case 'absolute':
        default: {
            if (isRatioSpace) {
                const pp = diff * 100;
                const formatted = ruNumber(Math.abs(pp), 1);
                const sign = pp > 0 ? '+' : pp < 0 ? '−' : '';
                return `${sign}${formatted}`;
            }
            // Return smart-abbreviated number with sign (e.g. "+1,99 млн")
            return formatRussianDeltaAbs(diff);
        }
    }
}
/**
 * Format a delta value: 'auto' → auto-resolved keyword, anything else → suffix.
 *
 * @param diff - raw numeric difference (current - reference)
 * @param ref  - reference value (for percent calculation)
 * @param fmt  - resolved format keyword ('percent'|'pp'|'absolute') or custom suffix text
 * @param isRatioSpace - true when diff/ref are already in ratio space (PERCENT aggregation)
 * @param suffixOverride - if set, replaces the default suffix with custom text
 */
export function formatDeltaByFormat(diff, ref, fmt, isRatioSpace = false, suffixOverride) {
    // Custom suffix: compute numeric part, strip built-in suffix, append user suffix
    if (suffixOverride) {
        const numPart = computeNumericDelta(diff, ref, fmt, isRatioSpace);
        if (numPart === '—')
            return '—';
        // Strip built-in suffixes (тыс, млн, млрд, %, п.п.) before adding custom one
        const stripped = numPart.replace(/\s*(тыс|млн|млрд|%|п\.п\.)$/g, '').trim();
        return `${stripped} ${suffixOverride}`;
    }
    switch (fmt) {
        case 'percent':
            if (isRatioSpace)
                return formatRussianPercent(diff, true);
            return ref !== 0 ? formatRussianPercent(diff / ref, true) : '—';
        case 'pp':
            if (isRatioSpace)
                return formatRussianPP(diff);
            return ref !== 0 ? formatRussianPP(diff / ref) : '—';
        case 'absolute':
            if (isRatioSpace)
                return formatRussianPP(diff);
            return formatRussianDeltaAbs(diff);
        default: {
            if (isRatioSpace) {
                // Ratio space: use pp-like number + user suffix
                const ppStr = formatRussianPP(diff);
                const base = ppStr.replace(/\s*п\.п\.\s*$/, '');
                return `${base} ${fmt}`;
            }
            return `${formatRussianDeltaAbs(diff)} ${fmt}`;
        }
    }
}
/**
 * Extended delta-abs formatter with configurable decimals and suffix.
 * Prefixes positive values with '+'.
 */
export function formatRussianDeltaAbsEx(value, decimals = -1, suffix = '') {
    const sign = value > 0 ? '+' : '';
    const formatted = formatRussianSmartEx(value, decimals, suffix);
    return value > 0 ? `${sign}${formatted}` : formatted;
}
export function formatRussianDeltaAbs(value) {
    const sign = value > 0 ? '+' : '';
    const formatted = formatRussianSmart(value);
    // formatRussianSmart already handles negative sign as '−'
    return value > 0 ? `${sign}${formatted}` : formatted;
}
//# sourceMappingURL=formatRussian.js.map