import {
  dbModMultiplier,
  dbModpool,
  dbPrize,
  dbPrizeCash,
  dbQualifierRound,
  dbRound,
  dbStaffMember,
  dbStaffMemberToStaffRole,
  dbStaffRole,
  dbStage,
  dbStandardRound,
  dbTournament
} from '../../src/db/schema';
import { bufferToFile, fetchUserData, id, upload } from './utils';
import { createSpinner } from 'nanospinner';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type { InferInsertModel } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Client as OsuClient } from 'osu-web.js';

async function setTournament(db: PostgresJsDatabase) {
  return await db
    .insert(dbTournament)
    .values({
      name: '5 Digit World Cup 2023',
      acronym: '5WC2023',
      useBWS: true,
      services: ['registrations', 'referee', 'mappooling', 'stats', 'pickems'],
      lowerRankRange: 10_000,
      upperRankRange: 99_999,
      type: 'teams',
      teamSize: 8,
      teamPlaySize: 4,
      alwaysForceNoFail: true,
      banOrder: 'ABBAAB',
      concludesOn: new Date(1681106400000),
      discordInviteId: 'WxX2UkdSMq',
      donationLink: 'https://www.paypal.com/paypalme/kaguyaproject',
      doubleBanAllowed: true,
      doublePickAllowed: true,
      forumPostId: 1699537,
      freeModRules:
        '- 4 mods minimum.\n- Teams may overmod.\n- 1 HD and 1 HR are required (or the appropriate substitute).\n- EZ or EZHD can subsitute HD.\n- EZHD counts as 1 mod towards the team total.\n- HDHR counts as 2 mods towards the total, but does not count as HD or HR.',
      goPublicOn: new Date(1672466400000),
      hasBanner: true,
      hasLogo: true,
      lateProcedures:
        '\n- Teams who are 5 minutes late will forfeit their protection, ban(s), and first pick.\n- Teams who are 10 minutes late will receive a loss by default.',
      mainSheetId: '1ix6Os18DffbDzZ2iHW0XUHG_hN-Gq8VZ1Gi1XkkSSqo',
      pickTimerLength: 120,
      playerRegsCloseOn: new Date(1674367200000),
      playerRegsOpenOn: new Date(1672552800000),
      rollRules: 'The !roll winner will protect second, ban first, and pick first.',
      startTimerLength: 10,
      twitchChannelName: 'stagetournaments',
      warmupRules:
        '- Warm-ups must not exceed 3 minutes in drain length (3:00).\n- Warm-ups must not contain highly explicit audio. Referees may veto a warm-up should these rules be violated.'
    })
    .returning({
      id: dbTournament.id
    });
}

async function setAssets(storageEndpoint: string, storagePassword: string, tournamentId: number) {
  let full = `0000000${tournamentId}-full.jpeg`;
  let thumb = `0000000${tournamentId}-thumb.jpeg`;

  let files = [
    {
      ogFile: '5wc-banner-full.jpeg',
      newFile: full,
      folder: 'tournament-banners'
    },
    {
      ogFile: '5wc-banner-thumb.jpeg',
      newFile: thumb,
      folder: 'tournament-banners'
    },
    {
      ogFile: '5wc-logo-full.jpeg',
      newFile: full,
      folder: 'tournament-logos'
    },
    {
      ogFile: '5wc-logo-thumb.jpeg',
      newFile: thumb,
      folder: 'tournament-logos'
    }
  ];

  await Promise.all(
    files.map(async ({ ogFile, newFile, folder }) => {
      let path = resolve(process.cwd(), 'scripts', 'seed', 'assets', ogFile);
      let buffer = await readFile(path);
      let blob = bufferToFile(buffer, newFile);

      await upload(storageEndpoint, storagePassword, `${folder}/${newFile}`, blob);
    })
  );
}

async function setModMultipliers(db: PostgresJsDatabase, tournamentId: number) {
  await db.insert(dbModMultiplier).values([
    {
      tournamentId,
      value: 1.75,
      mods: ['ez']
    },
    {
      tournamentId,
      value: 1.04,
      mods: ['hr']
    },
    {
      tournamentId,
      value: 1.3,
      mods: ['fl']
    },
    {
      tournamentId,
      value: 2.15,
      mods: ['ez', 'fl']
    }
  ]);
}

