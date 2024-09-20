import { beforeEach, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { Country } from '$db';
import { recordExists, truncateTables } from '$lib/server/queries';
import { db } from '$lib/server/services';

describe('Abstracted SQL/Drizzle queries', () => {
  describe('recordExists', () => {
    beforeEach(async () => {
      await truncateTables(Country);
    });

    test('Record exists', async () => {
      await db.insert(Country).values({
        name: 'United States',
        code: 'US'
      });

      const exists = await recordExists(Country, eq(Country.code, 'US'));
      expect(exists).toBe(true);
    });

    test("Record doesn't exists", async () => {
      const exists = await recordExists(Country, eq(Country.code, 'US'));
      expect(exists).toBe(false);
    });
  });

  describe.skip('getCount', () => {
    // TODO
  });

  describe.skip('setSimilarityThreshold', () => {
    // TODO
  });

  describe.skip('getUserStaffHistory', () => {
    // TODO
  });

  describe.skip('getUserPlayerHistory', () => {
    // TODO
  });
});
