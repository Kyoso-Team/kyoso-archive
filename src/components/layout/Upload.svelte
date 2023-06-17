<script lang="ts">
  import { LoadingIcon, CheckIcon, Tooltip } from '$components';
  import { FileButton, popup } from '@skeletonlabs/skeleton';
  import { upload, error } from '$stores';
  import { tooltip } from '$lib/utils';

  let fileNameTooltipTarget = 'full-file-name';
  let files: FileList | undefined;
  let currentImageUrl: string | undefined;
  let errMsg: string | undefined;
  let isUploading = false;
  let hasUploaded = false;

  $: {
    let file = files?.item(0);

    if (file && $upload?.isImg) {
      currentImageUrl = URL.createObjectURL(file);
    }

    if (!file) {
      currentImageUrl = undefined;
    }
  }

  async function onUpload() {
    if (!$upload) return;

    try {
      isUploading = true;
      let resp = await upload.uploadFile($upload, files?.item(0));
      
      if (resp.includes('success')) {
        hasUploaded = true;
      } else {
        errMsg = resp;
      }

      isUploading = false;
    } catch(err: any) {
      console.error(err);
      error.set($error, err, 'close', true);
    }
  }

  function onClose() {
    if (!$upload) return;
    upload.destroy();
  }

  function onTryAgain() {
    hasUploaded = false;
    isUploading = false;
    errMsg = undefined;
  }
</script>

{#if $upload}
  <div class={`card bg-surface-800 flex items-center flex-col p-6 ${hasUploaded || isUploading ? 'w-64' : 'w-80 sm:w-[30rem]'}`}>
    {#if hasUploaded || isUploading || errMsg}
      <div class="flex gap-2">
        {#if errMsg}
          <div class="max-w-full"><span class="text-error-500">Error:</span> {errMsg}</div>
        {:else if hasUploaded}
          <div class="min-w-max">File uploaded</div>
          <CheckIcon w={25} h={25} styles="fill-tertiary-500" />
        {:else}
          <div class="min-w-max">Uploading file...</div>
          <LoadingIcon w={25} h={25} styles="fill-tertiary-500" />
        {/if}
      </div>
      {#if hasUploaded || errMsg}
        <div class="mt-4">
          {#if errMsg}
            <button class="btn variant-filled-primary" on:click={onTryAgain}>Try Again</button>
          {:else}
            <button class="btn variant-filled-primary" on:click={onClose}>Close</button>
          {/if}
        </div>
      {/if}
    {:else}
      <h2 class="pb-4 text-center">Upload File</h2>
      {#if $upload.isImg}
        <div class="mb-2 w-full">
          <span>Preview:</span>
          <div class="card flex justify-center aspect-[21/9]">
            <div
              style={`aspect-ratio: ${$upload.imgAspectRatio};`}
              class="card bg-surface-backdrop-token relative w-auto h-full overflow-hidden border border-primary-600 flex items-center justify-center"
            >
              {#if currentImageUrl}
                <img
                  src={currentImageUrl}
                  alt="uploaded-img"
                  class={`absolute -inset-full m-auto ${$upload.limitBy === 'height' ? 'w-auto h-full' : 'h-auto w-full' }`}
                />
              {:else}
                <div class="text-gray-500 text-md sm:text-lg text-center px-2">No file selected</div>
              {/if}
            </div>
          </div>
        </div>
      {/if}
      <div class="flex gap-2 w-full">
        <FileButton
          name="file"
          width="text-sm block py-1"
          accept={$upload.accept.reduce((str, fileType) => `${str},.${fileType}`, '').substring(1)}
          bind:files={files}
        >Choose File</FileButton>
        <div
          class="rounded-md px-2 pt-1 text-sm bg-surface-backdrop-token w-full max-w-full overflow-hidden whitespace-nowrap text-ellipsis"
          use:popup={tooltip(fileNameTooltipTarget)}
        >
          <Tooltip
            target={fileNameTooltipTarget}
            label={files?.item(0) ? (files?.item(0)?.name || '') : 'No file selected'}
          />
          {#if files?.item(0)}
            {files?.item(0)?.name || ''}
          {:else}
            No file selected...
          {/if}
        </div>
      </div>
      <div class="mt-4">
        <button
          class="btn variant-filled-primary"
          disabled={!files?.item(0)}
          on:click={onUpload}
        >Upload</button>
        <button class="btn variant-ringed-primary" on:click={onClose}>Cancel</button>
      </div>
    {/if}
  </div>
{/if}