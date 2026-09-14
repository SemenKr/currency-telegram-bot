import { telegramUpdateSchema } from "../_shared/adapters/http/telegram-update-schema.ts";

const jsonHeaders = {
  "Content-Type": "application/json",
};

const STUDENT_ID = 5966;
const telegramSecretHeader = "X-Telegram-Bot-Api-Secret-Token";

export type BotMessageCallback = (
  chatId: number,
  text: string,
) => Promise<void>;

export const createTelegramWebhookHandler = (
  expectedSecret: string,
  handleBotMessage: BotMessageCallback,
) => {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") {
      return Response.json(
        { error: "Method Not Allowed" },
        {
          status: 405,
          headers: {
            ...jsonHeaders,
            Allow: "POST",
          },
        },
      );
    }

    const providedSecret = request.headers.get(telegramSecretHeader);

    if (providedSecret !== expectedSecret) {
      return Response.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: jsonHeaders,
        },
      );
    }

    let update: unknown;

    try {
      update = await request.json();
    } catch {
      return Response.json(
        { error: "Invalid Telegram update" },
        { status: 400, headers: jsonHeaders },
      );
    }

    const parsedUpdate = telegramUpdateSchema.safeParse(update);

    if (!parsedUpdate.success) {
      return Response.json(
        { error: "Invalid Telegram update" },
        { status: 400, headers: jsonHeaders },
      );
    }

    const message = parsedUpdate.data.message;

    if (message?.text !== undefined) {
      try {
        await handleBotMessage(message.chat.id, message.text);
      } catch {
        return Response.json(
          { ok: false },
          { status: 500, headers: jsonHeaders },
        );
      }
    }

    return Response.json(
      { ok: true, studentId: STUDENT_ID },
      { status: 200, headers: jsonHeaders },
    );
  };
};
