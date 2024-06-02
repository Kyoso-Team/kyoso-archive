import { hasPermissions, isDateFuture } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { TRPCError } from '@trpc/server';
import type { AuthSession, InferEnum } from '$types';
import type { StaffPermission } from '$db';
import type { TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc';

abstract class Checks<ErrCodeT = number | TRPC_ERROR_CODE_KEY> {
  constructor(
    protected action: string,
    protected trpc: boolean,
    protected codes: Record<'unauthorized' | 'badRequest' | 'forbidden', ErrCodeT>
  ) {}

  private error(code: ErrCodeT, message: string) {
    if (this.trpc) {
      throw new TRPCError({
        code: code as any,
        message
      });
    }

    error(code as any, message);
  }

  /**
   * Error if a partial (an object with all of its properties being optional) doesn't have at least one property
   */
  public partialHasValues(data: Record<string, any> | undefined) {
    if (Object.keys(data || {}).length > 0) return this;
    throw this.error(this.codes.badRequest, 'Nothing to update');
  }

  /**
   * Error if the user is not an admin
   */
  public userIsAdmin(session: AuthSession) {
    if (session.admin) return this;
    throw this.error(this.codes.unauthorized, `You must be a website admin to ${this.action}`);
  }

  /**
   * Error if the user is not an approved host
   */
  public userIsApprovedHost(session: AuthSession) {
    if (session.approvedHost) return this;
    throw this.error(this.codes.unauthorized, `You must be an approved host to ${this.action}`);
  }

  /**
   * Error if the staff member does not have the required permissions
   */
  public staffHasPermissions(
    staffMember: { permissions: InferEnum<typeof StaffPermission>[] },
    requiredPerms: InferEnum<typeof StaffPermission>[]
  ) {
    if (hasPermissions(staffMember, requiredPerms)) return this;
    throw this.error(
      this.codes.unauthorized,
      `You do not have the required staff permissions to ${this.action}`
    );
  }

  /**
   * Error if the tournament is deleted
   */
  public tournamentNotDeleted(tournament: { deletedAt: Date | null; }) {
    if (!tournament.deletedAt || isDateFuture(tournament.deletedAt)) return this;
    throw this.error(this.codes.forbidden, `This tournament is deleted. You can't ${this.action}`);
  }

  /**
   * Error if the tournament has concluded
   */
  public tournamentNotConcluded(tournament: { concludesAt: Date | null }) {
    if (!tournament.concludesAt || isDateFuture(tournament.concludesAt)) return this;
    throw this.error(
      this.codes.forbidden,
      `This tournament has concluded. You can't ${this.action}`
    );
  }
}

export class TRPCChecks extends Checks<TRPC_ERROR_CODE_KEY> {
  /**
   * @param action Description of the action performed in the backend. Usually written as: {infitive verb} {thing}. Example: "update this tournament" which would result in an error message like "You do not have the required staff permissions to update this tournament"
   */
  constructor(settings: { action: string }) {
    super(settings.action, true, {
      badRequest: 'BAD_REQUEST',
      unauthorized: 'UNAUTHORIZED',
      forbidden: 'FORBIDDEN'
    });
  }
}

export class APICheck extends Checks<number> {
  /**
   * @param action Description of the action performed in the backend. Usually written as: {infitive verb} {thing}. Example: "update this tournament" which would result in an error message like "You do not have the required staff permissions to update this tournament"
   */
  constructor(settings: { action: string }) {
    super(settings.action, false, {
      badRequest: 400,
      unauthorized: 401,
      forbidden: 403
    });
  }
}
