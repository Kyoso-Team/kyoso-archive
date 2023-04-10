import { writable } from 'svelte/store';
import type { PayPalNamespace } from '@paypal/paypal-js';

export const paypal = writable<PayPalNamespace | null>(null);
