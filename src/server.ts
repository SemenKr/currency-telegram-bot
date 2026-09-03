import Fastify from 'fastify';

import { createProductionApp } from './infrastructure/create-production-app.js';

const app = createProductionApp(
    Fastify({
        logger: true,
    }),
);

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

app.listen(
    {
        port,
        host,
    },
    (error) => {
        if (error) {
            app.log.error(error);

            // Не завершаем процесс немедленно: это позволяет логгеру
            // записать причину сбоя в serverless-окружении.
            process.exitCode = 1;
        }
    },
);
