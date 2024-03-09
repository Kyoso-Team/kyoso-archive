import { get, writable } from 'svelte/store';
import { pushState } from '$app/navigation';
import { trpc } from '$lib/trpc';
import { page } from '$app/stores';
import { displayError } from '$lib/utils';
import type { ToastStore } from '@skeletonlabs/skeleton';
import type { Ban, User } from '$db';
import type { TRPCRouter } from '$types';

export interface Context {
  lookedUpUser?: TRPCRouter['users']['getUser'];
  selectedUser?: Pick<typeof User.$inferSelect, 'id' | 'admin' | 'approvedHost'>;
  issueBanTo?: Pick<typeof User.$inferSelect, 'id'>;
  banToRevoke?: Pick<typeof Ban.$inferSelect, 'id'>;
  ownerId: number;
  isCurrentUserTheOwner: boolean;
  ctrl: boolean;
  showLookedUpUser: boolean;
  showChangeAdminStatusPrompt: boolean;
  showChangeHostStatusPrompt: boolean;
  showBanUserForm: boolean;
  showRevokeBanForm: boolean;
}

export default function createContextStore(toast: ToastStore, ownerId: number, isCurrentUserTheOwner: boolean) {
  const { subscribe, update } = writable<Context>({
    ctrl: false,
    showLookedUpUser: false,
    showChangeAdminStatusPrompt: false,
    showChangeHostStatusPrompt: false,
    showBanUserForm: false,
    showRevokeBanForm: false,
    ownerId,
    isCurrentUserTheOwner
  });

  async function lookupUser(userId: number) {
    setShowLookedUpUser(true);
    
    try {
      const lookedUpUser = await trpc(get(page)).users.getUser.query({
        userId
      });

      pushState(`/admin/user/${userId}`, {
        adminUsersPage: {
          lookedUpUser
        }
      });
    } catch (err) {
      setShowLookedUpUser(false);
      history.back();
      displayError(toast, err);
    }
  }

  function setShowLookedUpUser(showLookedUpUser: boolean) {
    update((ctx) => {
      ctx.showLookedUpUser = showLookedUpUser;
      return Object.assign({}, ctx);
    });
  }

  function toggleShowChangeAdminStatusPrompt() {
    update((ctx) => {
      ctx.showChangeAdminStatusPrompt = !ctx.showChangeAdminStatusPrompt;
      return Object.assign({}, ctx);
    });
  }

  function toggleShowChangeHostStatusPrompt() {
    update((ctx) => {
      ctx.showChangeHostStatusPrompt = !ctx.showChangeHostStatusPrompt;
      return Object.assign({}, ctx);
    });
  }

  function toggleShowBanUserForm() {
    update((ctx) => {
      ctx.showBanUserForm = !ctx.showBanUserForm;
      return Object.assign({}, ctx);
    });
  }

  function toggleShowRevokeBanForm() {
    update((ctx) => {
      ctx.showRevokeBanForm = !ctx.showRevokeBanForm;
      return Object.assign({}, ctx);
    });
  }

  function changeCtrlStatus(ctrl: boolean) {
    update((ctx) => {
      ctx.ctrl = ctrl;
      return Object.assign({}, ctx);
    });
  }

  function setSelectedUser(user: Context['selectedUser']) {
    update((ctx) => {
      ctx.selectedUser = user;
      return Object.assign({}, ctx);
    });
  }

  function setIssueBanTo(user: Context['issueBanTo']) {
    update((ctx) => {
      ctx.issueBanTo = user;
      return Object.assign({}, ctx);
    });
  }

  function setBanToRevoke(ban: Context['banToRevoke']) {
    update((ctx) => {
      ctx.banToRevoke = ban;
      return Object.assign({}, ctx);
    });
  }

  return {
    subscribe,
    lookupUser,
    setShowLookedUpUser,
    toggleShowChangeAdminStatusPrompt,
    toggleShowChangeHostStatusPrompt,
    toggleShowBanUserForm,
    toggleShowRevokeBanForm,
    changeCtrlStatus,
    setSelectedUser,
    setIssueBanTo,
    setBanToRevoke
  };
}