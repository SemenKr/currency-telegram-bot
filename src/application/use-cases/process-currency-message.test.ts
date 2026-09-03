import { describe, expect, it, vi } from 'vitest';

import type { CurrencyRateProvider } from '../../domain/ports/currency-rate-provider.js';
import { GetCurrencyRate } from './get-currency-rate.js';
import { ProcessCurrencyMessage } from './process-currency-message.js';

describe('ProcessCurrencyMessage', () => {
    it('extracts a currency code and returns its rate', async () => {
        const getRate = vi
            .fn<CurrencyRateProvider['getRate']>()
            .mockResolvedValue({
                base: 'EUR',
                quote: 'USD',
                rate: 1.1578,
                date: '2026-09-02',
            });

        const provider: CurrencyRateProvider = {
            getRate,
        };

        const getCurrencyRate = new GetCurrencyRate(provider);
        const processCurrencyMessage = new ProcessCurrencyMessage(
            getCurrencyRate,
        );

        const result = await processCurrencyMessage.execute(
            'Какой сегодня курс eur?',
        );

        expect(result).toEqual({
            type: 'rate-found',
            rate: {
                base: 'EUR',
                quote: 'USD',
                rate: 1.1578,
                date: '2026-09-02',
            },
        });

        expect(getRate).toHaveBeenCalledWith('EUR', 'USD');
    });

    it('returns currency-code-not-found when the text has no code', async () => {
        const getRate = vi
            .fn<CurrencyRateProvider['getRate']>()
            .mockResolvedValue({
                base: 'EUR',
                quote: 'USD',
                rate: 1.1578,
                date: '2026-09-02',
            });

        const provider: CurrencyRateProvider = {
            getRate,
        };

        const getCurrencyRate = new GetCurrencyRate(provider);
        const processCurrencyMessage = new ProcessCurrencyMessage(
            getCurrencyRate,
        );

        const result = await processCurrencyMessage.execute(
            'Расскажи мне о валютах',
        );

        expect(result).toEqual({
            type: 'currency-code-not-found',
        });

        // Если код не найден, обращаться к внешнему API бессмысленно.
        expect(getRate).not.toHaveBeenCalled();
    });
});
