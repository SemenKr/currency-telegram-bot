import "@supabase/functions-js/edge-runtime.d.ts";

import { createTelegramWebhookHandler } from "./handler.ts";

const telegramWebhookSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");

if (telegramWebhookSecret === undefined || telegramWebhookSecret === "") {
  throw new Error(
    "Missing required environment variable: TELEGRAM_WEBHOOK_SECRET",
  );
}

export default {
  fetch: createTelegramWebhookHandler(
    telegramWebhookSecret,
    async () => {},
  ),
};
