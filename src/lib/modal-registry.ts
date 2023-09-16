import LinkModal from '$components/modals/LinkModal.svelte';
import type { ModalComponent } from '@skeletonlabs/skeleton';

export const modalRegistry: Record<string, ModalComponent> = {
  linkModal: { ref: LinkModal }
};