async function setPrizes(db: PostgresJsDatabase, tournamentId: number) {
  let [firstPlacePrize, secondPlacePrize, thirdPlacePrize] = await db
    .insert(dbPrize)
    .values([
      {
        tournamentId,
        badge: true,
        banner: true,
        medal: false,
        trophy: false,
        type: 'tournament',
        additionalItems: [
          '5WC 2023 Themed Momokai Tap Trio',
          '5WC 2023 Themed Foxbox tablet cover or mouse pad'
        ],
        placements: [1]
      },
      {
        tournamentId,
        badge: false,
        banner: true,
        medal: false,
        trophy: false,
        type: 'tournament',
        placements: [2]
      },
      {
        tournamentId,
        badge: false,
        banner: true,
        medal: false,
        trophy: false,
        type: 'tournament',
        placements: [3]
      },
      {
        tournamentId,
        badge: false,
        banner: false,
        medal: false,
        trophy: false,
        type: 'pickems',
        placements: [1],
        monthsOsuSupporter: 6
      }
    ])
    .returning({
      id: dbPrize.id
    });

  await db.insert(dbPrizeCash).values([
    {
      currency: 'USD',
      inPrizeId: firstPlacePrize.id,
      metric: 'percent',
      value: 50
    },
    {
      currency: 'USD',
      inPrizeId: secondPlacePrize.id,
      metric: 'percent',
      value: 30
    },
    {
      currency: 'USD',
      inPrizeId: thirdPlacePrize.id,
      metric: 'percent',
      value: 20
    }
  ]);
}

async function setStagesAndRounds(db: PostgresJsDatabase, tournamentId: number) {
  let [qualifiers, bracket] = await db
    .insert(dbStage)
    .values([
      {
        tournamentId,
        format: 'qualifiers',
        order: 1
      },
      {
        tournamentId,
        format: 'double_elim',
        order: 2,
        isMainStage: true
      }
    ])
    .returning({
      id: dbStage.id
    });

  let rounds = await db
    .insert(dbRound)
    .values([
      {
        tournamentId,
        name: 'Qualifiers',
        order: 1,
        stageId: qualifiers.id,
        mappoolState: 'public',
        publishSchedules: true,
        publishStats: true,
        targetStarRating: 6.3
      },
      {
        tournamentId,
        name: 'Round of 32',
        order: 2,
        stageId: bracket.id,
        mappoolState: 'public',
        publishSchedules: true,
        publishStats: true,
        targetStarRating: 6
      },
      {
        tournamentId,
        name: 'Round of 16',
        order: 3,
        stageId: bracket.id,
        mappoolState: 'public',
        publishSchedules: true,
        publishStats: true,
        targetStarRating: 6.15
      },
      {
        tournamentId,
        name: 'Quarterfinals',
        order: 4,
        stageId: bracket.id,
        mappoolState: 'public',
        publishSchedules: true,
        publishStats: true,
        targetStarRating: 6.3
      },
      {
        tournamentId,
        name: 'Semifinals',
        order: 5,
        stageId: bracket.id,
        mappoolState: 'public',
        publishSchedules: true,
        publishStats: true,
        targetStarRating: 6.5
      },
      {
        tournamentId,
        name: 'Finals',
        order: 6,
        stageId: bracket.id,
        mappoolState: 'public',
        publishSchedules: true,
        publishStats: true,
        targetStarRating: 6.7
      },
      {
        tournamentId,
        name: 'Grand Finals',
        order: 7,
        stageId: bracket.id,
        mappoolState: 'public',
        publishSchedules: true,
        publishStats: true,
        targetStarRating: 6.9
      }
    ])
    .returning({
      id: dbRound.id
    });

  let [quals, ro32, ro16, qf, sf, f, gf] = rounds;

  await db.insert(dbQualifierRound).values({
    roundId: quals.id,
    runCount: 1,
    publishMpLinks: true
  });

  await db.insert(dbStandardRound).values([
    {
      banCount: 1,
      bestOf: 9,
      protectCount: 1,
      roundId: ro32.id
    },
    {
      banCount: 1,
      bestOf: 9,
      protectCount: 1,
      roundId: ro16.id
    },
    {
      banCount: 2,
      bestOf: 11,
      protectCount: 1,
      roundId: qf.id
    },
    {
      banCount: 2,
      bestOf: 11,
      protectCount: 1,
      roundId: sf.id
    },
    {
      banCount: 2,
      bestOf: 13,
      protectCount: 1,
      roundId: f.id
    },
    {
      banCount: 2,
      bestOf: 13,
      protectCount: 1,
      roundId: gf.id
    }
  ]);

  return rounds;
}

