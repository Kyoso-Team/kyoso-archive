import { beforeEach, describe, expect, test } from 'bun:test';
import { eq, sql } from 'drizzle-orm';
import { Country, OsuUser } from '$db';
import { getCount, recordExists, setSimilarityThreshold, truncateTables } from '$lib/server/queries';
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

  describe('getCount', () => {
    beforeEach(async () => {
      await truncateTables(OsuUser, Country);

      await db.insert(Country).values({
        code: 'US',
        name: 'United States'
      });

      const token = {
        accesstoken: '',
        refreshToken: '',
        tokenIssuedAt: 0
      };

      await db.insert(OsuUser).values([
        {
          countryCode: 'US',
          username: 'user 1',
          osuUserId: 1,
          restricted: false,
          token
        },
        {
          countryCode: 'US',
          username: 'user 2',
          osuUserId: 2,
          restricted: true,
          token
        },
        {
          countryCode: 'US',
          username: 'user 3',
          osuUserId: 3,
          restricted: false,
          token
        }
      ]);
    });

    test('Basic count', async () => {
      const count = await getCount(OsuUser);
      expect(count).toBe(3);
    });

    test('Count with filter', async () => {
      const count = await getCount(OsuUser, eq(OsuUser.restricted, false));
      expect(count).toBe(2);
    });
  });

  describe('setSimilarityThreshold', () => {
    beforeEach(async () => {
      await setSimilarityThreshold(0.3);
    });

    test('Set threshold: Use default', async () => {
      await setSimilarityThreshold();
      const threshold = await db.execute(sql`show pg_trgm.similarity_threshold;`).then((rows) => Object.values(rows[0])[0]);
      expect(threshold).toBe('0.1');
    });

    test('Set threshold: Provide value', async () => {
      await setSimilarityThreshold(0.7);
      const threshold = await db.execute(sql`show pg_trgm.similarity_threshold;`).then((rows) => Object.values(rows[0])[0]);
      expect(threshold).toBe('0.7');
    });
  });

  describe.todo('getUserStaffHistory', () => {
    // TODO
  });

  describe.todo('getUserPlayerHistory', () => {
    // TODO
  });
});
