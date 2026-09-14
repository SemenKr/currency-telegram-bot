import Fastify, { type FastifyInstance } from 'fastify';

import { registerCurrencyRateRoute } from './adapters/http/routes/currency-rate-route.js';
import { registerTelegramWebhookRoute } from './adapters/http/routes/telegram-webhook-route.js';
import { GetCurrencyRate } from '../supabase/functions/_shared/application/use-cases/get-currency-rate.ts';
import { HandleBotMessage } from '../supabase/functions/_shared/application/use-cases/handle-bot-message.ts';
import { ProcessCurrencyMessage } from '../supabase/functions/_shared/application/use-cases/process-currency-message.ts';
import type { BotMessageSender } from '../supabase/functions/_shared/domain/ports/bot-message-sender.ts';
import type { CurrencyRateProvider } from '../supabase/functions/_shared/domain/ports/currency-rate-provider.ts';

interface BuildAppOptions {
    currencyRateProvider: CurrencyRateProvider;
    botMessageSender: BotMessageSender;
    telegramWebhookSecret: string;
}

export const buildApp = (
    options: BuildAppOptions,
    app: FastifyInstance = Fastify({
        logger: true,
    }),
): FastifyInstance => {
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
