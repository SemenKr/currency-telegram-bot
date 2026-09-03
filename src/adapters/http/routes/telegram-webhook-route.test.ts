import Fastify from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import { registerTelegramWebhookRoute } from './telegram-webhook-route.js';

type ExecuteBotMessage = (
    chatId: number,
    text: string,
) => Promise<void>;

const createTestApp = () => {
    const execute = vi
        .fn<ExecuteBotMessage>()
        .mockResolvedValue(undefined);

    const app = Fastify();

    registerTelegramWebhookRoute(
        app,
        { execute },
        'test-webhook-secret',
    );

    return {
        app,
        execute,
    };
};

describe('Telegram webhook route', () => {
    it('handles a valid text message', async () => {
        const { app, execute } = createTestApp();

        const response = await app.inject({
            method: 'POST',
            url: '/telegram/webhook',
            headers: {
                'x-telegram-bot-api-secret-token':
                    'test-webhook-secret',
            },
            payload: {
                update_id: 100,
                message: {
                    message_id: 200,
                    chat: {
                        id: 123456,
                    },
                    text: 'Какой курс EUR?',
                },
            },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            ok: true,
        });

        expect(execute).toHaveBeenCalledWith(
            123456,
            'Какой курс EUR?',
        );

        await app.close();
    });

    it('rejects a request with an invalid secret', async () => {
        const { app, execute } = createTestApp();

        const response = await app.inject({
            method: 'POST',
            url: '/telegram/webhook',
            headers: {
                'x-telegram-bot-api-secret-token': 'wrong-secret',
            },
            payload: {
                update_id: 100,
            },
        });

        expect(response.statusCode).toBe(401);
        expect(execute).not.toHaveBeenCalled();

        await app.close();
    });

    it('rejects an invalid Telegram update', async () => {
        const { app, execute } = createTestApp();

        const response = await app.inject({
            method: 'POST',
            url: '/telegram/webhook',
            headers: {
                'x-telegram-bot-api-secret-token':
                    'test-webhook-secret',
            },
            payload: {
                update_id: 'not-a-number',
            },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual({
            error: 'Invalid Telegram update',
        });
        expect(execute).not.toHaveBeenCalled();

        await app.close();
    });

    it('acknowledges an update without a text message', async () => {
        const { app, execute } = createTestApp();

        const response = await app.inject({
            method: 'POST',
            url: '/telegram/webhook',
            headers: {
                'x-telegram-bot-api-secret-token':
                    'test-webhook-secret',
            },
            payload: {
                update_id: 100,
                message: {
                    message_id: 200,
                    chat: {
                        id: 123456,
                    },
                },
            },
        });

        expect(response.statusCode).toBe(200);
        expect(execute).not.toHaveBeenCalled();

        await app.close();
    });

    it('returns 500 when message handling fails', async () => {
        const execute = vi
            .fn<ExecuteBotMessage>()
            .mockRejectedValue(new Error('Telegram is unavailable'));

        const app = Fastify();

        registerTelegramWebhookRoute(
            app,
            { execute },
            'test-webhook-secret',
        );

        const response = await app.inject({
            method: 'POST',
            url: '/telegram/webhook',
            headers: {
                'x-telegram-bot-api-secret-token':
                    'test-webhook-secret',
            },
            payload: {
                update_id: 100,
                message: {
                    message_id: 200,
                    chat: {
                        id: 123456,
                    },
                    text: 'EUR',
                },
            },
        });

        expect(response.statusCode).toBe(500);
        expect(response.json()).toEqual({
            ok: false,
        });

        await app.close();
    });
});
