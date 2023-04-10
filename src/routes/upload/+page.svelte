<script lang="ts">
  let uploadedImage: string;

  function previewImageUpload(e: Event) {
    const image = (e.target as HTMLInputElement)?.files?.[0]
    if (!image) return
    uploadedImage = URL.createObjectURL(image)
  }

  function uploadFile() {
    var xhr = new XMLHttpRequest()
    xhr.open("POST", "./uploads/new") 
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        let attr = xhr.status < 300 ? "src" : "alt"
        let div = document.getElementById("uploadedImage")
        if (div) {
          div.setAttribute(attr, xhr.responseText)
        }
      }
    }
    
    let form = document.getElementById("upload") as HTMLFormElement
    if (form) {
      var formData = new FormData(form)
      xhr.send(formData)
      return true
    }

    return false
  }
</script>

<form id="upload" method="post" enctype="multipart/form-data" action="./uploads/new">
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
</form>

<button on:click={uploadFile}>Submit</button>

<!-- svelte-ignore a11y-img-redundant-alt -->
<img id="uploadedImage" alt="The image should appear here once uploaded!"/>
