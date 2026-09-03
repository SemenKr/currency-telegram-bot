import { describe, expect, it } from 'vitest';

import { loadConfig } from './env.js';

describe('loadConfig', () => {
    it('returns validated application configuration', () => {
        const result = loadConfig({
            TELEGRAM_BOT_TOKEN: 'test-bot-token',
            TELEGRAM_WEBHOOK_SECRET: 'a'.repeat(32),
        });

        expect(result).toEqual({
            telegramBotToken: 'test-bot-token',
            telegramWebhookSecret: 'a'.repeat(32),
        });
    });

    it('rejects a missing Telegram bot token', () => {
        expect(() =>
            loadConfig({
                TELEGRAM_WEBHOOK_SECRET: 'a'.repeat(32),
            }),
        ).toThrow(
            'Invalid environment configuration: TELEGRAM_BOT_TOKEN',
        );
    });

    it('rejects an invalid webhook secret', () => {
        expect(() =>
            loadConfig({
                TELEGRAM_BOT_TOKEN: 'test-bot-token',

                // Длина допустимая, но символ ! запрещён Telegram.
                TELEGRAM_WEBHOOK_SECRET: '!'.repeat(32),
            }),
        ).toThrow(
            'Invalid environment configuration: TELEGRAM_WEBHOOK_SECRET',
        );
    });
});
