export interface Asset<Put extends Record<string, any>, Delete extends Record<string, any>> {
  put: Put;
  delete: Delete;
}

export interface Assets {
  tournamentBanner: Asset<
    {
      file: File;
      tournamentId: number;
    },
    {
      tournamentId: number;
    }
  >;
  tournamentLogo: Asset<
    {
      file: File;
      tournamentId: number;
    },
    {
      tournamentId: number;
    }
  >;
}
