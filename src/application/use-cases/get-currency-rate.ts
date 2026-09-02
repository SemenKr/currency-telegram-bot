import type {
    CurrencyRate,
    CurrencyRateProvider,
} from '../../domain/ports/currency-rate-provider.js';

export class GetCurrencyRate {
    constructor(private readonly currencyRateProvider: CurrencyRateProvider) {}

    async execute(currencyCode: string): Promise<CurrencyRate> {
        const normalizedCurrencyCode = currencyCode.trim().toUpperCase();

        if (!/^[A-Z]{3}$/.test(normalizedCurrencyCode)) {
            throw new Error('Currency code must consist of three letters');
        }

        return this.currencyRateProvider.getRate(normalizedCurrencyCode, 'USD');
    }
}
