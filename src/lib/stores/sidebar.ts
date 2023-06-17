import { writable } from 'svelte/store';

type SectionIcon = 'settings' | 'pooling' | 'referee' | 'stats calc' | 'pickems' | 'regs';

function createSidebar() {
  const { subscribe, update, set } = writable<
    | {
        show: boolean;
        selectedLink?: {
          inSection: string;
          inSubsection: string;
          label: string;
        };
        sections: Map<
          string,
          {
            icon: SectionIcon;
            subsections: Map<
              string,
              {
                label: string;
                path: string;
              }[]
            >;
          }
        >;
      }
    | undefined
  >();
  const selectedSection = writable<string | undefined>();

  function create() {
    set({
      show: true,
      sections: new Map()
    });
  }

  function destroy() {
    set(undefined);
  }

  function show() {
    update((sidebar) => {
      if (!sidebar) return sidebar;

      sidebar.show = true;
      return Object.assign(sidebar);
    });
  }

  function hide() {
    update((sidebar) => {
      if (!sidebar) return sidebar;

      sidebar.show = false;
      return Object.assign(sidebar);
    });
  }

  function setSection(sectionLabel: string, icon: SectionIcon) {
    update((sidebar) => {
      if (!sidebar) return sidebar;

      sidebar.sections.set(sectionLabel, {
        icon,
        subsections: new Map()
      });

      return Object.assign(sidebar);
    });

    function setSubsection(
      label: string,
      links: {
        label: string;
        path: string;
      }[]
    ) {
      update((sidebar) => {
        if (!sidebar) return sidebar;

        let section = sidebar.sections.get(sectionLabel);
        if (!section) return;

        section.subsections.set(label, links);
        return Object.assign(sidebar);
      });
    }

    return {
      setSubsection
    };
  }

  function setSelected(sectionLabel: string, subsectionLabel: string, linkLabel: string) {
    selectedSection.set(sectionLabel);

    update((sidebar) => {
      if (!sidebar) return sidebar;

      sidebar.selectedLink = {
        inSection: sectionLabel,
        inSubsection: subsectionLabel,
        label: linkLabel
      };

      return Object.assign(sidebar);
    });
  }

  return {
    subscribe,
    create,
    destroy,
    show,
    hide,
    setSection,
    selectedSection,
    setSelected
  };
}

export const sidebar = createSidebar();
