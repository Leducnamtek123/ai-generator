import { SetMetadata } from '@nestjs/common';
import { WorkspaceAction } from './permissions';

export interface RequiredPermission {
  action: WorkspaceAction;
  subject: string;
}

export const CHECK_PERMISSIONS_KEY = 'check_permissions';
export const CheckPermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(CHECK_PERMISSIONS_KEY, permissions);
