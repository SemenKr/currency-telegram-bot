import type { FastifyInstance } from 'fastify';

import type { GetCurrencyRate } from '../../../application/use-cases/get-currency-rate.js';

interface CurrencyRateParams {
    currency: string;
}

export const registerCurrencyRateRoute = (
    app: FastifyInstance,
    getCurrencyRate: GetCurrencyRate,
): void => {
    app.get<{ Params: CurrencyRateParams }>(
        '/rates/:currency',
        {
            schema: {
                params: {
                    type: 'object',
                    required: ['currency'],
                    additionalProperties: false,
                    properties: {
                        currency: {
                            type: 'string',
                            pattern: '^[A-Za-z]{3}$',
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            try {
                return await getCurrencyRate.execute(request.params.currency);
            } catch (error) {
                app.log.error(error);

                return reply.code(502).send({
                    error: 'Currency rate service is unavailable',
                });
            }
        },
    );
};
