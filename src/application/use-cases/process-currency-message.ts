import { extractCurrencyCode } from '../../domain/services/extract-currency-code.js';
import {
    GetCurrencyRate,
    type GetCurrencyRateResult,
} from './get-currency-rate.js';

export type ProcessCurrencyMessageResult =
    | {
    type: 'rate-found';
    rate: GetCurrencyRateResult;
}
    | {
    type: 'currency-code-not-found';
};

export class ProcessCurrencyMessage {
    constructor(private readonly getCurrencyRate: GetCurrencyRate) {}

    async execute(text: string): Promise<ProcessCurrencyMessageResult> {
        const currencyCode = extractCurrencyCode(text);

        if (currencyCode === null) {
            return {
                type: 'currency-code-not-found',
            };
        }

        const rate = await this.getCurrencyRate.execute(currencyCode);

        return {
            type: 'rate-found',
            rate,
        };
    }
}
