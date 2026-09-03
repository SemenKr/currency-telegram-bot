import 'dotenv/config';

import { FrankfurterCurrencyRateProvider } from '../adapters/currency/frankfurter-currency-rate-provider.js';
import { TelegramBotApiMessageSender } from '../adapters/telegram/telegram-bot-api-message-sender.js';
import { buildApp } from '../app.js';
import { loadConfig } from './config/env.js';

export const createProductionApp = () => {
    const config = loadConfig();

    // Composition root — единственное место, где конкретные
    // внешние адаптеры соединяются с приложением.
    const currencyRateProvider =
        new FrankfurterCurrencyRateProvider();

    const botMessageSender = new TelegramBotApiMessageSender(
        config.telegramBotToken,
    );

    return buildApp({
        currencyRateProvider,
        botMessageSender,
        telegramWebhookSecret: config.telegramWebhookSecret,
    });
};
