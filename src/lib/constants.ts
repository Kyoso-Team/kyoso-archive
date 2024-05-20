import * as f from '$lib/form-validation';
import { keys } from './utils';
import type { TournamentType } from '$db';
import type { InferEnum } from '$types';

/** GMT: Saturday, February 24, 2024 12:00:00 AM */
export const oldestDatePossible = new Date(1708732800000);

export const tournamentTypeOptions: Record<InferEnum<typeof TournamentType>, string> = {
  draft: 'Draft',
  solo: 'Solo',
  teams: 'Teams'
};

export const baseTournamentFormSchemas = {
  name: f.string([f.minStrLength(2), f.maxStrLength(50)]),
  acronym: f.string([f.minStrLength(2), f.maxStrLength(8)]),
  urlSlug: f.string([f.minStrLength(2), f.maxStrLength(16), f.slug()]),
  type: f.union(keys(tournamentTypeOptions)),
  openRank: f.boolean()
};

export const baseTeamSettingsFormSchemas = {
  minTeamSize: f.number([f.integer(), f.minValue(1), f.maxValue(16)]),
  maxTeamSize: f.number([f.integer(), f.minValue(1), f.maxValue(16)])
};

export const rankRangeFormSchemas = {
  lower: f.number([f.integer(), f.minValue(1), f.maxSafeInt()]),
  upper: f.optional(f.number([f.integer(), f.minValue(1), f.maxSafeInt()]))
};
