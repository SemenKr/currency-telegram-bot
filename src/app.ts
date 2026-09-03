import Fastify, { type FastifyInstance } from 'fastify';

import { FrankfurterCurrencyRateProvider } from './adapters/currency/frankfurter-currency-rate-provider.js';
import { registerCurrencyRateRoute } from './adapters/http/routes/currency-rate-route.js';
import { GetCurrencyRate } from './application/use-cases/get-currency-rate.js';
import type { CurrencyRateProvider } from './domain/ports/currency-rate-provider.js';

interface BuildAppOptions {
    currencyRateProvider?: CurrencyRateProvider;
}

export const buildApp = (
    options: BuildAppOptions = {},
): FastifyInstance => {
    const app = Fastify({
        logger: true,
    });

    // Composition root: только на границе приложения мы выбираем
    // конкретную реализацию доменного порта.
    const currencyRateProvider =
        options.currencyRateProvider ?? new FrankfurterCurrencyRateProvider();

    const getCurrencyRate = new GetCurrencyRate(currencyRateProvider);

    registerCurrencyRateRoute(app, getCurrencyRate);

    app.get('/health', async () => {
        return {
            status: 'ok',
        };
    });

    app.get('/', async () => {
        return {
            name: 'Currency Telegram Bot',
            status: 'running',
        };
    });

    return app;
};
