import db from '$db';
import { and, eq, gt } from 'drizzle-orm';
import { z } from 'zod';
import { t } from '$trpc';
import { getStoredUser } from '$trpc/middleware';
import { paginate } from '$lib/server-utils';

interface BaseNotif {
  id: number;
  notifiedAt: Date;
  read: boolean;
}

type NotifType =
  | 'grantedTournamentHost'
  | 'joinTeamRequest'
  | 'issue'
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
          afterId: z.number().int().gte(1),
          page: z.number().int().gte(1)
        })
        .partial()
    )
    .query(async ({ ctx, input: { page, afterId } }) => {
      let notifs = await db.query.dbUserToNotification.findMany({
        columns: {
          notificationId: true,
          read: true
        },
        with: {
          notification: {
            columns: {
              notifiedAt: true
            },
            with: {
              notifiedTo: {
                columns: {
                  read: true
                }
              },
              grantedTournamentHost: {
                with: {
                  newHost: {
                    columns: {
                      id: true,
                      osuUsername: true
                    }
                  },
                  previousHost: {
                    columns: {
                      id: true,
                      osuUsername: true
                    }
                  },
                  tournament: {
                    columns: {
                      id: true,
                      name: true
                    }
                  }
                }
              },
              joinTeamRequest: {
                with: {
                  request: {
                    columns: {
                      id: true
                    },
                    with: {
                      sentBy: {
                        columns: {
                          id: true
                        },
                        with: {
                          user: {
                            columns: {
                              id: true,
                              osuUsername: true
                            }
                          }
                        }
                      },
                      team: {
                        columns: {
                          id: true,
                          name: true
                        }
                      }
                    }
                  }
                }
              },
              issue: {
                columns: {
                  notifType: true
                },
                with: {
                  issue: {
                    columns: {
                      id: true,
                      title: true
                    },
                    with: {
                      submittedBy: {
                        columns: {
                          id: true,
                          osuUsername: true
                        }
                      }
                    }
                  }
                }
              },
              newStaffAppSubmission: {
                with: {
                  staffAppSubmission: {
                    columns: {
                      id: true,
                      applyingFor: true
                    },
                    with: {
                      staffApplication: {
                        with: {
                          forTournament: {
                            columns: {
                              id: true,
                              name: true
                            }
                          }
                        }
                      },
                      submittedBy: {
                        columns: {
                          id: true,
                          osuUsername: true
                        }
                      }
                    }
                  }
                }
              },
              roundPublication: {
                columns: {
                  publicized: true
                },
                with: {
                  round: {
                    columns: {
                      id: true,
                      name: true
                    },
                    with: {
                      tournament: {
                        columns: {
                          id: true,
                          name: true
                        }
                      }
                    }
                  }
                }
              },
              staffChange: {
                columns: {
                  action: true,
                  addedWithRoles: true
                },
                with: {
                  user: {
                    columns: {
                      id: true,
                      osuUsername: true
                    }
                  }
                }
              },
              teamChange: {
                columns: {
                  action: true
                },
                with: {
                  affectedUser: {
                    columns: {
                      id: true,
                      osuUsername: true
                    }
                  },
                  kickedBy: {
                    columns: {
                      id: true,
                      osuUsername: true
                    }
                  },
                  team: {
                    columns: {
                      id: true,
                      name: true
                    }
                  }
                }
              },
              tournamentDeleted: {
                columns: {
                  tournamentName: true
                },
                with: {
                  hostedBy: {
                    columns: {
                      id: true,
                      osuUsername: true
                    }
                  }
                }
              }
            }
          }
        },
        where: (junction) =>
          and(
            eq(junction.userId, ctx.user.id),
            afterId ? gt(junction.notificationId, afterId) : undefined
          ),
        orderBy: (junction, { desc }) => desc(junction.notificationId),
        ...paginate(page || 1)
      });

      let mapped = notifs.map(({ notificationId, read, notification }) => {
        let notif = {
          ...notification,
          read,
          id: notificationId
        };

        if (notif.grantedTournamentHost) {
          return merge(notif, 'grantedTournamentHost', notif.grantedTournamentHost);
        }

        if (notif.joinTeamRequest) {
          return merge(notif, 'joinTeamRequest', notif.joinTeamRequest);
        }

        if (notif.issue) {
          return merge(notif, 'issue', notif.issue);
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