async function setModpools(
  db: PostgresJsDatabase,
  id: Record<'quals' | 'ro32' | 'ro16' | 'qf' | 'sf' | 'f' | 'gf', number>
) {
  const qualsModpools: InferInsertModel<typeof dbModpool>[] = [
    {
      category: 'NM',
      isFreeMod: false,
      isTieBreaker: false,
      order: 1,
      roundId: id.quals,
      mapCount: 4
    },
    {
      category: 'HD',
      isFreeMod: false,
      isTieBreaker: false,
      order: 2,
      roundId: id.quals,
      mapCount: 2,
      mods: ['hd']
    },
    {
      category: 'HR',
      isFreeMod: false,
      isTieBreaker: false,
      order: 3,
      roundId: id.quals,
      mapCount: 2,
      mods: ['hr']
    },
    {
      category: 'DT',
      isFreeMod: false,
      isTieBreaker: false,
      order: 4,
      roundId: id.quals,
      mapCount: 2,
      mods: ['dt']
    },
    {
      category: 'FM',
      isFreeMod: true,
      isTieBreaker: false,
      order: 5,
      roundId: id.quals,
      mapCount: 1
    }
  ];
  const ro32Modpools: typeof qualsModpools = [
    {
      category: 'NM',
      isFreeMod: false,
      isTieBreaker: false,
      order: 1,
      roundId: id.ro32,
      mapCount: 5
    },
    {
      category: 'HD',
      isFreeMod: false,
      isTieBreaker: false,
      order: 2,
      roundId: id.ro32,
      mapCount: 2,
      mods: ['hd']
    },
    {
      category: 'HR',
      isFreeMod: false,
      isTieBreaker: false,
      order: 3,
      roundId: id.ro32,
      mapCount: 2,
      mods: ['hr']
    },
    {
      category: 'DT',
      isFreeMod: false,
      isTieBreaker: false,
      order: 4,
      roundId: id.ro32,
      mapCount: 3,
      mods: ['dt']
    },
    {
      category: 'FM',
      isFreeMod: true,
      isTieBreaker: false,
      order: 5,
      roundId: id.ro32,
      mapCount: 2
    },
    {
      category: 'TB',
      isFreeMod: true,
      isTieBreaker: true,
      order: 6,
      roundId: id.ro32,
      mapCount: 1
    }
  ];
  const ro16Modpools: typeof qualsModpools = [
    {
      category: 'NM',
      isFreeMod: false,
      isTieBreaker: false,
      order: 1,
      roundId: id.ro16,
      mapCount: 5
    },
    {
      category: 'HD',
      isFreeMod: false,
      isTieBreaker: false,
      order: 2,
      roundId: id.ro16,
      mapCount: 2,
      mods: ['hd']
    },
    {
      category: 'HR',
      isFreeMod: false,
      isTieBreaker: false,
      order: 3,
      roundId: id.ro16,
      mapCount: 2,
      mods: ['hr']
    },
    {
      category: 'DT',
      isFreeMod: false,
      isTieBreaker: false,
      order: 4,
      roundId: id.ro16,
      mapCount: 3,
      mods: ['dt']
    },
    {
      category: 'FM',
      isFreeMod: true,
      isTieBreaker: false,
      order: 5,
      roundId: id.ro16,
      mapCount: 2
    },
    {
      category: 'TB',
      isFreeMod: true,
      isTieBreaker: true,
      order: 6,
      roundId: id.ro16,
      mapCount: 1
    }
  ];
  const qfModpools: typeof qualsModpools = [
    {
      category: 'NM',
      isFreeMod: false,
      isTieBreaker: false,
      order: 1,
      roundId: id.qf,
      mapCount: 6
    },
    {
      category: 'HD',
      isFreeMod: false,
      isTieBreaker: false,
      order: 2,
      roundId: id.qf,
      mapCount: 3,
      mods: ['hd']
    },
    {
      category: 'HR',
      isFreeMod: false,
      isTieBreaker: false,
      order: 3,
      roundId: id.qf,
      mapCount: 3,
      mods: ['hr']
    },
    {
      category: 'DT',
      isFreeMod: false,
      isTieBreaker: false,
      order: 4,
      roundId: id.qf,
      mapCount: 3,
      mods: ['dt']
    },
    {
      category: 'FM',
      isFreeMod: true,
      isTieBreaker: false,
      order: 5,
      roundId: id.qf,
      mapCount: 2
    },
    {
      category: 'TB',
      isFreeMod: true,
      isTieBreaker: true,
      order: 6,
      roundId: id.qf,
      mapCount: 1
    }
  ];
  const sfModpools: typeof qualsModpools = [
    {
      category: 'NM',
      isFreeMod: false,
      isTieBreaker: false,
      order: 1,
      roundId: id.sf,
      mapCount: 6
    },
    {
      category: 'HD',
      isFreeMod: false,
      isTieBreaker: false,
      order: 2,
      roundId: id.sf,
      mapCount: 3,
      mods: ['hd']
    },
    {
      category: 'HR',
      isFreeMod: false,
      isTieBreaker: false,
      order: 3,
      roundId: id.sf,
      mapCount: 3,
      mods: ['hr']
    },
    {
      category: 'DT',
      isFreeMod: false,
      isTieBreaker: false,
      order: 4,
      roundId: id.sf,
      mapCount: 3,
      mods: ['dt']
    },
    {
      category: 'FM',
      isFreeMod: true,
      isTieBreaker: false,
      order: 5,
      roundId: id.sf,
      mapCount: 2
    },
    {
      category: 'TB',
      isFreeMod: true,
      isTieBreaker: true,
      order: 6,
      roundId: id.sf,
      mapCount: 1
    }
  ];
  const fModpools: typeof qualsModpools = [
    {
      category: 'NM',
      isFreeMod: false,
      isTieBreaker: false,
      order: 1,
      roundId: id.f,
      mapCount: 6
    },
    {
      category: 'HD',
      isFreeMod: false,
      isTieBreaker: false,
      order: 2,
      roundId: id.f,
      mapCount: 3,
      mods: ['hd']
    },
    {
      category: 'HR',
      isFreeMod: false,
      isTieBreaker: false,
      order: 3,
      roundId: id.f,
      mapCount: 3,
      mods: ['hr']
    },
    {
      category: 'DT',
      isFreeMod: false,
      isTieBreaker: false,
      order: 4,
      roundId: id.f,
      mapCount: 4,
      mods: ['dt']
    },
    {
      category: 'FM',
      isFreeMod: true,
      isTieBreaker: false,
      order: 5,
      roundId: id.f,
      mapCount: 3
    },
    {
      category: 'TB',
      isFreeMod: true,
      isTieBreaker: true,
      order: 6,
      roundId: id.f,
      mapCount: 1
    }
  ];
  const gfModpools: typeof qualsModpools = [
    {
      category: 'NM',
      isFreeMod: false,
      isTieBreaker: false,
      order: 1,
      roundId: id.gf,
      mapCount: 6
    },
    {
      category: 'HD',
      isFreeMod: false,
      isTieBreaker: false,
      order: 2,
      roundId: id.gf,
      mapCount: 3,
      mods: ['hd']
    },
    {
      category: 'HR',
      isFreeMod: false,
      isTieBreaker: false,
      order: 3,
      roundId: id.gf,
      mapCount: 3,
      mods: ['hr']
    },
    {
      category: 'DT',
      isFreeMod: false,
      isTieBreaker: false,
      order: 4,
      roundId: id.gf,
      mapCount: 4,
      mods: ['dt']
    },
    {
      category: 'FM',
      isFreeMod: true,
      isTieBreaker: false,
      order: 5,
      roundId: id.gf,
      mapCount: 3
    },
    {
      category: 'TB',
      isFreeMod: true,
      isTieBreaker: true,
      order: 6,
      roundId: id.gf,
      mapCount: 1
    }
  ];

  await db
    .insert(dbModpool)
    .values([
      ...qualsModpools,
      ...ro32Modpools,
      ...ro16Modpools,
      ...qfModpools,
      ...sfModpools,
      ...fModpools,
      ...gfModpools
    ])
    .returning({
      id: dbModpool.id
    });
}

