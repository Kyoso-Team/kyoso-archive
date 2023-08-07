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
    } catch (err) {
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
  <div
    class={`card flex flex-col items-center bg-surface-800 p-6 ${
      hasUploaded || isUploading ? 'w-64' : 'w-80 sm:w-[30rem]'
    }`}
  >
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
          <div class="card flex aspect-[21/9] justify-center">
            <div
              style={`aspect-ratio: ${$upload.imgAspectRatio};`}
              class="card relative flex h-full w-auto items-center justify-center overflow-hidden border border-primary-600 bg-surface-backdrop-token"
            >
              {#if currentImageUrl}
                <img
                  src={currentImageUrl}
                  alt="uploaded-img"
                  class={`absolute -inset-full m-auto ${
                    $upload.limitBy === 'height' ? 'h-full w-auto' : 'h-auto w-full'
                  }`}
                />
              {:else}
                <div class="text-md px-2 text-center text-gray-500 sm:text-lg">
                  No file selected
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}
      <div class="flex w-full gap-2">
        <FileButton
          name="file"
          width="text-sm block py-1"
          accept={$upload.accept.reduce((str, fileType) => `${str},.${fileType}`, '').substring(1)}
          bind:files>Choose File</FileButton
        >
        <div
          class="w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-md px-2 pt-1 text-sm bg-surface-backdrop-token"
          use:popup={tooltip(fileNameTooltipTarget)}
        >
          <Tooltip
            target={fileNameTooltipTarget}
            label={files?.item(0) ? files?.item(0)?.name || '' : 'No file selected'}
          />
          {#if files?.item(0)}
            {files?.item(0)?.name || ''}
          {:else}
            No file selected...
          {/if}
        </div>
      </div>
      <div class="mt-4">
        <button class="btn variant-filled-primary" disabled={!files?.item(0)} on:click={onUpload}
          >Upload</button
        >
        <button class="variant-ringed-primary btn" on:click={onClose}>Cancel</button>
      </div>
    {/if}
  </div>
{/if}
