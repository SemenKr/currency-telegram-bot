import type {
    CurrencyRate,
    CurrencyRateProvider,
} from '../../domain/ports/currency-rate-provider.js';

export type GetCurrencyRateResult = Omit<CurrencyRate, 'date'> & {
    date?: string;
};

export class GetCurrencyRate {
    constructor(private readonly currencyRateProvider: CurrencyRateProvider) {}

    async execute(currencyCode: string): Promise<GetCurrencyRateResult> {
        const normalizedCurrencyCode = currencyCode.trim().toUpperCase();

        if (!/^[A-Z]{3}$/.test(normalizedCurrencyCode)) {
            throw new Error('Currency code must consist of three letters');
        }

        const base = normalizedCurrencyCode;
        const quote = 'USD';

        if (base === quote) {
            // Курс валюты к самой себе определяется математически,
            // поэтому внешний провайдер и его дата здесь не нужны.
            return {
                base,
                quote,
                rate: 1,
            };
        }

        return this.currencyRateProvider.getRate(base, quote);
    }
}
