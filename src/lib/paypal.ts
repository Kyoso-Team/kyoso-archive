import env from '$lib/env/server';
import { core } from '@paypal/checkout-server-sdk';

const PaypalEnvironment =
  env.NODE_ENV === 'production' ? core.LiveEnvironment : core.SandboxEnvironment;
const environment = new PaypalEnvironment(env.PUBLIC_PAYPAL_CLIENT_ID, env.PAYPAL_CLIENT_SECRET);
const paypal = new core.PayPalHttpClient(environment);

export default paypal;

export function money(amount: number) {
  return {
    currency_code: 'USD',
    value: amount.toString()
  };
}
