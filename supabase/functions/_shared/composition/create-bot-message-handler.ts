import { GetCurrencyRate } from '../application/use-cases/get-currency-rate.ts';
import { HandleBotMessage } from '../application/use-cases/handle-bot-message.ts';
import { ProcessCurrencyMessage } from '../application/use-cases/process-currency-message.ts';
import type { BotMessageSender } from '../domain/ports/bot-message-sender.ts';
import type { CurrencyRateProvider } from '../domain/ports/currency-rate-provider.ts';

export const createBotMessageHandler = (
    currencyRateProvider: CurrencyRateProvider,
    botMessageSender: BotMessageSender,
): HandleBotMessage => {
    const getCurrencyRate = new GetCurrencyRate(currencyRateProvider);
    const processCurrencyMessage = new ProcessCurrencyMessage(
        getCurrencyRate,
    );

    return new HandleBotMessage(
        processCurrencyMessage,
        botMessageSender,
    );
};
