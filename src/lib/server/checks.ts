import { env } from '$lib/server/env';
import { hasPermissions, isDateFuture } from '$lib/utils';
import { error } from './error';
import type { AuthSession, ErrorInside, InferEnum } from '$types';
import type { StaffPermission } from '$db';

export class Checks {
  constructor(protected inside: ErrorInside) {}

  /**
   * Error if a partial (an object with all of its properties being optional) doesn't have at least one property
   */
  public partialHasValues(data: Record<string, any> | undefined) {
    if (Object.keys(data || {}).length > 0) return this;
    error(this.inside, 'bad_request', 'Nothing to update');
  }

  public userIsOwner(session: AuthSession) {
    if (session.osu.id === env.OWNER) return this;
    error(this.inside, 'unauthorized', 'Not the website owner');
  }

  /**
   * Error if the user is not an admin
   */
  public userIsAdmin(session: AuthSession) {
    if (session.admin) return this;
    error(this.inside, 'unauthorized', 'Not an admin');
  }

  /**
   * Error if the user is not an approved host
   */
  public userIsApprovedHost(session: AuthSession) {
    if (session.approvedHost) return this;
    error(this.inside, 'unauthorized', 'Not an approved host');
  }

  /**
   * Error if the staff member does not have the required permissions
   */
  public staffHasPermissions(
    staffMember: { permissions: InferEnum<typeof StaffPermission>[] },
    requiredPerms: InferEnum<typeof StaffPermission>[]
  ) {
    if (hasPermissions(staffMember, requiredPerms)) return this;
    error(this.inside, 'unauthorized', 'Wrong staff permissions');
  }

  /**
   * Error if the tournament is deleted
   */
  public tournamentNotDeleted(tournament: { deletedAt: Date | null }) {
    if (!tournament.deletedAt || isDateFuture(tournament.deletedAt)) return this;
    error(this.inside, 'forbidden', 'Tournament is deleted');
  }

  /**
   * Error if the tournament has concluded
   */
  public tournamentNotConcluded(tournament: { concludesAt: Date | null }) {
    if (!tournament.concludesAt || isDateFuture(tournament.concludesAt)) return this;
    error(this.inside, 'forbidden', 'Tournament has concluded');
  }
}
