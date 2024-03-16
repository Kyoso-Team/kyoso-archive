import { userIds } from '../utils';
import type { SeedTournament } from './type';
import type {
  BWSValues,
  RankRange,
  RefereeSettings,
  TeamSettings,
  TournamentDates,
  TournamentLink
} from '../../../src/lib/types';

export const tournament5wc2023: SeedTournament = {
  data: {
    acronym: '5WC2023',
    name: '5 Digit World Cup 2023',
    type: 'teams',
    urlSlug: '5wc_2023',
    createdAt: new Date(1672466400000 - 86400000),
    rules: '',
    bannerMetadata: {
      fileId: 'oXlNIxqu'
    },
    logoMetadata: {
      fileId: 'ueRq1peH'
    },
    bwsValues: {
      x: 0.9937,
      y: 2,
      z: 1
    } as BWSValues,
    rankRange: {
      lower: 10000,
      upper: 99999
    } as RankRange,
    dates: {
      publish: 1672444800000,
      concludes: 1681084800000,
      playerRegs: {
        open: 1672531200000,
        close: 1674345600000
      },
      other: [
        {
          label: 'Screening Buffer',
          fromDate: 1674345600000,
          toDate: 1675555200000
        },
        {
          label: 'Team Submission Deadline',
          fromDate: 1676160000000
        },
        {
          label: 'Qualifiers Showcase',
          fromDate: 1676246400000
        },
        {
          label: 'Qualifiers',
          fromDate: 1677196800000,
          toDate: 1677456000000
        },
        {
          label: 'Round of 32',
          fromDate: 1677801600000,
          toDate: 1678060800000
        },
        {
          label: 'Round of 16',
          fromDate: 1678406400000,
          toDate: 1678665600000
        },
        {
          label: 'Quarterfinals',
          fromDate: 1679011200000,
          toDate: 1679270400000
        },
        {
          label: 'Semifinals',
          fromDate: 1679616000000,
          toDate: 1679875200000
        },
        {
          label: 'Finals',
          fromDate: 1680220800000,
          toDate: 1680480000000
        },
        {
          label: 'Grand Finals',
          fromDate: 1680825600000,
          toDate: 1681084800000
        }
      ]
    } as TournamentDates,
    refereeSettings: {
      allow: {
        doubleBan: true,
        doublePick: true,
        doubleProtect: true
      },
      alwaysForceNoFail: true,
      banAndProtectCancelOut: false,
      order: {
        ban: 'snake',
        pick: 'snake',
        protect: 'snake'
      },
      timerLength: {
        ban: 120,
        pick: 120,
        protect: 120,
        ready: 120,
        start: 10
      },
      winCondition: 'score'
    } as RefereeSettings,
    teamSettings: {
      maxTeamSize: 8,
      minTeamSize: 4,
      useTeamBanners: false
    } as TeamSettings,
    links: [
      {
        icon: 'osu',
        label: 'Forum Post',
        url: 'https://osu.ppy.sh/community/forums/topics/1699537'
      },
      {
        icon: 'google_sheets',
        label: 'Main Sheet',
        url: 'https://docs.google.com/spreadsheets/d/1ix6Os18DffbDzZ2iHW0XUHG_hN-Gq8VZ1Gi1XkkSSqo/edit?usp=sharing'
      },
      {
        icon: 'discord',
        label: 'Discord',
        url: 'https://discord.gg/5wc'
      },
      {
        icon: 'website',
        label: 'Registrations',
        url: 'https://5wc.stagec.xyz/'
      },
      {
        icon: 'challonge',
        label: 'Bracket',
        url: 'https://challonge.com/5wc23'
      },
      {
        icon: 'donate',
        label: 'Donations',
        url: 'https://www.paypal.com/paypalme/kaguyaproject'
      },
      {
        icon: 'website',
        label: "Pick'em",
        url: 'https://pickem.hwc.hr/tournaments/103'
      },
      {
        icon: 'google_sheets',
        label: 'Stats Sheet',
        url: 'https://docs.google.com/spreadsheets/d/1k9w4ydcox3hjCsYodRfCdeUSPpVd00L35mfkAVn2MYM/edit?usp=sharing'
      },
      {
        icon: 'twitch',
        label: 'Twitch',
        url: 'https://www.twitch.tv/stagetournaments'
      },
      {
        icon: 'twitch',
        label: 'Backup Twitch',
        url: 'https://www.twitch.tv/stagetournaments2'
      }
    ] as TournamentLink[]
  },
  users: [
    userIds(8191845, '146092837723832320'),
    userIds(11955929, '289792596287553538'),
    userIds(4420014, '116354994986287104'),
    userIds(6263040, '289386538280812555'),
    userIds(13175102, '921042129076252752'),
    userIds(13456818, '379076400394666004'),
    userIds(2916205, '125364675750658048'),
    userIds(8306102, '690827021713932338'),
    userIds(12455868, '345003515594276865'),
    userIds(6814521, '194166972353609728'),
    userIds(10108853, '316966168118427658'),
    userIds(15173952, '353179479121723394'),
    userIds(14806365, '333974041360597005'),
    userIds(9477784, '152239941131304961'),
    userIds(10224047, '271416646218940428'),
    userIds(8443945, '239830099707428864'),
    userIds(11612720, '290568322548760583'),
    userIds(6036351, '152922854818709504'),
    userIds(12016150, '334753120750010368'),
    userIds(12139352, '402166312442265600'),
    userIds(13055978, '494879262202134548'),
    userIds(9405745, '219482971063844873'),
    userIds(11310892, '145362663625588746'),
    userIds(12058601, '194198021829951489'),
    userIds(8401053, '493320468141572117'),
    userIds(6843383, '183642161709973506'),
    userIds(7516954, '96315503361941504'),
    userIds(6518510, '147132196321361920'),
    userIds(17959882, '277756101414354945'),
    userIds(8589763, '143085788601516032'),
    userIds(19650134, '224542267422015489'),
    userIds(18315188, '133345027660316673'),
    userIds(6471972, '123083258920435714'),
    userIds(9074108, '276737814664839169'),
    userIds(12086495, '704298675320520716'),
    userIds(9918921, '296804750295302145'),
    userIds(19030042, '927649542344699915'),
    userIds(4722369, '182331250206310411'),
    userIds(11730796, '357353427535265792'),
    userIds(12865368, '69646809366016000'),
    userIds(6675367, '448120961221525514'),
    userIds(16060432, '345670350773813250'),
    userIds(9402889, '546071644578512906'),
    userIds(8157492, '97530999214198784'),
    userIds(11805037, '439815748106321920'),
    userIds(12609866, '437122400170147843'),
    userIds(9526124, '682022252065456158'),
    userIds(13968504, '671166695116898314'),
    userIds(19884809, '300176143854731275'),
    userIds(7535045, '232557726784421888'),
    userIds(5403374, '552929895127318537'),
    userIds(9706291, '303514944115310592'),
    userIds(7856835, '163112401552670721'),
    userIds(4681578, '112722017622487040'),
    userIds(6632605, '269564402284363786'),
    userIds(5099768, '145570430252613632'),
    userIds(6928574, '131739760879337474'),
    userIds(7075211, '173864191764070407'),
    userIds(6693266, '179396405482356736'),
    userIds(8150535, '369370900090322944'),
    userIds(12904237, '322164853064204289'),
    userIds(16287466, '606319353163546634'),
    userIds(6221425, '168283763258687488'),
    userIds(11234706, '341180317651959811'),
    userIds(14309415, '295245302707781633'),
    userIds(18087655, '933547578946113546'),
    userIds(3942633, '257134763154866177'),
    userIds(13141032, '318022668173574144'),
    userIds(6968364, '134285412498669568'),
    userIds(8196548, '193508006900531200'),
    userIds(9453134, '265185622757474304'),
    userIds(14551370, '459483469375078400'),
    userIds(11658236, '701196843387715655')
  ]
};
