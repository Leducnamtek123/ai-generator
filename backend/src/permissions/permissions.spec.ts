import { defineAbilityFor, OrgAction } from './permissions';

describe('defineAbilityFor', () => {
  it('should allow authenticated users to create organizations', () => {
    const ability = defineAbilityFor({
      id: 1,
      role: 'MEMBER',
    });

    expect(ability.can(OrgAction.Create, 'Organization')).toBe(true);
  });
});
