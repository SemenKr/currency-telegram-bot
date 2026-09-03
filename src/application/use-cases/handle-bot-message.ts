import type { BotMessageSender } from '../../domain/ports/bot-message-sender.js';
import { ProcessCurrencyMessage } from './process-currency-message.js';

const currencyCodeNotFoundMessage =
    'Не удалось найти код валюты. Укажите трёхбуквенный код, например EUR, GBP или JPY.';

const currencyRateUnavailableMessage =
    'Не удалось получить курс валюты. Попробуйте ещё раз позже.';

export class HandleBotMessage {
    constructor(
        private readonly processCurrencyMessage: ProcessCurrencyMessage,
        private readonly messageSender: BotMessageSender,
    ) {}

    async execute(chatId: number, text: string): Promise<void> {
        let responseText: string;

        try {
            const result = await this.processCurrencyMessage.execute(text);

            if (result.type === 'currency-code-not-found') {
                responseText = currencyCodeNotFoundMessage;
            } else {
                const { base, quote, rate, date } = result.rate;

                responseText = `1 ${base} = ${rate} ${quote}\nКурс на ${date}`;
            }
        } catch {
            responseText = currencyRateUnavailableMessage;
        }

        // Отправка находится за пределами try/catch:
        // ошибка самого message sender не должна запускать повторную отправку.
        await this.messageSender.sendMessage(chatId, responseText);
    }
}
