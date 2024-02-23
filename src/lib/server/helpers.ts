import * as v from 'valibot';
import sharp from 'sharp';
import env from '$lib/server/env';
import { Country, DiscordUser, OsuBadge, OsuUser, OsuUserAwardedBadge, Session, StaffMember, StaffMemberRole, StaffRole, db } from '$db';
import { discordMainAuth } from './constants';
import { pick, sveltekitError } from '../server-utils';
import { Client } from 'osu-web.js';
import { and, eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { fileSchema } from '$lib/schemas';
import type DiscordOAuth2 from 'discord-oauth2';
import type { Token } from 'osu-web.js';
import type { AuthSession, FileType, Simplify } from '$types';
import type { StaffPermission } from '$db';

export async function upsertDiscordUser(token: DiscordOAuth2.TokenRequestResult, tokenIssuedAt: Date, route: { id: string | null; }, update?: {
  discordUserId: string;
}) {
  let user!: Awaited<ReturnType<DiscordOAuth2['getUser']>>;

  try {
    user = await discordMainAuth.getUser(token.access_token);
  } catch (err) {
    throw await sveltekitError(err, 'Getting the user\'s Discord data', route);
  }

  const set = {
    username: user.username,
    token: {
      accesstoken: token.access_token,
      refreshToken: token.refresh_token,
      tokenIssuedAt: tokenIssuedAt.getTime()
    }
  } satisfies Partial<typeof DiscordUser.$inferInsert>;
  
  try {
    if (update?.discordUserId) {
      await db
        .update(DiscordUser)
        .set(set)
        .where(eq(DiscordUser.discordUserId, update.discordUserId));
    } else {
      await db
        .insert(DiscordUser)
        .values({
          ...set,
          discordUserId: user.id
        })
        .onConflictDoUpdate({
          target: [DiscordUser.discordUserId],
          set
        });
    }
  } catch (err) {
    throw await sveltekitError(err, `${update ? 'Updating': 'Upserting'} the user's Discord data`, route);
  }

  return user;
}

export async function upsertOsuUser(token: Token, tokenIssuedAt: Date, route: { id: string | null; }, update?: {
  osuUserId: number;
}) {
  const osu = new Client(token.access_token);
  let user!: Awaited<ReturnType<Client['users']['getSelf']>>;

  try {
    user = await osu.users.getSelf({
      urlParams: {
        mode: 'osu'
      }
    });
  } catch (err) {
    throw await sveltekitError(err, 'Getting the user\'s osu! data', route);
  }

  try {
    await db
      .insert(Country)
      .values({
        code: user.country.code,
        name: user.country.name
      })
      .onConflictDoNothing({
        target: [Country.code]
      });
  } catch (err) {
    throw await sveltekitError(err, 'Creating the user\'s country', route);
  }

  const badges: typeof OsuBadge.$inferInsert[] = user.badges.map((badge) => ({
    description: badge.description,
    imgFileName: badge.image_url.split('/').at(-1) || ''
  }));

  if (badges.length > 0) {
    try {
      await db
        .insert(OsuBadge)
        .values(badges)
        .onConflictDoNothing({
          target: [OsuBadge.imgFileName]
        });
    } catch (err) {
      throw await sveltekitError(err, 'Creating the user\'s badges', route);
    }
  }


  const set = {
    countryCode: user.country.code,
    restricted: user.is_restricted,
    username: user.username,
    globalStdRank: user.statistics.global_rank,
    token: {
      accesstoken: token.access_token,
      refreshToken: token.refresh_token,
      tokenIssuedAt: tokenIssuedAt.getTime()
    }
  } satisfies Partial<typeof OsuUser.$inferInsert>;

  try {
    if (update?.osuUserId) {
      await db
        .update(OsuUser)
        .set(set)
        .where(eq(OsuUser.osuUserId, update.osuUserId));
    } else {
      await db
        .insert(OsuUser)
        .values({
          ...set,
          osuUserId: user.id
        })
        .onConflictDoUpdate({
          target: [OsuUser.osuUserId],
          set
        });
    }
  } catch (err) {
    throw await sveltekitError(err, `${update ? 'Updating': 'Upserting'} the user's osu! data`, route);
  }

  // NOTE: If a badge has been removed from the user, this case isn't hadled due to the very high unlikelyhood of this happening

  const awardedBadges: typeof OsuUserAwardedBadge.$inferInsert[] = user.badges.map((badge) => ({
    awardedAt: new Date(badge.awarded_at),
    osuBadgeImgFileName: badge.image_url.split('/').at(-1) || '',
    osuUserId: user?.id || 0
  }));

  if (awardedBadges.length > 0) {
    try {
      await db
        .insert(OsuUserAwardedBadge)
        .values(awardedBadges)
        .onConflictDoNothing({
          target: [OsuUserAwardedBadge.osuBadgeImgFileName, OsuUserAwardedBadge.osuUserId]
        });
    } catch (err) {
      throw await sveltekitError(err, 'Linking the user and their awarded badges', route);
    }
  }

  return user;
}

export async function createSession(userId: number, ipAddress: string, userAgent: string, route: { id: string | null; }) {
  // Get the public IP address of the local machine, if not done, `ipAddress` will be '::1'
  if (env.ENV === 'development') {
    try {
      const resp = await fetch('https://api64.ipify.org');
      ipAddress = await resp.text();
    } catch (err) {
      throw await sveltekitError(err, 'Getting your public IP address information', route);
    }
  }

  let ipMeta!: {
    city: string;
    region: string;
    country: string;
  };

  try {
    const resp = await fetch(`https://ipinfo.io/${ipAddress}?token=${env.IPINFO_API_ACCESS_TOKEN}`);
    ipMeta = await resp.json();
  } catch (err) {
    throw await sveltekitError(err, 'Getting the IP address\' information', route);
  }

  let session!: Pick<typeof Session.$inferSelect, 'id'>;

  try {
    session = await db
      .insert(Session)
      .values({
        userId,
        ipAddress,
        userAgent,
        ipMetadata: {
          city: ipMeta.city,
          region: ipMeta.region,
          country: ipMeta.country
        }
      })
      .returning(pick(Session, ['id']))
      .then((session) => session[0]);
  } catch (err) {
    throw await sveltekitError(err, 'Creating the session', route);
  }

  return session;
}

export async function parseUploadFormData<T extends Record<string, v.BaseSchema>>(request: Request, route: { id: string | null }, schemas: T): Promise<Simplify<{
  file: File;
} & { [K in keyof T]: v.Output<T[K]> }>> {
  let fd!: FormData;

  try {
    fd = await request.formData();
  } catch (err) {
    error(400, 'Body is malformed or isn\'t form data');
  }

  const data: Record<string, any> = {};
  
  try {
    const file = v.parse(fileSchema, fd.get('file'));
    data.file = file;

    for (const key in schemas) {
      data[key] = v.parse(schemas[key], fd.get(key));
    }
  } catch (err) {
    if (err instanceof v.ValiError) {
      let str = 'Invalid input:\n';
      const issues = v.flatten(err.issues).nested;


      for (const key in issues) {
        str += `- body.${key} should ${issues[key]}\n`;
      }

      str = str.trimEnd();
      error(400, str);
    } else {
      throw await sveltekitError(err, 'Parsing the form data', route);
    }
  }

  return data as any;
}

export async function parseSearchParams<T extends Record<string, v.BaseSchema>>(url: URL, route: { id: string | null }, schemas: T): Promise<{ [K in keyof T]: v.Output<T[K]> }> {
  const data: Record<string, any> = {};
  
  try {
    for (const key in schemas) {
      data[key] = v.parse(schemas[key], url.searchParams.get(key));
    }
  } catch (err) {
    if (err instanceof v.ValiError) {
      let str = 'Invalid input:\n';
      const issues = v.flatten(err.issues).nested;

      for (const key in issues) {
        str += `- Param "${key}" should ${issues[key]}\n`;
      }

      str = str.trimEnd();
      error(400, str);
    } else {
      throw await sveltekitError(err, 'Parsing the URL search parameters', route);
    }
  }

  return data as any;
}

export async function transformFile(config: {
  file: File;
  validations?: {
    maxSize?: number;
    types?: FileType[];
  };
  resizes?: {
    name: string;
    width: number;
    height: number;
    quality: number;
  }[];
}) {
  const { file, validations, resizes } = config;

  if (validations?.maxSize && config.file.size > validations.maxSize) {
    const bytes = new Intl.NumberFormat('us-US').format(validations.maxSize);
    error(413, `File is too large. Size limit is of ${bytes} bytes`);
  }

  if (validations?.types) {
    const splitName = file.name.split('.');
    const extension = splitName[splitName.length - 1];

    if (!validations.types.find((type) => type === extension)) {
      error(400, `You can't upload .${extension} files`);
    }
  }

  if (!resizes) return [];

  return await Promise.all(
    resizes.map(async ({ width, height, quality, name }) => {
      const buffer = await file.arrayBuffer();
      const newBuffer = await sharp(buffer)
        .resize({ width, height })
        .jpeg({ quality })
        .toBuffer();

      const newFile = new File([new Blob([newBuffer]) as any], name, {
        lastModified: new Date().getTime()
      });

      return newFile;
    })
  );
}

export async function uploadFile(route: { id: string | null }, folderName: string, file: File) {
  try {
    await fetch(`https://${env.BUNNY_HOSTNAME}/${env.BUNNY_USERNAME}/${folderName}/${file.name}`, {
      method: 'PUT',
      headers: {
        'AccessKey': env.BUNNY_PASSWORD,
        'content-type': 'application/octet-stream'
      },
      body: file
    });
  } catch (err) {
    throw await sveltekitError(err, 'Uploading the file', route);
  }
}

export async function deleteFile(route: { id: string | null }, folderName: string, fileName: string) {
  try {
    await fetch(`https://${env.BUNNY_HOSTNAME}/${env.BUNNY_USERNAME}/${folderName}/${fileName}`, {
      method: 'DELETE',
      headers: {
        AccessKey: env.BUNNY_PASSWORD
      }
    });
  } catch (err) {
    throw await sveltekitError(err, 'Deleting the file', route);
  }
}

export async function getFile(route: { id: string | null }, folderName: string, fileName: string) {
  let resp!: Response;

  try {
    resp = await fetch(`https://${env.BUNNY_HOSTNAME}/${env.BUNNY_USERNAME}/${folderName}/${fileName}`, {
      headers: {
        accept: '*/*',
        AccessKey: env.BUNNY_PASSWORD
      }
    });
  } catch (err) {
    throw await sveltekitError(err, 'Getting the file', route);
  }

  if (resp.status === 404) {
    error(404, 'File not found');
  }

  if (!resp.ok) {
    const baseMsg = 'Unexpected response from Bunny.net';
    console.log(`${baseMsg}: ${await resp.text()}`);
    error(resp.status as any, baseMsg);
  }

  return await resp.blob();
}

export async function getStaffMember<T extends AuthSession | undefined>(route: { id: string | null }, session: T, tournamentId: number): Promise<T extends AuthSession ? {
  id: number;
  permissions: (typeof StaffPermission.enumValues)[number][]
} : undefined> {
  if (!session) {
    return undefined as any;
  };

  let staffMember!: {
    id: number;
    permissions: (typeof StaffPermission.enumValues)[number][]
  };

  try {
    staffMember = await db
      .select({
        id: StaffMember.id,
        permissions: StaffRole.permissions
      }).from(StaffMemberRole)
      .innerJoin(StaffMember, eq(StaffMember.id, StaffMemberRole.staffMemberId))
      .innerJoin(StaffRole, eq(StaffRole.id, StaffMemberRole.staffRoleId))
      .where(and(
        eq(StaffMember.userId, session.userId),
        eq(StaffRole.tournamentId, tournamentId)
      ))
      .then((rows) => ({
        id: rows[0].id,
        permissions: Array.from(new Set(rows.map(({ permissions }) => permissions).flat()))
      }));
  } catch (err) {
    throw await sveltekitError(err, 'Getting the current user as a staff member', route);
  }

  return staffMember as any;
}