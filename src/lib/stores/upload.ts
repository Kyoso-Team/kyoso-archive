import { writable } from 'svelte/store';
import { Upload } from '$classes';
import type { FileType } from '$types';

interface UploadForm {
  accept: FileType[];
  onUpload: (upload: Upload) => Promise<string> | string;
  isImg?: boolean;
  imgAspectRatio: string;
  limitBy: 'width' | 'height';
}

function createUpload() {
  const { subscribe, set } = writable<UploadForm | undefined>();

  function create(form: Omit<UploadForm, 'limitBy' | 'imgAspectRatio'> & {
    limitBy?: 'width' | 'height';
    imgAspectRatio?: string;
  }) {
    form.limitBy ||= 'height';
    form.imgAspectRatio ||= '21/9';
    
    set(form as UploadForm);
  }

  function destroy() {
    set(undefined);
  }

  async function uploadFile(currentForm: UploadForm, file: File | null | undefined) {
    if (!file) return 'No file was selected.';

    let upload = new Upload(file);
    return await currentForm.onUpload(upload);
  }

  return {
    subscribe,
    create,
    destroy,
    uploadFile
  };
}

export const upload = createUpload();
