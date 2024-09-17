import { Country } from '$db';
import { recordExists, resetDatabase, truncateTables } from '$lib/server/queries';
import { db } from '$lib/server/services';
import { describe, beforeAll, expect, test, beforeEach } from 'bun:test';
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

beforeAll(async () => {
  await resetDatabase();
  await migrate(db, { migrationsFolder: `${process.cwd()}/migrations` });
});

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

    test('Record doesn\'t exists', async () => {
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
