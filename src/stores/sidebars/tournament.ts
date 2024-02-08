// import { writable } from 'svelte/store';
// import { TournamentSidebar } from '$components';
// import type { sidebar } from '..';

// type SectionIcon = 'settings' | 'pooling' | 'referee' | 'stats calc' | 'pickems' | 'regs';

// function createTournamentSidebar() {
//   const { subscribe, update, set } = writable<
//     | {
//         selectedLink?: {
//           inSection: string;
//           inSubsection: string;
//           label: string;
//         };
//         sections: Map<
//           string,
//           {
//             icon: SectionIcon;
//             subsections: Map<
//               string,
//               {
//                 label: string;
//                 path: string;
//               }[]
//             >;
//           }
//         >;
//       }
//     | undefined
//   >();
//   const selectedSection = writable<string | undefined>();

//   function create(globalSidebar: typeof sidebar) {
//     globalSidebar.create(TournamentSidebar, 2);

//     set({
//       sections: new Map()
//     });
//   }

//   function destroy(globalSidebar: typeof sidebar) {
//     globalSidebar.destroy();
//     set(undefined);
//   }

//   function setSection(sectionLabel: string, icon: SectionIcon) {
//     update((sidebar) => {
//       if (!sidebar) return sidebar;

//       sidebar.sections.set(sectionLabel, {
//         icon,
//         subsections: new Map()
//       });

//       return Object.assign(sidebar);
//     });

//     function setSubsection(
//       label: string,
//       links: {
//         label: string;
//         path: string;
//       }[]
//     ) {
//       update((sidebar) => {
//         if (!sidebar) return sidebar;

//         let section = sidebar.sections.get(sectionLabel);
//         if (!section) return;

//         section.subsections.set(label, links);
//         return Object.assign(sidebar);
//       });
//     }

//     return {
//       setSubsection
//     };
//   }

//   function setSelected(sectionLabel: string, subsectionLabel: string, linkLabel: string) {
//     selectedSection.set(sectionLabel);

//     update((sidebar) => {
//       if (!sidebar) return sidebar;

//       sidebar.selectedLink = {
//         inSection: sectionLabel,
//         inSubsection: subsectionLabel,
//         label: linkLabel
//       };

//       return Object.assign(sidebar);
//     });
//   }

//   return {
//     subscribe,
//     create,
//     destroy,
//     setSection,
//     selectedSection,
//     setSelected
//   };
// }

// export const tournamentSidebar = createTournamentSidebar();
