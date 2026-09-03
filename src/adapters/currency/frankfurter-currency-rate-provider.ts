import { z } from 'zod';

import type {
    CurrencyRate,
    CurrencyRateProvider,
} from '../../domain/ports/currency-rate-provider.js';

const frankfurterLatestResponseSchema = z.object({
    amount: z.number(),
    base: z.string().length(3),
    date: z.string(),
    rates: z.record(z.string(), z.number()),
});

export class FrankfurterCurrencyRateProvider
    implements CurrencyRateProvider
{
    private readonly baseUrl = 'https://api.frankfurter.dev/v1';

    // fetch внедряется через конструктор, чтобы адаптер можно было
    // тестировать без реальных сетевых запросов.
    constructor(private readonly fetcher: typeof fetch = fetch) {}

    async getRate(base: string, quote: string): Promise<CurrencyRate> {
        const url = new URL(`${this.baseUrl}/latest`);

        url.searchParams.set('base', base);
        url.searchParams.set('symbols', quote);

        const response = await this.fetcher(url);

        if (!response.ok) {
            throw new Error(
                `Frankfurter API request failed with status ${response.status}`,
            );
        }

        // Ответ внешнего сервиса сначала имеет тип unknown.
        // Граница адаптера не пропускает непроверенные данные в приложение.
        const rawData: unknown = await response.json();
        const parsedData = frankfurterLatestResponseSchema.safeParse(rawData);

        if (!parsedData.success) {
            throw new Error('Frankfurter API returned invalid data');
        }

        const data = parsedData.data;
        const rate = data.rates[quote];

        if (rate === undefined) {
            throw new Error(`Rate ${base}/${quote} was not found`);
        }

        // Адаптер переводит внешний формат Frankfurter
        // во внутреннюю модель приложения.
        return {
            base: data.base,
            quote,
            rate,
            date: data.date,
        };
    }
}
