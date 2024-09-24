import * as v from 'valibot';
import { parseSearchParams, validateCronSecret } from '$lib/server/request';
import { describe, test, expect } from 'bun:test';
import { env } from '$lib/server/env';

describe('API request helper functions', () => {
  describe('parseSearchParams', () => {
    test('Valid', () => {
      const url = new URL('http://localhost:3000?a=some_string&b=21&c=true');

      const data = parseSearchParams('trpc', url, {
        a: v.string(),
        b: v.number(),
        c: v.boolean()
      });

      expect(data).toEqual({ a: 'some_string', b: 21, c: true });
    });

    test('Invalid', () => {
      const url = new URL('http://localhost:3000?a=1');
      
      const promise = new Promise((resolve) => {
        return resolve(
          parseSearchParams('trpc', url, {
            a: v.boolean()
          })
        );
      });

      expect(promise).rejects.toThrowTRPCError('BAD_REQUEST');
    });
  });

  describe.skip('parseRequestBody', () => {
    // TODO
  });

  describe.skip('parseFormData', () => {
    // TODO
  });

  describe('validateCronSecret', () => {
    test('Valid', () => {
      const request = new Request('http://localhost:3000', {
        'headers': {
          'authorization': `Cron ${env.CRON_SECRET}`
        }
      });

      const result = validateCronSecret('trpc', request);
      expect(result).toEqual('success');
    });

    test('Invalid: No authorization header', () => {
      const request = new Request('http://localhost:3000');

      const promise = new Promise((resolve) => {
        return resolve(validateCronSecret('trpc', request));
      });

      expect(promise).rejects.toThrowTRPCError('BAD_REQUEST');
    });

    test('Invalid: Invalid cron secret', () => {
      const request = new Request('http://localhost:3000', {
        'headers': {
          'authorization': 'Cron abc'
        }
      });

      const promise = new Promise((resolve) => {
        return resolve(validateCronSecret('trpc', request));
      });

      expect(promise).rejects.toThrowTRPCError('BAD_REQUEST');
    });
  });
});
