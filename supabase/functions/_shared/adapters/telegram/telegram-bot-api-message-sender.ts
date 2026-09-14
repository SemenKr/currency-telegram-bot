import { z } from 'zod';

import type {
    BotMessageOptions,
    BotMessageSender,
} from '../../domain/ports/bot-message-sender.ts';

const telegramApiResponseSchema = z.object({
    ok: z.boolean(),
    description: z.string().optional(),
});

export class TelegramBotApiMessageSender implements BotMessageSender {
    private readonly apiBaseUrl: string;

    constructor(
        botToken: string,
        private readonly fetcher: typeof fetch = fetch,
    ) {
        if (botToken.trim() === '') {
            throw new Error('Telegram bot token is required');
        }

        this.apiBaseUrl = `https://api.telegram.org/bot${botToken}`;
    }

    async sendMessage(
        chatId: number,
        text: string,
        options?: BotMessageOptions,
    ): Promise<void> {
        const keyboard = options?.keyboard;

        const response = await this.fetcher(
            `${this.apiBaseUrl}/sendMessage`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text,
                    ...(keyboard === undefined
                        ? {}
                        : {
                            reply_markup: {
                                keyboard: keyboard.rows,
                                resize_keyboard: keyboard.resize,
                                is_persistent: keyboard.persistent,
                                one_time_keyboard: keyboard.oneTime,
                            },
                        }),
                }),
            },
        );

        if (!response.ok) {
            // Не добавляем URL в ошибку: в нём содержится секретный bot token.
            throw new Error(
                `Telegram Bot API request failed with status ${response.status}`,
            );
        }

        const rawData: unknown = await response.json();
        const parsedData = telegramApiResponseSchema.safeParse(rawData);

        if (!parsedData.success || !parsedData.data.ok) {
            throw new Error('Telegram Bot API returned an invalid response');
        }
    }
}
