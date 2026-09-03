import type { BotMessageSender } from '../../domain/ports/bot-message-sender.js';
import { UnsupportedCurrencyError } from '../../domain/errors/unsupported-currency-error.js';
import { ProcessCurrencyMessage } from './process-currency-message.js';

const startMessage = [
    'Привет! Я показываю курс валюты относительно доллара США.',
    '',
    'Отправьте трёхбуквенный код валюты, например EUR, GBP или JPY.',
].join('\n');

const helpMessage = [
    'Отправьте код валюты или сообщение, содержащее код.',
    '',
    'Примеры:',
    'EUR',
    'Какой курс GBP?',
    'Покажи курс JPY к доллару',
    '',
    'Курс является справочным.',
].join('\n');

const currencyCodeNotFoundMessage =
    'Не удалось найти код валюты. Укажите трёхбуквенный код, например EUR, GBP или JPY.';

const currencyRateUnavailableMessage =
    'Не удалось получить курс валюты. Проверьте код или попробуйте ещё раз позже.';

const extractCommand = (text: string): string | null => {
    const firstToken = text.trim().split(/\s+/)[0];

    if (firstToken === undefined || !firstToken.startsWith('/')) {
        return null;
    }

    // В группах Telegram может прислать команду с username:
    // /start@krekotun_currency_bot
    return firstToken.split('@')[0]?.toLowerCase() ?? null;
};

export class HandleBotMessage {
    constructor(
        private readonly processCurrencyMessage: ProcessCurrencyMessage,
        private readonly messageSender: BotMessageSender,
    ) {}

    async execute(chatId: number, text: string): Promise<void> {
        const command = extractCommand(text);

        if (command === '/start') {
            await this.messageSender.sendMessage(chatId, startMessage);
            return;
        }

        if (command === '/help') {
            await this.messageSender.sendMessage(chatId, helpMessage);
            return;
        }

        let responseText: string;

        try {
            const result = await this.processCurrencyMessage.execute(text);

            if (result.type === 'currency-code-not-found') {
                responseText = currencyCodeNotFoundMessage;
            } else {
                const { base, quote, rate, date } = result.rate;
                const dateText = date === undefined
                    ? ''
                    : `\nКурс на ${date}`;

                responseText = `1 ${base} = ${rate} ${quote}${dateText}`;
            }
        } catch (error) {
            if (error instanceof UnsupportedCurrencyError) {
                responseText = `Код валюты ${error.currencyCode} не поддерживается. Пример: EUR, GBP или JPY.`;
            } else {
                responseText = currencyRateUnavailableMessage;
            }
        }

        // Ошибка отправки должна подняться до транспортного слоя:
        // повторная попытка через тот же sender здесь не поможет.
        await this.messageSender.sendMessage(chatId, responseText);
    }
}
