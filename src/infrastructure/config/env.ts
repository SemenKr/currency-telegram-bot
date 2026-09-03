import { z } from 'zod';

const environmentSchema = z.object({
    TELEGRAM_BOT_TOKEN: z.string().min(1),
    TELEGRAM_WEBHOOK_SECRET: z
        .string()
        .min(32)
        .max(256)
        .regex(/^[A-Za-z0-9_-]+$/),
});

export interface AppConfig {
    telegramBotToken: string;
    telegramWebhookSecret: string;
}

export const loadConfig = (
    environment: NodeJS.ProcessEnv = process.env,
): AppConfig => {
    const parsedEnvironment = environmentSchema.safeParse(environment);

    if (!parsedEnvironment.success) {
        // Сообщаем только названия повреждённых переменных.
        // Значения секретов никогда не должны попадать в логи.
        const invalidVariables = parsedEnvironment.error.issues
            .map((issue) => issue.path.join('.'))
            .join(', ');

        throw new Error(
            `Invalid environment configuration: ${invalidVariables}`,
        );
    }

    return {
        telegramBotToken:
        parsedEnvironment.data.TELEGRAM_BOT_TOKEN,
        telegramWebhookSecret:
        parsedEnvironment.data.TELEGRAM_WEBHOOK_SECRET,
    };
};
