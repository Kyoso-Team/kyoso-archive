import './utils/polyfill';
import { describe, expect, it } from 'vitest';
import { modMultiplierChecks, modMultipliersChecks, tournamentChecks, tournamentDatesChecks, tournamentLinkChecks, tournamentLinksChecks, tournamentOtherDatesChecks, userFormFieldChecks, userFormFieldsChecks } from '$lib/helpers';
import { futureDate, pastDate } from './utils';
import { tournamentOtherDateChecks } from '../lib/helpers';

function getTypeOf(value: any) {
  return typeof value;
}

function errorArray(errorCount: number, successCount: number) {
  return new Array(errorCount).fill('string').concat(new Array(successCount).fill('undefined'));
}

describe.concurrent('Check functions', async () => {
  it('Tests tournamentChecks', () => {
    const invalidTeamSettings = tournamentChecks({
      type: 'teams',
      teamSettings: {
        minTeamSize: 2,
        maxTeamSize: 1
      }
    });
    const invalidRankRange = tournamentChecks({
      type: 'teams',
      rankRange: {
        lower: 2,
        upper: 1
      }
    });
    const soloWithTeamSettings = tournamentChecks({
      type: 'solo',
      teamSettings: {
        minTeamSize: 2,
        maxTeamSize: 2
      }
    });
    const teamsWithoutTeamSettings = tournamentChecks({
      type: 'teams'
    });
    const valid1 = tournamentChecks({
      type: 'teams',
      teamSettings: {
        minTeamSize: 2,
        maxTeamSize: 2
      },
      rankRange: {
        lower: 1,
        upper: 1
      }
    });
    const valid2 = tournamentChecks({
      type: 'solo',
      rankRange: {
        lower: 1
      }
    });
    const valid3 = tournamentChecks({
      type: 'solo',
      rankRange: {
        lower: 1,
        upper: 2
      }
    });

    expect([invalidRankRange, invalidTeamSettings, soloWithTeamSettings, teamsWithoutTeamSettings, valid1, valid2, valid3].map(getTypeOf)).toMatchObject(errorArray(4, 3));
  });

  it('Tests tournamentDatesChecks', () => {
    const now = new Date();
  
    const concludeBeforePublish1 = tournamentDatesChecks({
      concludesAt: pastDate
    }, {
      publishedAt: now
    });
    const concludeBeforePublish2 = tournamentDatesChecks({
      concludesAt: pastDate,
      publishedAt: now
    }, {});
    const publishAfterConclude1 = tournamentDatesChecks({
      publishedAt: futureDate
    }, {
      concludesAt: now
    });
    const publishAfterConclude2 = tournamentDatesChecks({
      publishedAt: futureDate,
      concludesAt: now
    }, {});
    const valid1 = tournamentDatesChecks({
      concludesAt: futureDate,
      playerRegsOpenAt: now
    }, {});
    const valid2 = tournamentDatesChecks({
      playerRegsOpenAt: now
    }, {
      publishedAt: pastDate,
      staffRegsCloseAt: futureDate
    });
    
    expect([concludeBeforePublish1, concludeBeforePublish2, publishAfterConclude1, publishAfterConclude2, valid1, valid2].map(getTypeOf)).toMatchObject(errorArray(4, 2));
  });

  it('Tests tournamentOtherDateChecks', () => {
    const invalidRange = tournamentOtherDateChecks([], {
      label: 'Date 1',
      onlyDate: false,
      fromDate: futureDate.getTime(),
      toDate: pastDate.getTime()
    });
    const duplicateLabel = tournamentOtherDateChecks([{
      label: 'Date 1',
      onlyDate: false,
      fromDate: pastDate.getTime(),
      toDate: futureDate.getTime()
    }], {
      label: 'Date 1',
      onlyDate: false,
      fromDate: pastDate.getTime(),
      toDate: futureDate.getTime()
    });
    const valid = tournamentOtherDateChecks([{
      label: 'Date 1',
      onlyDate: false,
      fromDate: pastDate.getTime(),
      toDate: futureDate.getTime()
    }], {
      label: 'Date 2',
      onlyDate: false,
      fromDate: pastDate.getTime(),
      toDate: futureDate.getTime()
    });

    expect([invalidRange, duplicateLabel, valid].map(getTypeOf)).toMatchObject(errorArray(2, 1));
  });

  it('Tests tournamentOtherDatesChecks', () => {
    const duplicateLabel = tournamentOtherDatesChecks([{
      label: 'Date 1',
      onlyDate: false,
      fromDate: pastDate.getTime(),
      toDate: futureDate.getTime()
    }, {
      label: 'Date 1',
      onlyDate: false,
      fromDate: pastDate.getTime(),
      toDate: futureDate.getTime()
    }]);
    const valid = tournamentOtherDatesChecks([{
      label: 'Date 1',
      onlyDate: false,
      fromDate: pastDate.getTime(),
      toDate: futureDate.getTime()
    }, {
      label: 'Date 2',
      onlyDate: false,
      fromDate: pastDate.getTime(),
      toDate: futureDate.getTime()
    }]);

    expect([duplicateLabel, valid].map(getTypeOf)).toMatchObject(errorArray(1, 1));
  });

  it('Tests tournamentLinkChecks', () => {
    const duplicateLabel = tournamentLinkChecks([{
      icon: 'osu',
      label: 'Forum Post',
      url: 'https://osu.ppy.sh'
    }], {
      icon: 'osu',
      label: 'Forum Post',
      url: 'https://osu.ppy.sh'
    });
    const valid = tournamentLinkChecks([{
      icon: 'osu',
      label: 'Forum Post',
      url: 'https://osu.ppy.sh'
    }], {
      icon: 'twitch',
      label: 'Twitch Channel',
      url: 'https://twitch.tv'
    });

    expect([duplicateLabel, valid].map(getTypeOf)).toMatchObject(errorArray(1, 1));
  });

  it('Tests tournamentLinksChecks', () => {
    const duplicateLabel = tournamentLinksChecks([{
      icon: 'osu',
      label: 'Forum Post',
      url: 'https://osu.ppy.sh'
    }, {
      icon: 'osu',
      label: 'Forum Post',
      url: 'https://osu.ppy.sh'
    }]);
    const valid = tournamentLinksChecks([{
      icon: 'osu',
      label: 'Forum Post',
      url: 'https://osu.ppy.sh'
    }, {
      icon: 'twitch',
      label: 'Twitch Channel',
      url: 'https://twitch.tv'
    }]);

    expect([duplicateLabel, valid].map(getTypeOf)).toMatchObject(errorArray(1, 1));
  });

  it('Tests modMultiplierChecks', () => {
    const invalidModCombo1 = modMultiplierChecks([], {
      mods: ['ez', 'hr'],
      multiplier: 1
    });
    const invalidModCombo2 = modMultiplierChecks([], {
      mods: ['ez', 'ez'],
      multiplier: 1
    });
    const invalidMultiplierValues = modMultiplierChecks([], {
      mods: ['sd'],
      multiplier: {
        ifFailed: 2,
        ifSuccessful: 1
      }
    });
    const duplicateModCombo = modMultiplierChecks([{
      mods: ['hd', 'hr'],
      multiplier: 1
    }], {
      mods: ['hd', 'hr'],
      multiplier: 1
    });
    const valid = modMultiplierChecks([{
      mods: ['ez'],
      multiplier: 2.2
    }], {
      mods: ['sd'],
      multiplier: {
        ifFailed: 0,
        ifSuccessful: 2.5
      }
    });

    expect([invalidModCombo1, invalidModCombo2, invalidMultiplierValues, duplicateModCombo, valid].map(getTypeOf)).toMatchObject(errorArray(4, 1));
  });

  it('Tests modMultipliersChecks', () => {
    const duplicateModCombo = modMultipliersChecks([{
      mods: ['hd', 'hr'],
      multiplier: 1
    }, {
      mods: ['hd', 'hr'],
      multiplier: 1
    }]);
    const valid = modMultipliersChecks([{
      mods: ['ez'],
      multiplier: 2.2
    }, {
      mods: ['fl'],
      multiplier: 2.2
    }]);

    expect([duplicateModCombo, valid].map(getTypeOf)).toMatchObject(errorArray(1, 1));
  });

  const userFormFieldDefaults = {
    deleted: false,
    validation: null,
    optional: false,
    description: null,
    min: null,
    max: null
  } as const;

  it('Tests userFormFieldChecks', () => {
    const invalidRange = userFormFieldChecks([], {
      ...userFormFieldDefaults,
      type: 'long-text',
      min: 5,
      max: 4,
      id: '12345678',
      title: 'Field 1'
    });
    const duplicateId = userFormFieldChecks([{
      ...userFormFieldDefaults,
      type: 'long-text',
      id: '12345678',
      title: 'Field 1'
    }], {
      ...userFormFieldDefaults,
      type: 'long-text',
      id: '12345678',
      title: 'Field 2'
    });
    const valid = userFormFieldChecks([{
      ...userFormFieldDefaults,
      type: 'long-text',
      id: '12345678',
      title: 'Field 1'
    }], {
      ...userFormFieldDefaults,
      type: 'long-text',
      id: '87654321',
      title: 'Field 2'
    });

    expect([invalidRange, duplicateId, valid].map(getTypeOf)).toMatchObject(errorArray(2, 1));
  });

  it('Tests userFormFieldsChecks', () => {
    const duplicateId = userFormFieldsChecks([{
      ...userFormFieldDefaults,
      type: 'long-text',
      id: '12345678',
      title: 'Field 1'
    }, {
      ...userFormFieldDefaults,
      type: 'long-text',
      id: '12345678',
      title: 'Field 2'
    }]);
    const valid = userFormFieldsChecks([{
      ...userFormFieldDefaults,
      type: 'long-text',
      id: '12345678',
      title: 'Field 1'
    }, {
      ...userFormFieldDefaults,
      type: 'long-text',
      id: '87654321',
      title: 'Field 2'
    }]);

    expect([duplicateId, valid].map(getTypeOf)).toMatchObject(errorArray(1, 1));
  });
});
