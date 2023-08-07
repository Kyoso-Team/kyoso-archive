import prisma from '$prisma';
import { z } from 'zod';
import { t, tryCatch } from '$trpc';
import { getUserAsStaff } from '$trpc/middleware';
import { whereIdSchema, withTournamentSchema } from '$lib/schemas';
import { isAllowed } from '$lib/server-utils';
import { hasPerms } from '$lib/utils';

const soloRouter = t.router({});

export default soloRouter;
