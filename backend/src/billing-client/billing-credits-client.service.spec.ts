import axios from 'axios';
import { BillingCreditsClientService } from './billing-credits-client.service';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));

describe('BillingCreditsClientService', () => {
  const createMock = axios.create as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.BILLING_SERVICE_URL;
    delete process.env.BILLING_API_URL;
  });

  it('should fall back to localhost when the internal billing service is unavailable', async () => {
    createMock.mockImplementation(({ baseURL }: { baseURL?: string }) => {
      if (baseURL === 'http://billing-service:8001/api/v1') {
        return {
          post: jest
            .fn()
            .mockRejectedValue(
              new Error('connect ECONNREFUSED billing-service:8001'),
            ),
        };
      }

      if (baseURL === 'http://localhost:8001/api/v1') {
        return {
          post: jest.fn().mockResolvedValue({
            data: {
              success: true,
              balance: 9,
              transactionId: 'tx-123',
            },
          }),
        };
      }

      throw new Error(`Unexpected baseURL: ${baseURL}`);
    });

    const service = new BillingCreditsClientService();
    await expect(
      service.reserveCredits('user-1', 1, { generationType: 'image' }),
    ).resolves.toEqual({
      success: true,
      balance: 9,
      transactionId: 'tx-123',
    });

    expect(createMock).toHaveBeenCalledTimes(2);
    expect(createMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        baseURL: 'http://billing-service:8001/api/v1',
      }),
    );
    expect(createMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        baseURL: 'http://localhost:8001/api/v1',
      }),
    );
  });

  it('should stop retrying when billing returns a real response', async () => {
    const error = new Error('Bad Request');
    (error as Error & { response?: unknown }).response = {
      status: 400,
      data: { message: 'bad request' },
    };

    createMock.mockImplementation(() => ({
      post: jest.fn().mockRejectedValue(error),
    }));

    const service = new BillingCreditsClientService();
    await expect(
      service.reserveCredits('user-1', 1, { generationType: 'image' }),
    ).rejects.toBe(error);

    expect(createMock).toHaveBeenCalledTimes(1);
  });
});
