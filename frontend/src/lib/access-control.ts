export type RoleLike =
  | {
      id?: string | number | null;
      name?: string | null;
    }
  | null
  | undefined;

export type UserWithRole =
  | {
      role?: RoleLike;
    }
  | null
  | undefined;

const ADMIN_ROLE_IDS = new Set(['1']);
const ADMIN_ROLE_NAMES = new Set(['admin', 'administrator', 'owner']);

export const isAdminRole = (role: RoleLike) => {
  if (!role) return false;

  const id = role.id === undefined || role.id === null ? '' : String(role.id);
  const name = (role.name ?? '').toLowerCase().trim();

  return ADMIN_ROLE_IDS.has(id) || ADMIN_ROLE_NAMES.has(name);
};

export const canAccessAdmin = (user: UserWithRole) => isAdminRole(user?.role);
