import Fastify, { type FastifyInstance } from 'fastify';

import { registerCurrencyRateRoute } from './adapters/http/routes/currency-rate-route.js';
import { registerTelegramWebhookRoute } from './adapters/http/routes/telegram-webhook-route.js';
import { GetCurrencyRate } from './application/use-cases/get-currency-rate.js';
import { HandleBotMessage } from './application/use-cases/handle-bot-message.js';
import { ProcessCurrencyMessage } from './application/use-cases/process-currency-message.js';
import type { BotMessageSender } from './domain/ports/bot-message-sender.js';
import type { CurrencyRateProvider } from './domain/ports/currency-rate-provider.js';

interface BuildAppOptions {
    currencyRateProvider: CurrencyRateProvider;
    botMessageSender: BotMessageSender;
    telegramWebhookSecret: string;
}

export const buildApp = (
    options: BuildAppOptions,
): FastifyInstance => {
    const app = Fastify({
        logger: true,
    });

    const getCurrencyRate = new GetCurrencyRate(
        options.currencyRateProvider,
    );

    const processCurrencyMessage = new ProcessCurrencyMessage(
        getCurrencyRate,
    );

    const handleBotMessage = new HandleBotMessage(
        processCurrencyMessage,
        options.botMessageSender,
    );

    registerCurrencyRateRoute(app, getCurrencyRate);

    registerTelegramWebhookRoute(
        app,
        handleBotMessage,
        options.telegramWebhookSecret,
    );

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
