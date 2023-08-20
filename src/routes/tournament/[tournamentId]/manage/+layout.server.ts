import db from '$db';
import { dbStaffMember, dbStaffMemberToStaffRole, dbStaffRole, dbRound } from '$db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let { tournament, user } = await parent();

  if (!user) {
    throw error(401, "You're not logged in.");
  }

  let results = await db
    .select({
      member: {
        id: dbStaffMember.id
      },
      role: {
        permissions: dbStaffRole.permissions
      }
    })
    .from(dbStaffMemberToStaffRole)
    .where(and(
      eq(dbStaffMemberToStaffRole.staffMemberId, dbStaffMember.id),
      eq(dbStaffMemberToStaffRole.staffRoleId, dbStaffRole.id)
    ))
    .innerJoin(dbStaffMember, eq(dbStaffMember.userId, user.id))
    .innerJoin(dbStaffRole, eq(dbStaffRole.tournamentId, tournament.id));

  let staffMember = results[0] ? {
    id: results[0].member.id,
    roles: results.map(({ role }) => role)
  } : undefined;

  if (!staffMember) {
    throw error(403, `You're not a staff member for tournament of ID ${tournament.id}.`);
  }

  let rounds = await db
    .select({
      id: dbRound.id,
      name: dbRound.name
    })
    .from(dbRound)
    .where(eq(dbRound.tournamentId, tournament.id))
    .orderBy(asc(dbRound.order));

  return {
    tournament,
    staffMember,
    rounds,
    user
  };
}) satisfies LayoutServerLoad;
