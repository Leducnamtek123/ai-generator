import { PersonalBillingController } from './personal-billing.controller';
import { BillingAccountsService } from '../billing-accounts/billing-accounts.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

describe('PersonalBillingController', () => {
  const user = {
    id: 'user-1',
    email: 'user@example.com',
    role: null,
  } as AuthenticatedUser;

  const service = {
    getSummary: jest.fn(),
  } as unknown as jest.Mocked<BillingAccountsService>;

  const controller = new PersonalBillingController(service);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve billing summary for the authenticated user only', () => {
    service.getSummary.mockResolvedValue({
      scopeType: 'user',
      scopeId: String(user.id),
      plan: null,
      status: 'free',
      includedCreditsGranted: 0,
      includedCreditsRemaining: 0,
      topUpCreditsPurchased: 0,
      topUpCreditsBalance: 0,
      totalCredits: 0,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      renewalAt: null,
      metadata: null,
    });

    const result = controller.getMe(user);

    expect(service.getSummary).toHaveBeenCalledWith('user', user.id);
    return expect(result).resolves.toEqual(
      expect.objectContaining({
        scopeId: String(user.id),
      }),
    );
  });
});
