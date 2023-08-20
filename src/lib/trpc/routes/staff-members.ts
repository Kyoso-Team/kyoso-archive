import db from '$db';
import { dbStaffMember, dbStaffMemberToStaffRole } from '$db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { t, tryCatch } from '$trpc';
import { getUserAsStaff } from '$trpc/middleware';
import { whereIdSchema, withTournamentSchema, mToN } from '$lib/schemas';
import { forbidIf, isAllowed } from '$lib/server-utils';
import { hasPerms } from '$lib/utils';

export const staffMembersRouter = t.router({
  createMember: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        data: z.object({
          userId: z.number().int(),
          roleIds: z.array(z.number())
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug', 'mutate_staff_members']),
        `create staff member for tournament of ID ${input.tournamentId}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let {
        tournamentId,
        data: { userId, roleIds }
      } = input;

      await tryCatch(async () => {
        await db.transaction(async (tx) => {
          let [{ staffMemberId }] =await tx
            .insert(dbStaffMember)
            .values({
              userId,
              tournamentId
            })
            .returning({
              staffMemberId: dbStaffMember.id
            });
          
          await tx
            .insert(dbStaffMemberToStaffRole)
            .values(
              roleIds.map((staffRoleId) => ({
                staffMemberId,
                staffRoleId
              }))
            );
        });
      }, "Can't create staff member.");
    }),
  updateMember: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        where: whereIdSchema,
        roles: mToN
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug', 'mutate_staff_members']),
        `update staff member of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      if (Object.keys(input.roles).length === 0) return;

      let {
        where,
        roles: { addIds, removeIds }
      } = input;

      addIds = addIds.filter((id) => removeIds.includes(id));
      removeIds = removeIds.filter((id) => addIds.includes(id));

      await tryCatch(async () => {
        if (removeIds.length > 0) {
          await db
            .delete(dbStaffMemberToStaffRole)
            .where(and(
              eq(dbStaffMemberToStaffRole.staffMemberId, where.id),
              inArray(dbStaffMemberToStaffRole.staffRoleId, removeIds)
            ));
        }

        if (addIds.length > 0) {
          await db
            .insert(dbStaffMemberToStaffRole)
            .values(
              addIds.map((staffRoleId) => ({
                staffMemberId: where.id,
                staffRoleId
              }))
            )
            .onConflictDoNothing({
              target: [
                dbStaffMemberToStaffRole.staffMemberId,
                dbStaffMemberToStaffRole.staffRoleId
              ]
            });
        }
      }, `Can't update staff member of ID ${where.id}.`);
    }),
  deleteMember: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        where: whereIdSchema
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug', 'delete_staff_members']),
        `delete staff member of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let { where } = input;

      await tryCatch(async () => {
        await db
          .delete(dbStaffMember)
          .where(eq(dbStaffMember.id, where.id));
      }, `Can't delete staff member of ID ${where.id}.`);
    })
});
