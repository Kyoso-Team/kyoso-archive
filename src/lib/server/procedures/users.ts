import * as v from 'valibot';
import env from '../env';
import { Ban, db, Session, User } from '$db';
import { and, eq, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { t } from '$trpc';
import { future, pick, trpcUnknownError } from '$lib/server/utils';
import { customAlphabet } from 'nanoid';
import { wrap } from '@typeschema/valibot';
import { positiveIntSchema } from '$lib/schemas';
import { getSession } from '../helpers/api';
import { TRPCError } from '@trpc/server';

const updateSelf = t.procedure.mutation(async ({ ctx }) => {
  const session = getSession(ctx.cookies, true);

  let user!: Pick<typeof User.$inferSelect, 'apiKey'>;

  try {
    user = await db
      .update(User)
      .set({
        apiKey: customAlphabet(
          '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
          24
        )()
      })
      .where(eq(User.id, session.userId))
      .returning(pick(User, ['apiKey']))
      .then((rows) => rows[0]);
  } catch (err) {
    throw trpcUnknownError(err, 'Updating the user');
  }

  return user;
});

const updateUser = t.procedure
  .input(
    wrap(
      v.object({
        userId: positiveIntSchema,
        data: v.partial(
          v.object({
            admin: v.boolean(),
            approvedHost: v.boolean()
          })
        )
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { data, userId } = input;
    const { admin, approvedHost } = data;
    const session = getSession(ctx.cookies, true);

    if (admin !== undefined && session.userId !== env.OWNER) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You do not have the required permissions to remove or add this user as an admin'
      });
    }

    if (!session.admin) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You do not have the required permissions update this user'
      });
    }

    if (Object.keys(data).length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Nothing to update'
      });
    }

    try {
      await db
        .update(User)
        .set({
          admin,
          approvedHost
        })
        .where(eq(User.id, userId));
    } catch (err) {
      throw trpcUnknownError(err, 'Updating the user');
    }
  });

const banUser = t.procedure
  .input(
    wrap(
      v.object({
        banReason: v.string([v.minLength(1)]),
        issuedToUserId: positiveIntSchema,
        /** In milliseconds. If undefined, the ban is permanent */
        banTime: v.optional(positiveIntSchema)
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { banReason, banTime, issuedToUserId } = input;
    const session = getSession(ctx.cookies, true);

    if (!session.admin) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You do not have the required permissions to ban this user'
      });
    }

    let hasActiveBan!: boolean;

    try {
      hasActiveBan = await db.execute(sql`
        select exists (
          select 1 from ${Ban}
          where ${and(
            eq(Ban.issuedToUserId, issuedToUserId),
            or(
              isNull(Ban.liftAt),
              and(isNotNull(Ban.liftAt), future(Ban.liftAt)),
              and(isNotNull(Ban.revokedAt), future(Ban.revokedAt))
            )
          )}
          limit 1
        )
      `).then((bans) => !!bans[0]?.exists);
    } catch (err) {
      throw trpcUnknownError(err, 'Verifying the user\'s ban status');
    }

    if (hasActiveBan) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'User is already banned'
      });
    }

    const liftAt = banTime ? new Date(new Date().getTime() + banTime) : undefined;

    try {
      await db
        .insert(Ban)
        .values({
          banReason,
          issuedToUserId,
          liftAt,
          issuedByUserId: session.userId
        });
    } catch (err) {
      throw trpcUnknownError(err, 'Updating the user');
    }
  });

const revokeBan = t.procedure
  .input(
    wrap(
      v.object({
        banId: positiveIntSchema,
        revokeReason: v.string([v.minLength(1)])
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { banId, revokeReason } = input;
    const session = getSession(ctx.cookies, true);

    if (!session.admin) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You do not have the required permissions to revoke this ban'
      });
    }

    try {
      await db
        .update(Ban)
        .set({
          revokeReason,
          revokedAt: sql`now()`,
          revokedByUserId: session.userId
        })
        .where(eq(Ban.id, banId));
    } catch (err) {
      throw trpcUnknownError(err, 'Revoking the ban');
    }
  });

const expireSession = t.procedure
  .input(
    wrap(
      v.object({
        sessionId: positiveIntSchema
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    getSession(ctx.cookies, true);

    try {
      await db
        .update(Session)
        .set({
          expired: true
        })
        .where(eq(Session.id, input.sessionId));
    } catch (err) {
      throw trpcUnknownError(err, 'Expiring the session');
    }
  });

export const usersRouter = t.router({
  updateSelf,
  updateUser,
  banUser,
  revokeBan,
  expireSession
});
