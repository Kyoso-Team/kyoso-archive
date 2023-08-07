import prisma from '$prisma';
import { z } from 'zod';
import { t, tryCatch } from '$trpc';
import { getUserAsStaff } from '$trpc/middleware';
import { whereIdSchema, withTournamentSchema } from '$lib/schemas';
import { forbidIf, isAllowed } from '$lib/server-utils';
import { hasPerms } from '$lib/utils';

const mutateStaffMembersSchema = z.object({
  roleIds: z.array(z.number())
});

export const staffMembersRouter = t.router({
  createMember: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        data: mutateStaffMembersSchema.extend({
          userId: z.number().int()
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug', 'MutateStaffMembers']),
        `create staff member for tournament of ID ${input.tournamentId}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let {
        tournamentId,
        data: { userId, roleIds }
      } = input;

      await tryCatch(async () => {
        await prisma.staffMember.create({
          data: {
            userId,
            tournamentId,
            roles: {
              connect: roleIds.map((id) => ({ id }))
            }
          }
        });
      }, "Can't create staff member.");
    }),
  updateMember: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        where: whereIdSchema,
        data: mutateStaffMembersSchema.deepPartial()
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug', 'MutateStaffMembers']),
        `update staff member of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      if (Object.keys(input.data).length === 0) return;

      let {
        where,
        data: { roleIds }
      } = input;

      await tryCatch(async () => {
        await prisma.staffMember.update({
          where,
          data: {
            roles: {
              set: (roleIds || []).map((id) => ({ id }))
            }
          }
        });
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
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug', 'DeleteStaffMembers']),
        `delete staff member of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let { where } = input;

      await tryCatch(async () => {
        await prisma.staffMember.delete({
          where
        });
      }, `Can't delete staff member of ID ${where.id}.`);
    })
});
