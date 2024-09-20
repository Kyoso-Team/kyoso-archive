import { describe, expect, test } from 'bun:test';
import { formatNumber } from '$lib/format';

describe('Formatting functions', () => {
  test('formatNumber', () => {
    const a = formatNumber(100);
    const b = formatNumber(3902901);
    const c = formatNumber(2500.1235, 2);

    expect([a, b, c]).toEqual(['100', '3,902,901', '2,500.12']);
  });

  test.skip('formatDate', () => {
    // TODO
  });

  test.skip('formatTime', () => {
    // TODO
  });

  test.skip('formatDigits', () => {
    // TODO
  });

  test.skip('fillDateDigits', () => {});

  test.skip('dateToHtmlInput', () => {});
});
