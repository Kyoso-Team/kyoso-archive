<script lang="ts">
  import * as f from '$lib/form-validation';
  import { Form, Number, SelectMultiple, Section } from '$components/form';
  import { createForm } from '$stores';
  import { keys, toastError } from '$lib/utils';
  import { modMultiplierchecks } from '$lib/helpers';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import type { ModMultiplier } from '$types';
  import type { Tournament } from '$db';

  export let show: boolean;
  export let modMultipliersHaveUpdated: boolean;
  export let modMultipliers: (typeof Tournament.$inferSelect)['modMultipliers'];
  export let editIndex: number | undefined = undefined;
  let disabledMods: Partial<Record<ModMultiplier['mods'][number], boolean>> = {};
  const toast = getToastStore();
  const updating = editIndex !== undefined ? modMultipliers[editIndex] : undefined;
  const modsOptions: Record<ModMultiplier['mods'][number], string> = {
    bl: 'Blinds (BL)',
    ez: 'Easy (EZ)',
    fl: 'Flashlight (FL)',
    hd: 'Hidden (HD)',
    hr: 'Hard Rock (HR)',
    pf: 'Perfect (PF)',
    sd: 'Sudden Death (SD)'
  };
  const mainForm = createForm(
    {
      mods: f.array(f.union(keys(modsOptions)), [f.minArrayLength(1), f.maxArrayLength(5)]),
      multiplier: f.number([f.minValue(-5), f.maxValue(5)])
    },
    updating && {
      mods: updating.mods,
      multiplier:
        typeof updating.multiplier === 'number'
          ? updating.multiplier
          : updating.multiplier.ifSuccessful
    }
  );
  const failModForm = createForm(
    {
      ifFailed: f.number([f.minValue(-5), f.maxValue(5)])
    },
    updating && typeof updating.multiplier !== 'number'
      ? {
          ifFailed: updating.multiplier.ifFailed
        }
      : undefined
  );
  const labels = {
    ...mainForm.labels,
    ...failModForm.labels
  };

  async function submit() {
    const { mods, multiplier } = mainForm.getFinalValue($mainForm);
    const failModConfig = usingFailMod ? failModForm.getFinalValue($failModForm) : undefined;

    let newModMultiplier!: ModMultiplier;

    if (failModConfig) {
      const modMultiplier: Extract<ModMultiplier, { multiplier: Record<string, any> }> = {
        mods,
        multiplier: {
          ifSuccessful: multiplier,
          ifFailed: failModConfig.ifFailed
        }
      };
      newModMultiplier = modMultiplier as any;
    } else {
      const modMultiplier: Extract<ModMultiplier, { multiplier: number }> = {
        mods: mods as any,
        multiplier
      };
      newModMultiplier = modMultiplier as any;
    }

    newModMultiplier.mods = newModMultiplier.mods.sort((a, b) => a.localeCompare(b));
    const err = modMultiplierchecks(modMultipliers, newModMultiplier);

    if (err) {
      toastError(toast, err);
      return;
    }

    if (editIndex !== undefined) {
      modMultipliers[editIndex] = newModMultiplier;
    } else {
      modMultipliers.push(newModMultiplier);
    }

    modMultipliers = [...modMultipliers];
    show = false;
    modMultipliersHaveUpdated = true;

    setTimeout(() => {
      editIndex = undefined;
    }, 150);
  }

  function cancel() {
    show = false;

    setTimeout(() => {
      editIndex = undefined;
    }, 150);
  }

  $: {
    const mods = $mainForm.value.mods;
    const disabled = disabledMods;

    disabled.bl = mods.includes('fl');
    disabled.ez = mods.includes('hr');
    disabled.fl = mods.includes('bl');
    disabled.hr = mods.includes('ez');
    disabled.pf = mods.includes('sd');
    disabled.sd = mods.includes('pf');

    disabledMods = { ...disabledMods };
  }

  $: usingFailMod = $mainForm.value.mods.includes('pf') || $mainForm.value.mods.includes('sd');
</script>

<Form {submit}>
  <svelte:fragment slot="header">
    <span class="title">{editIndex !== undefined ? 'Edit' : 'Add'} Mod Multiplier</span>
  </svelte:fragment>
  <SelectMultiple
    form={mainForm}
    label={labels.mods}
    legend="Mods"
    options={modsOptions}
    disabledOptions={disabledMods}
    disabled={editIndex !== undefined}
  >
    Which mods should be applied to this multiplier?
  </SelectMultiple>
  <Number
    form={mainForm}
    label={labels.multiplier}
    legend={usingFailMod ? 'Multiplier if successful' : 'Multiplier'}
  >
    {usingFailMod
      ? 'Multiplier applied when a player passes with SD or PF'
      : 'Multiplier applied for the selected mods'}.
  </Number>
  {#if usingFailMod}
    <Section>
      <Number form={failModForm} label={labels.ifFailed} legend="Multiplier if failed">
        Multiplier applied when a player fails with SD or PF.
      </Number>
    </Section>
  {/if}
  <svelte:fragment slot="actions">
    <button
      type="submit"
      class="btn variant-filled-primary"
      disabled={!(
        $mainForm.canSubmit &&
        (usingFailMod ? $failModForm.canSubmit : true) &&
        (editIndex !== undefined ? $mainForm.hasUpdated : true)
      )}>Submit</button
    >
    <button type="button" class="btn variant-filled" on:click={cancel}>Cancel</button>
  </svelte:fragment>
</Form>
