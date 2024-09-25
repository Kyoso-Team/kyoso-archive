import { describe, expect, test } from 'bun:test';
import { formatNumber } from '$lib/format';

describe('Formatting functions', () => {
  test('formatNumber', () => {
    const a = formatNumber(100);
    const b = formatNumber(3902901);
    const c = formatNumber(2500.1235, 2);

    expect([a, b, c]).toEqual(['100', '3,902,901', '2,500.12']);
  });

  test.todo('formatDate', () => {
    // TODO
  });

  test.todo('formatTime', () => {
    // TODO
  });

  test.todo('formatDigits', () => {
    // TODO
  });

  test.todo('fillDateDigits', () => {});

  test.todo('dateToHtmlInput', () => {});
});
