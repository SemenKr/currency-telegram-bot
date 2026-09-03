import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const telegramUpdateSchema = z.object({
    update_id: z.number().int(),
    message: z
        .object({
            message_id: z.number().int(),
            chat: z.object({
                id: z.number().int().safe(),
            }),
            text: z.string().optional(),
        })
        .optional(),
});

interface BotMessageHandler {
    execute(chatId: number, text: string): Promise<void>;
}

export const registerTelegramWebhookRoute = (
    app: FastifyInstance,
    handleBotMessage: BotMessageHandler,
    webhookSecret: string,
): void => {
    app.post('/telegram/webhook', async (request, reply) => {
        const telegramSecret =
            request.headers['x-telegram-bot-api-secret-token'];

        if (telegramSecret !== webhookSecret) {
            return reply.code(401).send({
                error: 'Unauthorized',
            });
        }

        const parsedUpdate = telegramUpdateSchema.safeParse(request.body);

        if (!parsedUpdate.success) {
            return reply.code(400).send({
                error: 'Invalid Telegram update',
            });
        }

        const message = parsedUpdate.data.message;

        // Telegram присылает не только текст: это могут быть фото,
        // реакции и другие типы Update. Их пока просто подтверждаем.
        if (message?.text === undefined) {
            return reply.code(200).send({
                ok: true,
            });
        }

        try {
            await handleBotMessage.execute(message.chat.id, message.text);

            return reply.code(200).send({
                ok: true,
            });
        } catch (error) {
            app.log.error(error);

            return reply.code(500).send({
                ok: false,
            });
        }
    });
};
