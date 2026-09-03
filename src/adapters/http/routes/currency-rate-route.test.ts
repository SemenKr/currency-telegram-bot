import Fastify from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import { GetCurrencyRate } from '../../../application/use-cases/get-currency-rate.js';
import type { CurrencyRateProvider } from '../../../domain/ports/currency-rate-provider.js';
import { registerCurrencyRateRoute } from './currency-rate-route.js';

describe('currency rate route', () => {
    it('returns a currency rate', async () => {
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
        const app = Fastify();

        registerCurrencyRateRoute(app, getCurrencyRate);

        // app.inject имитирует HTTP-запрос внутри процесса:
        // настоящий порт и сетевое соединение не создаются.
        const response = await app.inject({
            method: 'GET',
            url: '/rates/eur',
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            base: 'EUR',
            quote: 'USD',
            rate: 1.1578,
            date: '2026-09-02',
        });

        // Проверяем границу между HTTP-адаптером и use case:
        // маршрут передал ввод, а use case нормализовал валюту.
        expect(getRate).toHaveBeenCalledWith('EUR', 'USD');

        await app.close();
    });

    it('rejects a currency code with an invalid format', async () => {
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
        const app = Fastify();

        registerCurrencyRateRoute(app, getCurrencyRate);

        const response = await app.inject({
            method: 'GET',
            url: '/rates/euro',
        });

        expect(response.statusCode).toBe(400);

        // Fastify отклоняет URL по схеме до запуска use case,
        // поэтому внешний провайдер не должен вызываться.
        expect(getRate).not.toHaveBeenCalled();

        await app.close();
    });

    it('returns 502 when the currency provider fails', async () => {
        const getRate = vi
            .fn<CurrencyRateProvider['getRate']>()
            .mockRejectedValue(new Error('Frankfurter is unavailable'));

        const provider: CurrencyRateProvider = {
            getRate,
        };

        const getCurrencyRate = new GetCurrencyRate(provider);
        const app = Fastify();

        registerCurrencyRateRoute(app, getCurrencyRate);

        const response = await app.inject({
            method: 'GET',
            url: '/rates/eur',
        });

        expect(response.statusCode).toBe(502);
        expect(response.json()).toEqual({
            error: 'Currency rate service is unavailable',
        });

        await app.close();
    });
});
