export interface SessionUser {
  id: number;
  osuUserId: number;
  username: string;
  discordTag: string;
  isAdmin: boolean;
  updatedAt: Date;
}
