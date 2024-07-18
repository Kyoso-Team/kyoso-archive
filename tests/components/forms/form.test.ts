import '$tests/utils/polyfill';
import '$tests/utils/mock';
import AllFields from './AllFields.svelte';
import userEvent from '@testing-library/user-event';
import { cleanup, render, screen } from '@testing-library/svelte';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Form components and store', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    const raf = (fn: (date: Date) => void) => setTimeout(() => fn(new Date()), 16);
    vi.stubGlobal('requestAnimationFrame', raf);
  });

  describe('All fields', () => {
    beforeAll(() => {
      render(AllFields);
    });

    afterAll(() => {
      cleanup();
    });

    describe('Text field', () => {
      const input = () => screen.getByLabelText('input-text');
      const value = () => screen.getByLabelText('value-text');
      const error = () => screen.queryByLabelText('error-text');

      afterEach(async () => {
        await user.clear(input());
      });

      it('Sets null as the default value', () => {
        expect(value()).toHaveTextContent('null');
      });

      it('Clears the input and sets the value to null', async () => {
        expect(value()).toHaveTextContent('null');
      });

      it('Types a valid value', async () => {
        await user.type(input(), 'abc');
        expect(value()).toHaveTextContent('abc');
      });

      it('Types a valid value and doesn\'t display an error', async () => {
        await user.type(input(), 'abc');
        expect(error()).not.toBeInTheDocument();
      });

      it('Types an invalid value and displays an error', async () => {
        await user.type(input(), 'too long');
        expect(error()).toBeInTheDocument();
      });
    });
  });
});
