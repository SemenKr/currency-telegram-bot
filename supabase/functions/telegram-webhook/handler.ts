const jsonHeaders = {
  "Content-Type": "application/json",
};

const STUDENT_ID = 5966;
const telegramSecretHeader = "X-Telegram-Bot-Api-Secret-Token";

export const createTelegramWebhookHandler = (expectedSecret: string) => {
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

    return Response.json(
      {
        status: "ok",
        runtime: "supabase-edge",
        studentId: STUDENT_ID,
      },
      {
        status: 200,
        headers: jsonHeaders,
      },
    );
  };
};
