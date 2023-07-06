import prisma from '$prisma';
import { z } from 'zod';
import { t, tryCatch } from '$trpc';
import { getUserAsStaff } from '$trpc/middleware';
import { whereIdSchema, withTournamentSchema } from '$lib/schemas';
import { forbidIf, isAllowed } from '$lib/server-utils';
import { hasPerms } from '$lib/utils';

const staffRoleMutationSchema = z.object({
  name: z.string().max(25),
  color: z.union([
    z.literal('Slate'),
    z.literal('Gray'),
    z.literal('Red'),
    z.literal('Orange'),
    z.literal('Yellow'),
    z.literal('Lime'),
    z.literal('Green'),
    z.literal('Emerald'),
    z.literal('Cyan'),
    z.literal('Blue'),
    z.literal('Indigo'),
    z.literal('Purple'),
    z.literal('Fuchsia'),
    z.literal('Pink')
  ]),
  permissions: z.union([
    z.literal('Host'),
    z.literal('Debug'),
    z.literal('MutateTournament'),
    z.literal('ViewStaffMembers'),
    z.literal('MutateStaffMembers'),
    z.literal('DeleteStaffMembers'),
    z.literal('ViewRegs'),
    z.literal('MutateRegs'),
    z.literal('DeleteRegs'),
    z.literal('ViewPoolStructure'),
    z.literal('MutatePoolStructure'),
    z.literal('ViewPoolSuggestions'),
    z.literal('MutatePoolSuggestions'),
    z.literal('DeletePoolSuggestions'),
    z.literal('ViewPooledMaps'),
    z.literal('DeletePooledMaps'),
    z.literal('ViewMapsToPlaytest'),
    z.literal('MutateMapsToPlaytest'),
    z.literal('DeleteMapsToPlaytest'),
    z.literal('ViewMatches'),
    z.literal('MutateMatches'),
    z.literal('DeleteMatches'),
    z.literal('RefMatches'),
    z.literal('CommentateMatches'),
    z.literal('StreamMatches'),
    z.literal('ViewStats'),
    z.literal('MutateStats'),
    z.literal('DeleteStats'),
    z.literal('CanPlay')
  ])
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
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug', 'MutateStaffMembers']),
        `create staff role for tournament of ID ${input.tournamentId}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let {
        tournamentId,
        data: { name, color, permissions }
      } = input;

      await tryCatch(async () => {
        let roleCount = await prisma.staffRole.count({
          where: {
            tournamentId
          }
        });

        await prisma.staffRole.create({
          data: {
            name,
            color,
            permissions,
            tournamentId,
            order: roleCount + 1
          }
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
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug', 'MutateStaffMembers']),
        `update staff role of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      if (Object.keys(input.data).length === 0) return;

      let {
        where,
        data: { name, color, permissions }
      } = input;

      await tryCatch(async () => {
        await prisma.staffRole.update({
          where,
          data: {
            name,
            color,
            permissions
          }
        });
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
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug', 'MutateStaffMembers']),
        `change the order of staff roles for tournament of ID ${input.tournamentId}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      await tryCatch(async () => {
        await prisma.$transaction([
          prisma.staffRole.update({
            where: {
              id: input.role1.id
            },
            data: {
              order: input.role2.order
            }
          }),
          prisma.staffRole.update({
            where: {
              id: input.role2.id
            },
            data: {
              order: input.role1.order
            }
          })
        ]);
      }, `Can't change the order of staff roles for tournament of ID ${input.tournamentId}.`);
    }),
  deleteRole: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        where: whereIdSchema
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug', 'DeleteStaffMembers']),
        `delete staff role of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let { where } = input;

      await tryCatch(async () => {
        await prisma.staffRole.delete({
          where
        });
      }, `Can't delete staff role of ID ${where.id}.`);
    })
});
