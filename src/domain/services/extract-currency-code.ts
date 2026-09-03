const currencyCodePattern =
    /(?<![\p{L}\p{N}])[A-Z]{3}(?![\p{L}\p{N}])/iu;

export const extractCurrencyCode = (text: string): string | null => {
    const match = text.match(currencyCodePattern);

    return match?.[0].toUpperCase() ?? null;
};
