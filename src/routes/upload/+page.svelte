<script lang="ts">
  let uploadedImage: string;
  let form: HTMLFormElement;
  let img: HTMLImageElement;

  function previewImageUpload(e: Event) {
    const image = (e.target as HTMLInputElement)?.files?.[0]
    if (!image) return
    uploadedImage = URL.createObjectURL(image)
  }

  async function uploadFile() {
    let fileUpload = await fetch("./uploads/new", {
      method: "POST",
      body: new FormData(form)
    })

    let attr = fileUpload.ok ? "src" : "alt"
    img.setAttribute(attr, await fileUpload.text())
  }
</script>

<form id="upload" bind:this={form} on:submit|preventDefault={uploadFile}>
  <label>
    Upload an image. ANY image.
    <input type="file" name="file" accept="image/*" on:change={previewImageUpload} />
  </label>
  <input type="hidden" name="uploadType" value="tournamentLogo" />
  <input type="hidden" name="targetType" value="tournament" />
  <input type="hidden" name="targetId" value="1" />
  {#if uploadedImage}
    <div class="mt-4">
      <img src={uploadedImage} style="max-width: 50ch;" alt="" />
    </div>
  {/if}
  <button>Submit</button>
</form>

<!-- svelte-ignore a11y-img-redundant-alt -->
<img id="uploadedImage" bind:this={img} alt="The image should appear here once uploaded!"/>
