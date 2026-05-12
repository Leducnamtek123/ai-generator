import { defineAbilityFor, WorkspaceAction } from './permissions';

describe('defineAbilityFor', () => {
  it('should allow authenticated users to create workspaces', () => {
    const ability = defineAbilityFor({
      id: 1,
      role: 'MEMBER',
    });

    expect(ability.can(WorkspaceAction.Create, 'Workspace')).toBe(true);
  });
});
