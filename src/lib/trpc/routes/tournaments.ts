import stripe from '$lib/stripe';
import { t, tryCatch } from '$trpc';
import { getStoredUser } from '$trpc/middleware';
import { redirect } from '@sveltejs/kit';
import { z } from 'zod';

const services = new Map([
  ['Admin', 250],
  ['Mappooling', 250],
  ['Referee', 250],
  ['Stats', 250],
  ['Pickems', 250]
]);

export const tournamentRouter = t.router({
  checkout: t.procedure
    .use(getStoredUser)
    .input(
      z.object({
        name: z.string(),
        acronym: z.string(),
        rankRange: z.union([
          z.literal('open rank'),
          z.object({
            lower: z.number().optional(),
            upper: z.number().optional()
          })
        ]),
        useBWS: z.boolean(),
        services: z.array(z.enum(['Admin', 'Mappooling', 'Referee', 'Stats', 'Pickems'])).min(1)
      })
    )
    .mutation(async ({ input }) => {
      let session = await tryCatch(async () => {
        return await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          success_url: import.meta.url,
          line_items: input.services.map((serviceName) => {
            let service = services.get(serviceName) as number;

            return {
              quantity: 1,
              price_data: {
                currency: 'usd',
                unit_amount: service,
                product_data: {
                  name: serviceName
                }
              }
            };
          })
        });
      }, 'Unable to create Stripe checkout session while creating the tournament');

      throw redirect(302, session.url || '/');
    })
});
