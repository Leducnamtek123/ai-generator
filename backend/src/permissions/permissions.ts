import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  CreateAbility,
  InferSubjects,
  ExtractSubjectType,
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
  role: 'ADMIN' | 'MEMBER' | 'BILLING';
  ownerId?: number; // org owner id for context
}

export function defineAbilityFor(user: PermissionUser): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(
    createAppAbility,
  );

  switch (user.role) {
    case 'ADMIN':
      can(OrgAction.Manage, 'all');
      // Only owner can transfer/update/delete org
      cannot(
        [OrgAction.TransferOwnership, OrgAction.Update, OrgAction.Delete],
        'Organization',
      );
      if (user.ownerId === user.id) {
        can(
          [OrgAction.TransferOwnership, OrgAction.Update, OrgAction.Delete],
          'Organization',
        );
      }
      can(OrgAction.Read, 'User');
      break;

    case 'MEMBER':
      can(OrgAction.Read, 'User');
      can([OrgAction.Create, OrgAction.Read], 'Project');
      // Members can only update/delete their own projects
      // (ownership checked at service level)
      can(OrgAction.Read, 'Organization');
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
