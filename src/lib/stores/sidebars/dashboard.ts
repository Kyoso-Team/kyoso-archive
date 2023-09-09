import { writable } from 'svelte/store';
import { DashboardSidebar } from '$components';
import type { sidebar } from '..';

interface Tournament {
  id: number;
  name: string;
  hasBanner: boolean;
}

function createDashboardSidebar() {
  const { subscribe, set } = writable<
    | {
        tournamentsPlaying: Tournament[];
        tournamentsStaffing: Tournament[];
        onCreateTournament: () => void;
      }
    | undefined
  >();

  function create(globalSidebar: typeof sidebar, tournamentsPlaying: Tournament[], tournamentsStaffing: Tournament[], onCreateTournament: () => void) {
    globalSidebar.create(DashboardSidebar, 1);

    set({
      tournamentsPlaying,
      tournamentsStaffing,
      onCreateTournament
    });
  }

  function destroy(globalSidebar: typeof sidebar) {
    globalSidebar.destroy();
    set(undefined);
  }

  return {
    subscribe,
    create,
    destroy
  };
}

export const dashboardSidebar = createDashboardSidebar();
