import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  CreateAbility,
} from '@casl/ability';

export enum WorkspaceAction {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  TransferOwnership = 'transfer_ownership',
}

// Subjects as plain strings with optional attributes
type WorkspaceSubjects =
  | 'Workspace'
  | 'Project'
  | 'User'
  | 'Invite'
  | 'Billing'
  | 'all';

export type AppAbility = MongoAbility<[WorkspaceAction, WorkspaceSubjects]>;
const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;

export interface PermissionUser {
  id: number;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'BILLING' | 'VIEWER';
  ownerId?: number; // workspace owner id for context
}

export function defineAbilityFor(user: PermissionUser): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(
    createAppAbility,
  );

  can(WorkspaceAction.Create, 'Workspace');

  // If the user is the explicit owner, they get everything
  if (user.id === user.ownerId || user.role === 'OWNER') {
    can(WorkspaceAction.Manage, 'all');
  }

  switch (user.role) {
    case 'OWNER':
      // Handled above, but explicitly adding for clarity
      can(WorkspaceAction.Manage, 'all');
      break;

    case 'ADMIN':
      can(WorkspaceAction.Manage, 'all');
      // Admin cannot delete the workspace or transfer ownership
      cannot(
        [WorkspaceAction.Delete, WorkspaceAction.TransferOwnership],
        'Workspace',
      );
      break;

    case 'MEMBER':
      can(WorkspaceAction.Read, 'Workspace');
      can(WorkspaceAction.Read, 'User');
      can(
        [
          WorkspaceAction.Create,
          WorkspaceAction.Read,
          WorkspaceAction.Update,
          WorkspaceAction.Delete,
        ],
        'Project',
      );
      can(
        [
          WorkspaceAction.Create,
          WorkspaceAction.Read,
          WorkspaceAction.Update,
          WorkspaceAction.Delete,
        ],
        'Workflow' as any,
      );
      break;

    case 'VIEWER':
      can(WorkspaceAction.Read, 'Workspace');
      can(WorkspaceAction.Read, 'User');
      can(WorkspaceAction.Read, 'Project');
      can(WorkspaceAction.Read, 'Workflow' as any);
      break;

    case 'BILLING':
      can(WorkspaceAction.Manage, 'Billing');
      can(WorkspaceAction.Read, 'Workspace');
      can(WorkspaceAction.Read, 'Project');
      break;

    default:
      break;
  }

  return build();
}
