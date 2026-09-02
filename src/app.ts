import Fastify, { type FastifyInstance } from 'fastify';

export const buildApp = (): FastifyInstance => {
    const app = Fastify({
        logger: true,
    });

    app.get('/health', async () => {
        return {
            status: 'ok',
        };
    });

    app.get('/', async () => {
        return {
            name: 'Currency Telegram Bot',
            status: 'running',
        };
    });

    return app;
};
