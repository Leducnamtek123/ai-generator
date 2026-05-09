import { QueueReliabilityService } from './queue-reliability.service';

describe('QueueReliabilityService', () => {
  const deadLetterQueue = {
    add: jest.fn().mockResolvedValue(undefined),
  };

  const service = new QueueReliabilityService(deadLetterQueue as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('archives a failed job only after the final retry', async () => {
    const job = {
      id: 'job-1',
      name: 'generate-image',
      attemptsMade: 3,
      opts: {
        attempts: 3,
      },
      data: {
        workflowId: 'workflow-1',
        params: { prompt: 'hello' },
      },
    } as any;

    await expect(
      service.archiveFailure(
        'generation',
        job,
        new Error('provider offline'),
        { workflowId: 'workflow-1' },
      ),
    ).resolves.toBe(true);

    expect(deadLetterQueue.add).toHaveBeenCalledWith(
      'failed-job',
      expect.objectContaining({
        sourceQueue: 'generation',
        jobId: 'job-1',
        jobName: 'generate-image',
        attemptsMade: 3,
        maxAttempts: 3,
        error: expect.objectContaining({
          message: 'provider offline',
        }),
      }),
      expect.objectContaining({
        jobId: 'dlq:generation:job-1',
      }),
    );
  });

  it('skips the dead-letter queue while retries remain', async () => {
    const job = {
      id: 'job-2',
      name: 'generate-image',
      attemptsMade: 1,
      opts: {
        attempts: 3,
      },
      data: {},
    } as any;

    await expect(
      service.archiveFailure('generation', job, new Error('try again')),
    ).resolves.toBe(false);

    expect(deadLetterQueue.add).not.toHaveBeenCalled();
  });
});
