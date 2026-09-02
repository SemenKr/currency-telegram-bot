import { describe, expect, it } from 'vitest';

import { GetCurrencyRate } from '../../src/application/use-cases/get-currency-rate.js';
import type {
    CurrencyRate,
    CurrencyRateProvider,
} from '../../src/domain/ports/currency-rate-provider.js';

class FakeCurrencyRateProvider implements CurrencyRateProvider {
    async getRate(base: string, quote: string): Promise<CurrencyRate> {
        return {
            base,
            quote,
            rate: 1.159,
            date: '2026-09-01',
        };
    }
}

describe('GetCurrencyRate', () => {
    it('normalizes a currency code and requests its USD rate', async () => {
        const provider = new FakeCurrencyRateProvider();
        const useCase = new GetCurrencyRate(provider);

        const result = await useCase.execute(' eur ');

        expect(result).toEqual({
            base: 'EUR',
            quote: 'USD',
            rate: 1.159,
            date: '2026-09-01',
        });
    });

    it('rejects a currency code with an invalid format', async () => {
        const provider = new FakeCurrencyRateProvider();
        const useCase = new GetCurrencyRate(provider);

        await expect(useCase.execute('euro')).rejects.toThrow(
            'Currency code must consist of three letters',
        );
    });
});
