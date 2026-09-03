import { describe, expect, it, vi } from 'vitest';

import { TelegramBotApiMessageSender } from './telegram-bot-api-message-sender.js';

describe('TelegramBotApiMessageSender', () => {
    it('sends a text message to a Telegram chat', async () => {
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
            new Response(
                JSON.stringify({
                    ok: true,
                    result: {
                        message_id: 1,
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

        // В тесте используется фиктивный токен:
        // настоящий секрет никогда не должен попадать в исходный код.
        const sender = new TelegramBotApiMessageSender(
            'test-token',
            fetchMock,
        );

        await sender.sendMessage(123456, '1 EUR = 1.1578 USD');

        expect(fetchMock).toHaveBeenCalledOnce();
        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.telegram.org/bottest-token/sendMessage',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: 123456,
                    text: '1 EUR = 1.1578 USD',
                }),
            },
        );
    });

    it('throws when Telegram returns an unsuccessful status', async () => {
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockResolvedValue(new Response(null, { status: 502 }));

        const sender = new TelegramBotApiMessageSender(
            'test-token',
            fetchMock,
        );

        await expect(
            sender.sendMessage(123456, 'Test message'),
        ).rejects.toThrow(
            'Telegram Bot API request failed with status 502',
        );
    });

    it('rejects an empty bot token', () => {
        expect(() => {
            new TelegramBotApiMessageSender('');
        }).toThrow('Telegram bot token is required');
    });
});
