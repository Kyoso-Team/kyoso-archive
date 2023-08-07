import prisma from '$prisma';
import { z } from 'zod';
import { t } from '$trpc';
import { getStoredUser } from '$trpc/middleware';
import { paginate } from '$lib/server-utils';

interface BaseNotif {
  id: string;
  notifiedAt: Date;
}

type NotifType =
  | 'grantedTournamentHost'
  | 'joinTeamRequest'
  | 'newIssue'
  | 'newStaffAppSubmission'
  | 'roundPublication'
  | 'staffChange'
  | 'teamChange'
  | 'tournamentDeleted';

function merge<T extends Record<string, unknown>>(base: BaseNotif, type: NotifType, extension: T) {
  return {
    type,
    id: base.id,
    notifiedAt: base.notifiedAt,
    ...extension
  } as BaseNotif &
    T & {
      type: NotifType;
    };
}

export const notificationsRouter = t.router({
  getOwnNotifications: t.procedure
    .use(getStoredUser)
    .input(
      z
        .object({
          afterDate: z.date(),
          page: z.number().int().gte(1)
        })
        .partial()
    )
    .query(async ({ ctx, input: { page, afterDate } }) => {
      let notifs = await prisma.notification.findMany({
        ...paginate(page || 1),
        where: {
          AND: [
            {
              notifiedTo: {
                some: {
                  id: ctx.user.id
                }
              }
            },
            afterDate
              ? {
                  notifiedAt: {
                    gt: afterDate
                  }
                }
              : {}
          ]
        },
        select: {
          id: true,
          notifiedAt: true,
          grantedTournamentHost: {
            select: {
              newHost: {
                select: {
                  id: true,
                  osuUsername: true
                }
              },
              previousHost: {
                select: {
                  id: true,
                  osuUsername: true
                }
              },
              tournament: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          joinTeamRequest: {
            select: {
              request: {
                select: {
                  id: true,
                  requestedBy: {
                    select: {
                      id: true,
                      user: {
                        select: {
                          id: true,
                          osuUsername: true
                        }
                      }
                    }
                  },
                  team: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          },
          newIssue: {
            select: {
              notifType: true,
              issue: {
                select: {
                  id: true,
                  title: true,
                  submittedBy: {
                    select: {
                      id: true,
                      osuUsername: true
                    }
                  }
                }
              }
            }
          },
          newStaffAppSubmission: {
            select: {
              staffAppSubmission: {
                select: {
                  id: true,
                  applyingFor: true,
                  staffApplication: {
                    select: {
                      tournament: {
                        select: {
                          id: true,
                          name: true
                        }
                      }
                    }
                  },
                  submittedBy: {
                    select: {
                      id: true,
                      osuUsername: true
                    }
                  }
                }
              }
            }
          },
          roundPublication: {
            select: {
              publicized: true,
              round: {
                select: {
                  id: true,
                  name: true,
                  tournament: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          },
          staffChange: {
            select: {
              action: true,
              withRoles: true,
              user: {
                select: {
                  id: true,
                  osuUsername: true
                }
              }
            }
          },
          teamChange: {
            select: {
              action: true,
              affectedUser: {
                select: {
                  id: true,
                  osuUsername: true
                }
              },
              kickedBy: {
                select: {
                  id: true,
                  osuUsername: true
                }
              },
              team: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          tournamentDeleted: {
            select: {
              tournamentName: true,
              hostedBy: {
                select: {
                  id: true,
                  osuUsername: true
                }
              }
            }
          }
        }
      });

      let mapped = notifs.map((notif) => {
        if (notif.grantedTournamentHost) {
          return merge(notif, 'grantedTournamentHost', notif.grantedTournamentHost);
        }

        if (notif.joinTeamRequest) {
          return merge(notif, 'joinTeamRequest', notif.joinTeamRequest);
        }

        if (notif.newIssue) {
          return merge(notif, 'newIssue', notif.newIssue);
        }

        if (notif.newStaffAppSubmission) {
          return merge(notif, 'newStaffAppSubmission', notif.newStaffAppSubmission);
        }

        if (notif.roundPublication) {
          return merge(notif, 'roundPublication', notif.roundPublication);
        }

        if (notif.staffChange) {
          return merge(notif, 'staffChange', notif.staffChange);
        }

        if (notif.teamChange) {
          return merge(notif, 'teamChange', notif.teamChange);
        }

        if (notif.tournamentDeleted) {
          return merge(notif, 'tournamentDeleted', notif.tournamentDeleted);
        }

        return notif;
      });

      return mapped;
    })
});
