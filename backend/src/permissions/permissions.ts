import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  CreateAbility,
} from '@casl/ability';

export enum OrgAction {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  TransferOwnership = 'transfer_ownership',
}

// Subjects as plain strings with optional attributes
type OrgSubjects =
  | 'Organization'
  | 'Project'
  | 'User'
  | 'Invite'
  | 'Billing'
  | 'all';

export type AppAbility = MongoAbility<[OrgAction, OrgSubjects]>;
const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;

export interface PermissionUser {
  id: number;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'BILLING' | 'VIEWER';
  ownerId?: number; // org owner id for context
}

export function defineAbilityFor(user: PermissionUser): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(
    createAppAbility,
  );

  can(OrgAction.Create, 'Organization');

  // If the user is the explicit owner, they get everything
  if (user.id === user.ownerId || user.role === 'OWNER') {
    can(OrgAction.Manage, 'all');
  }

  switch (user.role) {
    case 'OWNER':
      // Handled above, but explicitly adding for clarity
      can(OrgAction.Manage, 'all');
      break;

    case 'ADMIN':
      can(OrgAction.Manage, 'all');
      // Admin cannot delete the organization or transfer ownership
      cannot([OrgAction.Delete, OrgAction.TransferOwnership], 'Organization');
      break;

    case 'MEMBER':
      can(OrgAction.Read, 'Organization');
      can(OrgAction.Read, 'User');
      can(
        [OrgAction.Create, OrgAction.Read, OrgAction.Update, OrgAction.Delete],
        'Project',
      );
      can(
        [OrgAction.Create, OrgAction.Read, OrgAction.Update, OrgAction.Delete],
        'Workflow' as any,
      );
      break;

    case 'VIEWER':
      can(OrgAction.Read, 'Organization');
      can(OrgAction.Read, 'User');
      can(OrgAction.Read, 'Project');
      can(OrgAction.Read, 'Workflow' as any);
      break;

    case 'BILLING':
      can(OrgAction.Manage, 'Billing');
      can(OrgAction.Read, 'Organization');
      can(OrgAction.Read, 'Project');
      break;

    default:
      break;
  }

  return build();
}
