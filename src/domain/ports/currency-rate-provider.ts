export interface CurrencyRate {
    base: string;
    quote: string;
    rate: number;
    date: string;
}

export interface CurrencyRateProvider {
    getRate(base: string, quote: string): Promise<CurrencyRate>;
}
