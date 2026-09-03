import { describe, expect, it, vi } from 'vitest';

import { UnsupportedCurrencyError } from '../../domain/errors/unsupported-currency-error.js';
import { FrankfurterCurrencyRateProvider } from './frankfurter-currency-rate-provider.js';

describe('FrankfurterCurrencyRateProvider', () => {
    it('requests and maps a currency rate', async () => {
        // Arrange — подготавливаем управляемую замену настоящего fetch.
        // typeof fetch сохраняет сигнатуру стандартной функции fetch.
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
            // Response — встроенный класс Node.js, который обычно возвращает fetch.
            new Response(
                // Имитируем JSON, полученный от Frankfurter API.
                JSON.stringify({
                    amount: 1,
                    base: 'EUR',
                    date: '2026-09-01',
                    rates: {
                        USD: 1.159,
                    },
                }),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            ),
        );

        // Внедряем mock вместо настоящего fetch.
        // Благодаря этому тест не обращается в интернет.
        const provider = new FrankfurterCurrencyRateProvider(fetchMock);

        // Act — запускаем тестируемое действие.
        const result = await provider.getRate('EUR', 'USD');

        // Assert — проверяем преобразование ответа Frankfurter
        // во внутренний формат CurrencyRate.
        expect(result).toEqual({
            base: 'EUR',
            quote: 'USD',
            rate: 1.159,
            date: '2026-09-01',
        });

        // Проверяем, что адаптер сделал ровно один HTTP-запрос.
        expect(fetchMock).toHaveBeenCalledOnce();

        // Первый вызов mock хранится по индексу 0,
        // а его первый аргумент — по следующему индексу 0.
        const requestUrl = fetchMock.mock.calls[0]?.[0];

        // Проверяем адрес и query-параметры запроса.
        expect(requestUrl?.toString()).toBe(
            'https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD',
        );
    });

    it('throws when Frankfurter returns an unsuccessful status', async () => {
        // Arrange — имитируем ситуацию, когда внешний API временно недоступен.
        // У Response со статусом 503 свойство ok будет равно false.
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockResolvedValue(new Response(null, { status: 503 }));

        const provider = new FrankfurterCurrencyRateProvider(fetchMock);

        // Act + Assert — асинхронный метод должен завершиться ошибкой.
        await expect(provider.getRate('EUR', 'USD')).rejects.toThrow(
            'Frankfurter API request failed with status 503',
        );
    });

    it('maps a 404 response to an unsupported currency error', async () => {
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockResolvedValue(new Response(null, { status: 404 }));

        const provider = new FrankfurterCurrencyRateProvider(fetchMock);
        const request = provider.getRate('ZZZ', 'USD');

        await expect(request).rejects.toBeInstanceOf(
            UnsupportedCurrencyError,
        );
        await expect(request).rejects.toMatchObject({
            currencyCode: 'ZZZ',
        });
    });

    it('throws when the requested rate is absent', async () => {
        // Arrange — HTTP-запрос успешен, но нужного курса в JSON нет.
        // Это отличается от предыдущего теста: response.ok здесь будет true.
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
            new Response(
                JSON.stringify({
                    amount: 1,
                    base: 'EUR',
                    date: '2026-09-01',

                    // Frankfurter не вернул USD.
                    rates: {},
                }),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            ),
        );

        const provider = new FrankfurterCurrencyRateProvider(fetchMock);

        // Адаптер должен проверить не только HTTP-статус,
        // но и наличие запрошенного курса в данных.
        await expect(provider.getRate('EUR', 'USD')).rejects.toMatchObject(
            {
                name: 'UnsupportedCurrencyError',
                currencyCode: 'USD',
            },
        );
    });
    it('throws when Frankfurter returns invalid data', async () => {
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
            new Response(
                JSON.stringify({
                    amount: 1,
                    base: 'EUR',
                    date: '2026-09-01',

                    // Внешний сервис нарушил контракт:
                    // rates должен быть объектом, а не null.
                    rates: null,
                }),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            ),
        );

        const provider = new FrankfurterCurrencyRateProvider(fetchMock);

        // Адаптер не должен передавать повреждённые внешние данные
        // во внутренние слои приложения.
        await expect(provider.getRate('EUR', 'USD')).rejects.toThrow(
            'Frankfurter API returned invalid data',
        );
    });
});
