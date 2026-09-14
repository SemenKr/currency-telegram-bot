import 'dotenv/config';

import type { FastifyInstance } from 'fastify';

import { FrankfurterCurrencyRateProvider } from '../../supabase/functions/_shared/adapters/currency/frankfurter-currency-rate-provider.ts';
import { TelegramBotApiMessageSender } from '../../supabase/functions/_shared/adapters/telegram/telegram-bot-api-message-sender.ts';
import { buildApp } from '../build-app.js';
import { loadConfig } from './config/env.js';

export const createProductionApp = (
    app: FastifyInstance,
): FastifyInstance => {
    const config = loadConfig();

    // Composition root — единственное место, где конкретные
    // внешние адаптеры соединяются с приложением.
    const currencyRateProvider =
        new FrankfurterCurrencyRateProvider();

    const botMessageSender = new TelegramBotApiMessageSender(
        config.telegramBotToken,
    );

    return buildApp(
        {
            currencyRateProvider,
            botMessageSender,
            telegramWebhookSecret: config.telegramWebhookSecret,
        },
        app,
    );
};
