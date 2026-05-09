import { QueueHealthService } from './queue-health.service';

describe('QueueHealthService', () => {
  const makeQueue = (counts: Record<string, number>) => ({
    getJobCounts: jest.fn().mockResolvedValue(counts),
  });

  it('returns queue snapshots for all registered queues', async () => {
    const service = new QueueHealthService(
      makeQueue({ waiting: 1 }) as any,
      makeQueue({ waiting: 2 }) as any,
      makeQueue({ waiting: 3 }) as any,
      makeQueue({ waiting: 4 }) as any,
      makeQueue({ waiting: 5 }) as any,
      makeQueue({ waiting: 6 }) as any,
    );

    await expect(service.snapshot()).resolves.toEqual(
      expect.objectContaining({
        queues: expect.arrayContaining([
          expect.objectContaining({
            queue: 'generation',
            counts: expect.objectContaining({
              waiting: 1,
            }),
          }),
          expect.objectContaining({
            queue: 'dead-letter',
            counts: expect.objectContaining({
              waiting: 6,
            }),
          }),
        ]),
      }),
    );
  });
});
