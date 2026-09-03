import { describe, expect, it, vi } from 'vitest';

import { UnsupportedCurrencyError } from '../../domain/errors/unsupported-currency-error.js';
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

    it('sends an identical USD rate without a date', async () => {
        const getRate = vi
            .fn<CurrencyRateProvider['getRate']>();

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

        await handleBotMessage.execute(123456, 'USD');

        expect(sendMessage).toHaveBeenCalledWith(
            123456,
            '1 USD = 1 USD',
        );

        expect(getRate).not.toHaveBeenCalled();
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
            'Не удалось получить курс валюты. Проверьте код или попробуйте ещё раз позже.',
        );
    });

    it('sends a specific message for an unsupported currency', async () => {
        const getRate = vi
            .fn<CurrencyRateProvider['getRate']>()
            .mockRejectedValue(new UnsupportedCurrencyError('ZZZ'));

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

        await handleBotMessage.execute(123456, 'ZZZ');

        expect(sendMessage).toHaveBeenCalledWith(
            123456,
            'Код валюты ZZZ не поддерживается. Пример: EUR, GBP или JPY.',
        );
    });

    it('sends a welcome message for the start command', async () => {
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
            '/start@krekotun_currency_bot',
        );

        expect(sendMessage).toHaveBeenCalledWith(
            123456,
            [
                'Привет! Я показываю курс валюты относительно доллара США.',
                '',
                'Отправьте трёхбуквенный код валюты, например EUR, GBP или JPY.',
            ].join('\n'),
        );

        expect(getRate).not.toHaveBeenCalled();
    });
    it('sends usage instructions for the help command', async () => {
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

        await handleBotMessage.execute(123456, '/help');

        expect(sendMessage).toHaveBeenCalledWith(
            123456,
            [
                'Отправьте код валюты или сообщение, содержащее код.',
                '',
                'Примеры:',
                'EUR',
                'Какой курс GBP?',
                'Покажи курс JPY к доллару',
                '',
                'Курс является справочным.',
            ].join('\n'),
        );

        expect(getRate).not.toHaveBeenCalled();
    });
});
