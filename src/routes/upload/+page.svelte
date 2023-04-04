<script lang="ts">
  let uploadedImage: string;

  function handleImageUpload(e: Event) {
    const image = (e.target as HTMLInputElement)?.files?.[0]
    if (!image) return
    uploadedImage = URL.createObjectURL(image)
  }
</script>

<form method="post" enctype="multipart/form-data" action="./upload/image">
	<label>
		Upload an image. ANY image.
		<input type="file" name="file" accept="image/*" on:change={handleImageUpload} />
	</label>
	<button>Submit</button>
	{#if uploadedImage}
    <div class="mt-4">
      <img src={uploadedImage} style="max-width: 50ch;" alt="" />
    </div>
  {/if}
</form>
