import '@supabase/functions-js/edge-runtime.d.ts';

import { FrankfurterCurrencyRateProvider } from "../_shared/adapters/currency/frankfurter-currency-rate-provider.ts";
import { TelegramBotApiMessageSender } from "../_shared/adapters/telegram/telegram-bot-api-message-sender.ts";
import { createBotMessageHandler } from "../_shared/composition/create-bot-message-handler.ts";
import { createTelegramWebhookHandler } from "./handler.ts";

const getRequiredEnvironmentVariable = (name: string): string => {
  const value = Deno.env.get(name);

  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const telegramWebhookSecret = getRequiredEnvironmentVariable(
  "TELEGRAM_WEBHOOK_SECRET",
);
const telegramBotToken = getRequiredEnvironmentVariable("TELEGRAM_BOT_TOKEN");

const currencyRateProvider = new FrankfurterCurrencyRateProvider(fetch);
const botMessageSender = new TelegramBotApiMessageSender(
  telegramBotToken,
  fetch,
);
const botMessageHandler = createBotMessageHandler(
  currencyRateProvider,
  botMessageSender,
);

export default {
  fetch: createTelegramWebhookHandler(
    telegramWebhookSecret,
    (chatId, text) => botMessageHandler.execute(chatId, text),
  ),
};
