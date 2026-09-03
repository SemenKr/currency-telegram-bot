import { describe, expect, it, vi } from 'vitest';

import type { BotMessageSender } from '../../domain/ports/bot-message-sender.js';
import type { CurrencyRateProvider } from '../../domain/ports/currency-rate-provider.js';
import { GetCurrencyRate } from './get-currency-rate.js';
import { HandleBotMessage } from './handle-bot-message.js';
import { ProcessCurrencyMessage } from './process-currency-message.js';

describe('HandleBotMessage', () => {
    it('sends a formatted currency rate', async () => {
        const getRate = vi
            .fn<CurrencyRateProvider['getRate']>()
            .mockResolvedValue({
                base: 'EUR',
                quote: 'USD',
                rate: 1.1578,
                date: '2026-09-02',
            });

        const sendMessage = vi
            .fn<BotMessageSender['sendMessage']>()
            .mockResolvedValue(undefined);

        const provider: CurrencyRateProvider = {
            getRate,
        };

        const messageSender: BotMessageSender = {
            sendMessage,
        };

        const getCurrencyRate = new GetCurrencyRate(provider);
        const processCurrencyMessage = new ProcessCurrencyMessage(
            getCurrencyRate,
        );
        const handleBotMessage = new HandleBotMessage(
            processCurrencyMessage,
            messageSender,
        );

        await handleBotMessage.execute(
            123456,
            'Какой сегодня курс eur?',
        );

        expect(sendMessage).toHaveBeenCalledWith(
            123456,
            '1 EUR = 1.1578 USD\nКурс на 2026-09-02',
        );
    });

    it('sends a hint when the currency code is absent', async () => {
        const getRate = vi
            .fn<CurrencyRateProvider['getRate']>()
            .mockResolvedValue({
                base: 'EUR',
                quote: 'USD',
                rate: 1.1578,
                date: '2026-09-02',
            });

        const sendMessage = vi
            .fn<BotMessageSender['sendMessage']>()
            .mockResolvedValue(undefined);

        const provider: CurrencyRateProvider = {
            getRate,
        };

        const messageSender: BotMessageSender = {
            sendMessage,
        };

        const getCurrencyRate = new GetCurrencyRate(provider);
        const processCurrencyMessage = new ProcessCurrencyMessage(
            getCurrencyRate,
        );
        const handleBotMessage = new HandleBotMessage(
            processCurrencyMessage,
            messageSender,
        );

        await handleBotMessage.execute(
            123456,
            'Расскажи мне о валютах',
        );

        expect(sendMessage).toHaveBeenCalledWith(
            123456,
            'Не удалось найти код валюты. Укажите трёхбуквенный код, например EUR, GBP или JPY.',
        );

        expect(getRate).not.toHaveBeenCalled();
    });

    it('sends a fallback message when the rate provider fails', async () => {
        const getRate = vi
            .fn<CurrencyRateProvider['getRate']>()
            .mockRejectedValue(new Error('Frankfurter is unavailable'));

        const sendMessage = vi
            .fn<BotMessageSender['sendMessage']>()
            .mockResolvedValue(undefined);

        const provider: CurrencyRateProvider = {
            getRate,
        };

        const messageSender: BotMessageSender = {
            sendMessage,
        };

        const getCurrencyRate = new GetCurrencyRate(provider);
        const processCurrencyMessage = new ProcessCurrencyMessage(
            getCurrencyRate,
        );
        const handleBotMessage = new HandleBotMessage(
            processCurrencyMessage,
            messageSender,
        );

        await handleBotMessage.execute(123456, 'Курс EUR');

        expect(sendMessage).toHaveBeenCalledWith(
            123456,
            'Не удалось получить курс валюты. Попробуйте ещё раз позже.',
        );
    });
});
