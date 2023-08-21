import db from '$db';
import { dbStaffRole } from '$db/schema';
import { eq, and, sql, gt } from 'drizzle-orm';
import { z } from 'zod';
import { t, tryCatch } from '$trpc';
import { getUserAsStaff } from '$trpc/middleware';
import { whereIdSchema, withTournamentSchema } from '$lib/schemas';
import { forbidIf, isAllowed, getRowCount } from '$lib/server-utils';
import { hasPerms } from '$lib/utils';
import { swapOrder } from '$trpc/helpers';

const staffRoleMutationSchema = z.object({
  name: z.string().max(25),
  color: z.union([
    z.literal('slate'),
    z.literal('gray'),
    z.literal('red'),
    z.literal('orange'),
    z.literal('yellow'),
    z.literal('lime'),
    z.literal('green'),
    z.literal('emerald'),
    z.literal('cyan'),
    z.literal('blue'),
    z.literal('indigo'),
    z.literal('purple'),
    z.literal('fuchsia'),
    z.literal('pink')
  ]),
  permissions: z
    .array(
      z.union([
        z.literal('host'),
        z.literal('debug'),
        z.literal('mutate_tournament'),
        z.literal('view_staff_members'),
        z.literal('mutate_staff_members'),
        z.literal('delete_staff_members'),
        z.literal('view_regs'),
        z.literal('mutate_regs'),
        z.literal('delete_regs'),
        z.literal('mutate_pool_structure'),
        z.literal('view_pool_suggestions'),
        z.literal('mutate_pool_suggestions'),
        z.literal('delete_pool_suggestions'),
        z.literal('view_pooled_maps'),
        z.literal('mutate_pooled_maps'),
        z.literal('delete_pooled_maps'),
        z.literal('can_playtest'),
        z.literal('view_matches'),
        z.literal('mutate_matches'),
        z.literal('delete_matches'),
        z.literal('ref_matches'),
        z.literal('commentate_matches'),
        z.literal('stream_matches'),
        z.literal('view_stats'),
        z.literal('mutate_stats'),
        z.literal('delete_stats'),
        z.literal('can_play')
      ])
    )
    .optional()
});

export const staffRolesRouter = t.router({
  createRole: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        data: staffRoleMutationSchema
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug', 'mutate_staff_members']),
        `create staff role for tournament of ID ${input.tournamentId}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let {
        tournamentId,
        data: { name, color, permissions }
      } = input;

      await tryCatch(async () => {
        let roleCount = await getRowCount(dbStaffRole, eq(dbStaffRole.tournamentId, tournamentId));

        await db.insert(dbStaffRole).values({
          name,
          color,
          permissions,
          tournamentId,
          order: roleCount
        });
      }, "Can't create staff role.");
    }),
  updateRole: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        where: whereIdSchema,
        data: staffRoleMutationSchema.deepPartial()
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug', 'mutate_staff_members']),
        `update staff role of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      if (Object.keys(input.data).length === 0) return;

      let {
        where,
        data: { name, color, permissions }
      } = input;

      await tryCatch(async () => {
        await db
          .update(dbStaffRole)
          .set({
            name,
            color,
            permissions: sql`case
              when ${dbStaffRole.order} not in (0, 1)
                then ${permissions}
            end`
          })
          .where(eq(dbStaffRole.id, where.id));
      }, `Can't update staff role of ID ${where.id}.`);
    }),
  swapOrder: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        role1: z.object({
          id: z.number().int(),
          order: z.number().int().gte(1)
        }),
        role2: z.object({
          id: z.number().int(),
          order: z.number().int().gte(1)
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug', 'mutate_staff_members']),
        `change the order of staff roles for tournament of ID ${input.tournamentId}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      if ([input.role1.order, input.role2.order].some((order) => [0, 1].includes(order))) return;

      await tryCatch(async () => {
        await swapOrder(db, dbStaffRole, input.role1, input.role2);
      }, `Can't change the order of staff roles for tournament of ID ${input.tournamentId}.`);
    }),
  deleteRole: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        where: whereIdSchema.extend({
          order: z.number().int()
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug', 'delete_staff_members']),
        `delete staff role of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let {
        tournamentId,
        where: { id, order }
      } = input;

      await tryCatch(async () => {
        await db.transaction(async (tx) => {
          await tx.delete(dbStaffRole).where(eq(dbStaffRole.id, id));

          await tx
            .update(dbStaffRole)
            .set({
              order: sql`${dbStaffRole.order} - 1`
            })
            .where(and(eq(dbStaffRole.tournamentId, tournamentId), gt(dbStaffRole.order, order)));
        });
      }, `Can't delete staff role of ID ${id}.`);
    })
});