async function setStaffMembersAndRoles(
  db: PostgresJsDatabase,
  tournamentId: number,
  osuClient: OsuClient,
  discordBotToken: string
) {
  let [
    _debuggerRole,
    hostRole,
    cohostRole,
    adminRole,
    modRole,
    devRole,
    sheeterRole,
    poolSelectorRole,
    mqaRole,
    refRole,
    gfxRole,
    cmqaRole,
    mapperRole,
    replayerRole,
    streamerRole,
    commentatorRole
  ] = await db
    .insert(dbStaffRole)
    .values([
      {
        tournamentId,
        name: 'Debugger',
        color: 'gray',
        permissions: ['debug'],
        order: 0
      },
      {
        tournamentId,
        name: 'Host',
        color: 'blue',
        permissions: ['host'],
        order: 1
      },
      {
        tournamentId,
        name: 'Co-Host',
        color: 'cyan',
        permissions: ['mutate_tournament'],
        order: 2
      },
      {
        tournamentId,
        name: 'Administrator',
        color: 'yellow',
        permissions: ['mutate_tournament'],
        order: 3
      },
      {
        tournamentId,
        name: 'Moderator',
        color: 'yellow',
        permissions: ['mutate_tournament'],
        order: 4
      },
      {
        tournamentId,
        name: 'Developer',
        color: 'fuchsia',
        permissions: [
          'view_staff_members',
          'view_regs',
          'view_pooled_maps',
          'view_matches',
          'view_stats'
        ],
        order: 5
      },
      {
        tournamentId,
        name: 'Sheeter',
        color: 'pink',
        permissions: [
          'view_staff_members',
          'view_regs',
          'view_pooled_maps',
          'view_matches',
          'view_stats'
        ],
        order: 6
      },
      {
        tournamentId,
        name: 'Mappool Selector',
        color: 'green',
        permissions: ['mutate_pool_structure', 'delete_pool_suggestions', 'delete_pooled_maps'],
        order: 7
      },
      {
        tournamentId,
        name: 'Mappool Quality Assurance',
        color: 'green',
        permissions: ['view_pool_suggestions', 'view_pooled_maps'],
        order: 8
      },
      {
        tournamentId,
        name: 'Referee',
        color: 'indigo',
        permissions: ['ref_matches'],
        order: 9
      },
      {
        tournamentId,
        name: 'Graphic Designer',
        color: 'green',
        permissions: [],
        order: 10
      },
      {
        tournamentId,
        name: 'Custom Map Quality Assurance',
        color: 'lime',
        permissions: ['view_pool_suggestions', 'view_pooled_maps'],
        order: 11
      },
      {
        tournamentId,
        name: 'Mapper',
        color: 'lime',
        permissions: ['view_pool_suggestions', 'view_pooled_maps'],
        order: 12
      },
      {
        tournamentId,
        name: 'Replayer',
        color: 'red',
        permissions: ['view_pool_suggestions', 'view_pooled_maps'],
        order: 13
      },
      {
        tournamentId,
        name: 'Streamer',
        color: 'indigo',
        permissions: ['stream_matches'],
        order: 14
      },
      {
        tournamentId,
        name: 'Commentator',
        color: 'indigo',
        permissions: ['commentate_matches'],
        order: 15
      }
    ])
    .returning({
      id: dbStaffRole.id
    });

  let userIds = [
    id(8191845, '146092837723832320'),
    id(11955929, '289792596287553538'),
    id(4420014, '116354994986287104'),
    id(6263040, '289386538280812555'),
    id(13175102, '921042129076252752'),
    id(13456818, '379076400394666004'),
    id(2916205, '125364675750658048'),
    id(8306102, '690827021713932338'),
    id(12455868, '345003515594276865'),
    id(6814521, '194166972353609728'),
    id(10108853, '316966168118427658'),
    id(15173952, '353179479121723394'),
    id(14806365, '333974041360597005'),
    id(9477784, '152239941131304961'),
    id(10224047, '271416646218940428'),
    id(8443945, '239830099707428864'),
    id(11612720, '290568322548760583'),
    id(6036351, '152922854818709504'),
    id(12016150, '334753120750010368'),
    id(12139352, '402166312442265600'),
    id(13055978, '494879262202134548'),
    id(9405745, '219482971063844873'),
    id(11310892, '145362663625588746'),
    id(12058601, '194198021829951489'),
    id(8401053, '493320468141572117'),
    id(6843383, '183642161709973506'),
    id(7516954, '96315503361941504'),
    id(6518510, '147132196321361920'),
    id(17959882, '277756101414354945'),
    id(8589763, '143085788601516032'),
    id(19650134, '224542267422015489'),
    id(18315188, '133345027660316673'),
    id(6471972, '123083258920435714'),
    id(9074108, '276737814664839169'),
    id(12086495, '704298675320520716'),
    id(9918921, '296804750295302145'),
    id(19030042, '927649542344699915'),
    id(4722369, '182331250206310411'),
    id(11730796, '357353427535265792'),
    id(12865368, '69646809366016000'),
    id(6675367, '448120961221525514'),
    id(16060432, '345670350773813250'),
    id(9402889, '546071644578512906'),
    id(8157492, '97530999214198784'),
    id(11805037, '439815748106321920'),
    id(12609866, '437122400170147843'),
    id(9526124, '682022252065456158'),
    id(13968504, '671166695116898314'),
    id(19884809, '300176143854731275'),
    id(7535045, '232557726784421888'),
    id(5403374, '552929895127318537'),
    id(9706291, '303514944115310592'),
    id(7856835, '163112401552670721'),
    id(4681578, '112722017622487040'),
    id(6632605, '269564402284363786'),
    id(5099768, '145570430252613632'),
    id(6928574, '131739760879337474'),
    id(7075211, '173864191764070407'),
    id(6693266, '179396405482356736'),
    id(8150535, '369370900090322944'),
    id(12904237, '322164853064204289'),
    id(16287466, '606319353163546634'),
    id(6221425, '168283763258687488'),
    id(11234706, '341180317651959811'),
    id(14309415, '295245302707781633'),
    id(18087655, '933547578946113546'),
    id(3942633, '257134763154866177'),
    id(13141032, '318022668173574144'),
    id(6968364, '134285412498669568'),
    id(8196548, '193508006900531200'),
    id(9453134, '265185622757474304'),
    id(14551370, '459483469375078400'),
    id(11658236, '701196843387715655')
  ];
  let users = await fetchUserData(userIds, db, osuClient, discordBotToken);
  let insertStaffMembers: (InferInsertModel<typeof dbStaffMember> & {
    staffRoleId: number;
  })[] = [];

  let host = users.find((user) => user.osuUserId === 8191845);
  let cohost = users.find((user) => user.osuUserId === 11955929);
  let sheeter = users.find((user) => user.osuUserId === 6814521);

  insertStaffMembers.push(
    {
      tournamentId,
      userId: host?.id || 0,
      staffRoleId: hostRole.id
    },
    {
      tournamentId,
      userId: cohost?.id || 0,
      staffRoleId: cohostRole.id
    },
    {
      tournamentId,
      userId: sheeter?.id || 0,
      staffRoleId: sheeterRole.id
    }
  );

  function map(users: NonNullable<typeof host>[], ids: number[], staffRoleId: number) {
    return users
      .filter((user) => ids.includes(user.osuUserId))
      .map((user) => ({
        tournamentId,
        staffRoleId,
        userId: user.id
      }));
  }

  let adminUserIds = [4420014, 8191845, 11955929];
  let admins = map(users, adminUserIds, adminRole.id);

  let modUserIds = [6263040, 13175102, 13456818, 2916205];
  let mods = map(users, modUserIds, modRole.id);

  let devUserIds = [8306102, 12455868, 8191845];
  let devs = map(users, devUserIds, devRole.id);

  let poolSelectorUserIds = [10108853, 15173952, 4420014];
  let poolSelectors = map(users, poolSelectorUserIds, poolSelectorRole.id);

  let mqaUserIds = [
    14806365, 9477784, 4420014, 10224047, 8443945, 11612720, 6036351, 12016150, 12139352, 13055978,
    9405745, 11310892, 12058601, 8401053, 11955929, 6843383, 7516954
  ];
  let mqa = map(users, mqaUserIds, mqaRole.id);

  let refUserIds = [
    6518510, 17959882, 8589763, 10108853, 6263040, 19650134, 9402889, 16060432, 13456818, 18315188,
    6675367, 4420014, 12865368, 11612720, 11730796, 4722369, 19030042, 9918921, 6814521, 13055978,
    12086495, 9074108, 6471972, 11955929
  ];
  let refs = map(users, refUserIds, refRole.id);

  let gfxUserIds = [13968504, 18315188, 9526124, 12609866, 11805037];
  let gfx = map(users, gfxUserIds, gfxRole.id);

  let cmqaUserIds = [11805037, 8157492];
  let cmqa = map(users, cmqaUserIds, cmqaRole.id);

  let mapperUserIds = [
    19884809, 3545323, 9074780, 7535045, 689997, 5403374, 4420014, 9706291, 7856835, 4681578,
    8157492, 6632605, 5099768, 6928574, 7075211, 6693266
  ];
  let mappers = map(users, mapperUserIds, mapperRole.id);

  let replayerUserIds = [
    654296, 14806365, 4420014, 10224047, 8150535, 8443945, 12904237, 16287466, 12016150, 12139352,
    6221425, 9405745, 11310892, 9047729, 12058601, 8191845, 9074108, 8401053, 6471972, 6843383,
    11234706, 7516954
  ];
  let replayers = map(users, replayerUserIds, replayerRole.id);

  let streamerUserIds = [
    13175102, 16060432, 6675367, 4420014, 14309415, 4722369, 2916205, 6221425, 18087655, 12455868
  ];
  let streamers = map(users, streamerUserIds, streamerRole.id);

  let commUserIds = [
    6518510, 3942633, 13175102, 13141032, 6968364, 4681578, 8196548, 9453134, 14309415, 4722369,
    6036351, 12139352, 6221425, 14551370, 8191845, 6471972, 11955929, 6693266, 11658236
  ];
  let comms = map(users, commUserIds, commentatorRole.id);

  insertStaffMembers.push(
    ...admins,
    ...mods,
    ...devs,
    ...poolSelectors,
    ...mqa,
    ...refs,
    ...gfx,
    ...cmqa,
    ...mappers,
    ...replayers,
    ...streamers,
    ...comms
  );

  let removedDuplicateMembers = [
    ...new Map(insertStaffMembers.map((member) => [member.userId, member])).values()
  ];
  let staffMembers = await db.insert(dbStaffMember).values(removedDuplicateMembers).returning({
    id: dbStaffMember.id
  });

  let relations: InferInsertModel<typeof dbStaffMemberToStaffRole>[] = [];

  for (let i = 0; i < staffMembers.length; i++) {
    relations.push({
      staffMemberId: staffMembers[i].id,
      staffRoleId: insertStaffMembers[i].staffRoleId
    });
  }

  await db.insert(dbStaffMemberToStaffRole).values(relations);

  return staffMembers;
}

