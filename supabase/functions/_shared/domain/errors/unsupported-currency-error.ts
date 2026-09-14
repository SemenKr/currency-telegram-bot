export class UnsupportedCurrencyError extends Error {
    readonly currencyCode: string;

    constructor(currencyCode: string) {
        const normalizedCurrencyCode = currencyCode.trim().toUpperCase();

        super(`Currency code ${normalizedCurrencyCode} is not supported`);

        this.name = 'UnsupportedCurrencyError';
        this.currencyCode = normalizedCurrencyCode;
    }
}
