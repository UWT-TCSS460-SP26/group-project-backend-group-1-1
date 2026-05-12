type AuthorSource = {
  id: number;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type Author = {
  id: number;
  displayName: string;
};

export const formatAuthor = (user: AuthorSource): Author => ({
  id: user.id,
  displayName:
    user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
});