export async function seedRealTournament(
  db: PostgresJsDatabase,
  osuClient: OsuClient,
  discordBotToken: string,
  storageEndpoint: string,
  storagePassword: string
) {
  console.log('\nSeed real tournament (5WC 2023)');

  let spinner = createSpinner('Create tournament').start();
  let [tournament] = await setTournament(db);
  spinner.success();

  spinner = createSpinner('Upload tournament assets').start();
  await setAssets(storageEndpoint, storagePassword, tournament.id);
  spinner.success();

  spinner = createSpinner('Create mod multipliers').start();
  await setModMultipliers(db, tournament.id);
  spinner.success();

  spinner = createSpinner('Create prizes').start();
  await setPrizes(db, tournament.id);
  spinner.success();

  spinner = createSpinner('Create stages & rounds').start();
  let [quals, ro32, ro16, qf, sf, f, gf] = await setStagesAndRounds(db, tournament.id);
  spinner.success();

  spinner = createSpinner('Create modpools').start();
  await setModpools(db, {
    quals: quals.id,
    ro32: ro32.id,
    ro16: ro16.id,
    qf: qf.id,
    sf: sf.id,
    f: f.id,
    gf: gf.id
  });
  spinner.success();

  spinner = createSpinner('Create staff members & staff roles').start();
  await setStaffMembersAndRoles(db, tournament.id, osuClient, discordBotToken);
  spinner.success();
}
