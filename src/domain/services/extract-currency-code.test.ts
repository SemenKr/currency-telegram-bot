import { describe, expect, it } from 'vitest';

import { extractCurrencyCode } from './extract-currency-code.js';

describe('extractCurrencyCode', () => {
    it('extracts an uppercase currency code from text', () => {
        const result = extractCurrencyCode('Какой сегодня курс EUR?');

        expect(result).toBe('EUR');
    });

    it('normalizes a lowercase currency code', () => {
        const result = extractCurrencyCode('Покажи мне курс jpy к доллару');

        expect(result).toBe('JPY');
    });

    it('extracts a currency code next to punctuation', () => {
        const result = extractCurrencyCode('Сколько сейчас стоит GBP?!');

        expect(result).toBe('GBP');
    });

    it('returns the first code when text contains several codes', () => {
        const result = extractCurrencyCode('Сравни EUR и GBP');

        expect(result).toBe('EUR');
    });

    it('does not extract three letters from a longer word', () => {
        const result = extractCurrencyCode('Напиши EURO полностью');

        expect(result).toBeNull();
    });

    it('returns null when a currency code is absent', () => {
        const result = extractCurrencyCode('Расскажи о курсах валют');

        expect(result).toBeNull();
    });
});
