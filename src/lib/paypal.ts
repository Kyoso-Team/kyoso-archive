import env from '$lib/env/server';
import paypal from '@paypal/checkout-server-sdk';

const PaypalEnvironment =
  env.NODE_ENV === 'production' ? paypal.core.LiveEnvironment : paypal.core.SandboxEnvironment;
const environment = new PaypalEnvironment(env.PUBLIC_PAYPAL_CLIENT_ID, env.PAYPAL_CLIENT_SECRET);
const paypalClient = new paypal.core.PayPalHttpClient(environment);

export default paypalClient;

export function money(amount: number) {
  return {
    currency_code: 'USD',
    value: amount.toString()
  };
}
